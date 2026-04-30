import { getMonth, parseISO } from "date-fns";

import pb from "@/lib/pocketbase";
import type { Accion } from "@/types/accion";
import type { Compra } from "@/types/compra";
import type { Factura } from "@/types/factura";
import type { IngresoMensualSep } from "@/types/ingreso-mensual-sep";
import type { OrdenCompra } from "@/types/orden-compra";
import type { RrhhSep } from "@/types/rrhh-sep";

export interface SepReportStats {
  totalInvestment: number;
  totalOrders: number;
  monthlyEvolution: { month: number; amount: number; count: number }[];
  bySchool: { name: string; amount: number; count: number }[];
}

/* ─────────────────────────────────────────────
   KPIs individuales por establecimiento
   ───────────────────────────────────────────── */

export interface SchoolSepKpis {
  schoolId: string;
  schoolName: string;
  // Presupuesto
  presupuestoTotal: number;
  presupuestoProyectado: number;
  // Compras
  totalCompras: number;
  inversionTotal: number;
  comprasFacturadas: number;
  comprasObligadas: number;
  // RRHH
  gastoRrhh: number;
  rrhhProyectado: number;
  // Ejecución
  porcentajeEjecucion: number;
  porcentajeFacturado: number;
  disponible: number;
  // Acciones
  totalAcciones: number;
  montoAcciones: number;
  // Evolución mensual
  monthlyEvolution: { month: number; amount: number; count: number }[];
  // Distribución para stacked chart
  distribucion: {
    facturado: number;
    obligado: number;
    rrhh: number;
    disponible: number;
  };
}

const MONTH_ORDER = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export async function getSepSchoolReport(schoolId: string, schoolName: string, year: number): Promise<SchoolSepKpis> {
  const startYear = `${year}-01-01 00:00:00`;
  const endYear = `${year}-12-31 23:59:59`;

  // ── Parallel fetch ──
  const [comprasResult, ingresosResult, rrhhResult, accionesResult] = await Promise.all([
    // 1. Compras SEP del establecimiento en el año
    pb
      .collection("compras")
      .getFullList<Compra>({
        filter: `subvencion.nombre = 'Ley SEP' && unidad_requirente = '${schoolId}' && ((fecha_inicio >= '${startYear}' && fecha_inicio <= '${endYear}') || (fecha_inicio = '' && created >= '${startYear}' && created <= '${endYear}'))`,
        sort: "created",
      }),
    // 2. Ingresos mensuales SEP
    pb
      .collection("ingresos_mensuales_sep")
      .getFullList<IngresoMensualSep>({
        filter: `requirente = '${schoolId}' && anio = ${year}`,
      }),
    // 3. RRHH SEP
    pb
      .collection("sep_rrhh")
      .getFullList<RrhhSep>({
        filter: `escuelas = '${schoolId}' && anio = ${year}`,
      }),
    // 4. Acciones del establecimiento
    pb
      .collection("acciones")
      .getFullList<Accion>({
        filter: `establecimiento = '${schoolId}'`,
      }),
  ]);

  // ── Compras: fetch OCs y Facturas en batches ──
  const compraIds = comprasResult.map((c) => c.id);
  let allOCs: OrdenCompra[] = [];
  let allFacturas: Factura[] = [];

  if (compraIds.length > 0) {
    const batchSize = 50;
    const ocPromises: Promise<OrdenCompra[]>[] = [];
    const facPromises: Promise<Factura[]>[] = [];

    for (let i = 0; i < compraIds.length; i += batchSize) {
      const batch = compraIds.slice(i, i + batchSize);
      const compraFilter = batch.map((id) => `compra = '${id}'`).join(" || ");
      ocPromises.push(pb.collection("ordenes_compra").getFullList<OrdenCompra>({ filter: compraFilter }));
      facPromises.push(pb.collection("facturas").getFullList<Factura>({ filter: compraFilter }));
    }

    const [ocResults, facResults] = await Promise.all([Promise.all(ocPromises), Promise.all(facPromises)]);
    allOCs = ocResults.flat();
    allFacturas = facResults.flat();
  }

  // ── Agregaciones ──
  const inversionTotal = allOCs.reduce((sum, oc) => sum + (oc.oc_valor || 0), 0);
  const comprasFacturadas = allFacturas.reduce((sum, f) => sum + (f.monto || 0), 0);
  const comprasObligadas = Math.max(0, inversionTotal - comprasFacturadas);

  // Presupuesto (ingresos total_reflejar)
  const presupuestoTotal = ingresosResult.reduce((sum, i) => sum + (i.total_reflejar || 0), 0);

  // Presupuesto proyectado (último ingreso mensual * meses restantes)
  let presupuestoProyectado = 0;
  let latestMonthIndex = -1;
  let latestMonthValue = 0;
  for (const item of ingresosResult) {
    const monthIdx = MONTH_ORDER.indexOf(item.mes);
    if (monthIdx === -1) continue; // skip "Saldo Inicial"
    if (monthIdx >= latestMonthIndex) {
      latestMonthIndex = monthIdx;
      latestMonthValue = item.total_reflejar || 0;
    }
  }
  if (latestMonthIndex >= 0) {
    presupuestoProyectado = latestMonthValue * (11 - latestMonthIndex);
  }

  // RRHH
  const gastoRrhh = rrhhResult.reduce((sum, r) => sum + (r.total || 0), 0);

  // RRHH Proyectado (fill-forward pattern from proyeccion-sep)
  let rrhhProyectado = 0;
  const rrhhMonthlyData: Record<string, number> = {};
  for (const item of rrhhResult) {
    rrhhMonthlyData[item.mes] = item.total;
  }
  let lastRrhhValue = 0;
  for (const month of MONTH_ORDER) {
    const recordValue = rrhhMonthlyData[month];
    const hasRecord = recordValue !== undefined;
    if (hasRecord) {
      lastRrhhValue = recordValue || 0;
    } else {
      if (lastRrhhValue > 0) {
        rrhhProyectado += lastRrhhValue;
      }
    }
  }

  // Ejecución
  const totalEjecutado = comprasFacturadas + comprasObligadas + gastoRrhh;
  const porcentajeEjecucion = presupuestoTotal > 0 ? (totalEjecutado / presupuestoTotal) * 100 : 0;
  const porcentajeFacturado = presupuestoTotal > 0 ? (comprasFacturadas / presupuestoTotal) * 100 : 0;
  const disponible = presupuestoTotal - comprasFacturadas - comprasObligadas - gastoRrhh;

  // Acciones
  const totalAcciones = accionesResult.length;
  const montoAcciones = accionesResult.reduce((sum, a) => sum + (a.monto_sep || 0), 0);

  // Evolución mensual de compras (por OCs)
  const monthlyMap = new Map<number, { amount: number; count: number }>();
  for (let i = 0; i < 12; i++) {
    monthlyMap.set(i, { amount: 0, count: 0 });
  }

  // Map compraId -> compra for month extraction
  const compraMap = new Map(comprasResult.map((c) => [c.id, c]));
  for (const oc of allOCs) {
    const compra = compraMap.get(oc.compra);
    if (compra) {
      const dateStr = compra.fecha_inicio || compra.created;
      const itemMonth = getMonth(parseISO(dateStr));
      const mStats = monthlyMap.get(itemMonth);
      if (mStats) {
        mStats.amount += oc.oc_valor || 0;
        mStats.count += 1;
      }
    }
  }

  const monthlyEvolution = Array.from(monthlyMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([m, stats]) => ({ month: m, ...stats }));

  return {
    schoolId,
    schoolName,
    presupuestoTotal,
    presupuestoProyectado,
    totalCompras: comprasResult.length,
    inversionTotal,
    comprasFacturadas,
    comprasObligadas,
    gastoRrhh,
    rrhhProyectado,
    porcentajeEjecucion,
    porcentajeFacturado,
    disponible,
    totalAcciones,
    montoAcciones,
    monthlyEvolution,
    distribucion: {
      facturado: comprasFacturadas,
      obligado: comprasObligadas,
      rrhh: gastoRrhh,
      disponible: Math.max(0, disponible),
    },
  };
}

export async function getSepReport(year: number, schoolId?: string, month?: number): Promise<SepReportStats> {
  // 1. Fetch all purchases for the year
  // We filter by creation date to limit the dataset
  const startYear = `${year}-01-01 00:00:00`;
  const endYear = `${year}-12-31 23:59:59`;

  // Fetching large dataset to aggregate in memory
  // In a production app with huge data, this should be done via backend views or separate API endpoints
  const records = await pb.collection("compras").getFullList<Compra>({
    filter: `created >= "${startYear}" && created <= "${endYear}"`,
    expand: "subvencion,unidad_requirente,ordenes_compra(compra)",
    sort: "created",
  });

  // 2. Filter by "SEP" subvention and optional filters
  const validItems = records.filter((item) => {
    // Filter by SEP Subvention name
    const subName = item.expand?.subvencion?.nombre?.toUpperCase() || "";
    if (!subName.includes("SEP")) return false;

    // Filter by School if provided
    if (schoolId && item.unidad_requirente !== schoolId) return false;

    // Filter by Month if provided (based on created date or oc_fecha? Usually created date of request or OC date)
    // User asked for "filtros por... meses".
    // Let's use the creation date for consistency with the Year filter.
    if (month !== undefined) {
      const itemsMonth = getMonth(parseISO(item.created)); // 0-11
      if (itemsMonth !== month) return false;
    }

    return true;
  });

  // 3. Aggregate Data
  let totalInvestment = 0;
  let totalOrders = 0; // Requests count? Or OC count? "Sumar compras". Let's count Requests that have SEP.
  const monthlyMap = new Map<number, { amount: number; count: number }>();
  const schoolMap = new Map<string, { amount: number; count: number }>();

  // Initialize months 0-11
  for (let i = 0; i < 12; i++) {
    monthlyMap.set(i, { amount: 0, count: 0 });
  }

  validItems.forEach((item) => {
    // Calculate Amount: Sum of related OCs
    let itemAmount = 0;
    const ocs = item.expand?.["ordenes_compra(compra)"] || [];

    if (ocs.length > 0) {
      itemAmount = ocs.reduce((sum, oc) => sum + (oc.oc_valor || 0), 0);
    } else {
      // If user wants ONLY real purchases (generated OCs), we should maybe skip items with 0 OCs?
      // "Sumar solo las compras... subencion Ley SEP"
      // If there is no OC, amount is 0. That's fine.
    }

    // If amount is 0, do we count it? Maybe it's pending.
    // Let's count it in "totalOrders" (Requests) but amount contributes 0.

    totalInvestment += itemAmount;
    totalOrders++;

    // Monthly Aggregation
    const itemMonth = getMonth(parseISO(item.created));
    const mStats = monthlyMap.get(itemMonth);
    if (mStats) {
      mStats.amount += itemAmount;
      mStats.count += 1;
    }

    // School Aggregation
    const schoolName = item.expand?.unidad_requirente?.nombre || "Sin Asignar";
    const sStats = schoolMap.get(schoolName) || { amount: 0, count: 0 };
    sStats.amount += itemAmount;
    sStats.count += 1;
    schoolMap.set(schoolName, sStats);
  });

  const monthlyEvolution = Array.from(monthlyMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([m, stats]) => ({ month: m, ...stats }));

  const bySchool = Array.from(schoolMap.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.amount - a.amount);

  return {
    totalInvestment,
    totalOrders,
    monthlyEvolution,
    bySchool,
  };
}
