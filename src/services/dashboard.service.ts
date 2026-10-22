import { differenceInDays, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

import pb from "@/lib/pocketbase";
import type { Compra } from "@/types/compra";
import type { OrdenCompra } from "@/types/orden-compra";

export interface StagnantCompra {
  id: string;
  numero_ordinario: number;
  unidad: string;
  comprador: string;
  estado: string;
  days: number;
}

export interface DashboardStats {
  year: number;
  totalSpent: number;
  totalOrders: number;
  totalAnuladas: number;
  activeUnits: number;
  totalSavings: number;
  conversionRate: number;
  avgCycleTime: number;
  cycleTimeTrend: { month: string; days: number }[];
  volumeTrend: { month: string; count: number }[];
  funnelData: { stage: string; count: number; fill: string }[];
  stagnationCount: number;
  stagnantCompras: StagnantCompra[];
  rankingCompradores: { name: string; amount: number; count: number }[];
  rankingUnidades: { name: string; amount: number; count: number }[];
  rankingSubvenciones: { name: string; amount: number; count: number }[];
}

/** Estados que se consideran "pendientes" para la alerta de estancamiento */
const PENDING_STATES = ["Iniciado", "Asignado", "En Proceso"];
/** Estados que se consideran compra terminada */
const COMPLETED_STATES = ["Comprado", "Facturado", "En Bodega", "Entregado"];
/** Días sin movimiento para considerar una solicitud estancada */
export const STAGNATION_DAYS = 10;

const getRequestDate = (item: Compra) => item.fecha_solicitud || item.fecha_inicio || item.created;

export async function getDashboardStats(year: number = new Date().getFullYear()): Promise<DashboardStats> {
  const start = `${year}-01-01`;
  const end = `${year + 1}-01-01`;

  // Mismo criterio de año que el resto del sistema: fecha_inicio, con respaldo en created.
  const yearFilter = `((fecha_inicio >= "${start}" && fecha_inicio < "${end}") || (fecha_inicio = "" && created >= "${start}" && created < "${end}"))`;

  // Consultas en paralelo, trayendo TODOS los registros del año (sin tope de 1000)
  // y solo los campos necesarios para minimizar el payload.
  const [allCompras, allOcs] = await Promise.all([
    pb.collection("compras").getFullList<Compra>({
      filter: yearFilter,
      sort: "-created",
      expand: "unidad_requirente,comprador,subvencion",
      fields:
        "id,numero_ordinario,estado,presupuesto,comprador,unidad_requirente,subvencion,fecha_inicio,fecha_solicitud,created,updated,expand.unidad_requirente.nombre,expand.comprador.name,expand.subvencion.nombre",
      batch: 1000,
    }),
    // Las OCs de compras del año se crean desde ese año en adelante
    pb
      .collection("ordenes_compra")
      .getFullList<OrdenCompra>({
        filter: `created >= "${start}"`,
        fields: "compra,oc_valor,oc_fecha",
        batch: 1000,
      }),
  ]);

  // Agrupar OCs por compra
  const ocsByCompra = new Map<string, OrdenCompra[]>();
  for (const oc of allOcs) {
    if (!oc.compra) continue;
    const list = ocsByCompra.get(oc.compra);
    if (list) list.push(oc);
    else ocsByCompra.set(oc.compra, [oc]);
  }

  // Excluir anuladas de todos los indicadores
  const totalAnuladas = allCompras.filter((c) => c.estado === "Anulado").length;
  const items = allCompras.filter((c) => c.estado !== "Anulado");

  const compradoresMap = new Map<string, { amount: number; count: number }>();
  const unidadesMap = new Map<string, { amount: number; count: number }>();
  const subvencionesMap = new Map<string, { amount: number; count: number }>();
  const monthlyCycleMap = new Map<string, { totalDays: number; count: number }>();
  const monthlyVolumeMap = new Map<string, number>();

  let totalSpent = 0;
  let totalSavings = 0;
  let totalDays = 0;
  let validCycleCount = 0;
  let totalRequestsWithOc = 0;
  let countAssigned = 0;
  let countCompleted = 0;
  const stagnantCompras: StagnantCompra[] = [];
  const now = new Date();

  const addTo = (map: Map<string, { amount: number; count: number }>, key: string, amount: number) => {
    const stats = map.get(key) || { amount: 0, count: 0 };
    stats.amount += amount;
    stats.count += 1;
    map.set(key, stats);
  };

  for (const item of items) {
    const ocs = ocsByCompra.get(item.id) || [];
    const ocTotal = ocs.reduce((sum, oc) => sum + (oc.oc_valor || 0), 0);
    const hasOC = ocs.length > 0;

    // Gasto real = suma de las Órdenes de Compra
    totalSpent += ocTotal;

    // Ahorro: presupuesto vs valor OC (solo si hay ambos)
    const budget = item.presupuesto || 0;
    if (hasOC && budget > 0) totalSavings += Math.max(0, budget - ocTotal);

    // Embudo
    if (item.comprador) countAssigned++;
    if (hasOC) totalRequestsWithOc++;
    if (COMPLETED_STATES.includes(item.estado)) countCompleted++;

    // Estancamiento: solo estados realmente pendientes
    if (PENDING_STATES.includes(item.estado)) {
      const days = differenceInDays(now, new Date(item.updated));
      if (days > STAGNATION_DAYS) {
        stagnantCompras.push({
          id: item.id,
          numero_ordinario: item.numero_ordinario,
          unidad: item.expand?.unidad_requirente?.nombre || "Sin Unidad",
          comprador: item.expand?.comprador?.name || "Sin Asignar",
          estado: item.estado,
          days,
        });
      }
    }

    // Rankings (monto = valor real de OCs)
    addTo(compradoresMap, item.expand?.comprador?.name || "Sin Asignar", ocTotal);
    addTo(unidadesMap, item.expand?.unidad_requirente?.nombre || "Sin Unidad", ocTotal);
    addTo(subvencionesMap, item.expand?.subvencion?.nombre || "Sin Subvención", ocTotal);

    // Volumen mensual
    const requestDateStr = getRequestDate(item);
    const requestDate = parseISO(requestDateStr);
    if (!Number.isNaN(requestDate.getTime()) && requestDate.getFullYear() === year) {
      const key = format(requestDate, "yyyy-MM");
      monthlyVolumeMap.set(key, (monthlyVolumeMap.get(key) || 0) + 1);
    }

    // Tiempo de ciclo: primera OC - fecha de solicitud
    if (hasOC && !Number.isNaN(requestDate.getTime())) {
      const dates = ocs
        .map((oc) => oc.oc_fecha)
        .filter(Boolean)
        .map((d) => parseISO(d).getTime())
        .filter((t) => !Number.isNaN(t));

      if (dates.length > 0) {
        const firstOcDate = new Date(Math.min(...dates));
        const days = differenceInDays(firstOcDate, requestDate);
        // Filtro de calidad: descartar negativos y outliers extremos
        if (days >= 0 && days < 120) {
          totalDays += days;
          validCycleCount++;
          const monthKey = format(firstOcDate, "yyyy-MM");
          const monthStats = monthlyCycleMap.get(monthKey) || { totalDays: 0, count: 0 };
          monthStats.totalDays += days;
          monthStats.count++;
          monthlyCycleMap.set(monthKey, monthStats);
        }
      }
    }
  }

  const totalOrders = items.length;
  const avgCycleTime = validCycleCount > 0 ? Math.round(totalDays / validCycleCount) : 0;
  const conversionRate = totalOrders > 0 ? Math.round((totalRequestsWithOc / totalOrders) * 100) : 0;

  const monthLabel = (key: string) => {
    const [y, m] = key.split("-");
    return format(new Date(parseInt(y, 10), parseInt(m, 10) - 1), "MMM", { locale: es });
  };

  // Volumen: mostrar todos los meses del año (hasta el mes actual si es el año en curso), incluso con 0
  const lastMonth = year === now.getFullYear() ? now.getMonth() : 11;
  const volumeTrend = Array.from({ length: lastMonth + 1 }, (_, i) => {
    const key = `${year}-${String(i + 1).padStart(2, "0")}`;
    return { month: monthLabel(key), count: monthlyVolumeMap.get(key) || 0 };
  });

  const cycleTimeTrend = Array.from(monthlyCycleMap.entries())
    .filter(([key]) => key.startsWith(String(year)))
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, stats]) => ({
      month: monthLabel(key),
      days: Math.round(stats.totalDays / stats.count),
    }));

  const toRanking = (map: Map<string, { amount: number; count: number }>) =>
    Array.from(map.entries()).map(([name, stats]) => ({ name, ...stats }));

  const rankingCompradores = toRanking(compradoresMap)
    .filter((c) => c.name !== "Sin Asignar")
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const rankingUnidades = toRanking(unidadesMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const rankingSubvenciones = toRanking(subvencionesMap)
    .filter((s) => s.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  stagnantCompras.sort((a, b) => b.days - a.days);

  const funnelData = [
    { stage: "Solicitudes", count: totalOrders, fill: "var(--color-solicitudes)" },
    { stage: "Asignadas", count: countAssigned, fill: "var(--color-asignadas)" },
    { stage: "Con OC", count: totalRequestsWithOc, fill: "var(--color-con-oc)" },
    { stage: "Terminadas", count: countCompleted, fill: "var(--color-terminadas)" },
  ];

  return {
    year,
    totalSpent,
    totalOrders,
    totalAnuladas,
    activeUnits: unidadesMap.size,
    totalSavings,
    conversionRate,
    avgCycleTime,
    cycleTimeTrend,
    volumeTrend,
    funnelData,
    stagnationCount: stagnantCompras.length,
    stagnantCompras,
    rankingCompradores,
    rankingUnidades,
    rankingSubvenciones,
  };
}
