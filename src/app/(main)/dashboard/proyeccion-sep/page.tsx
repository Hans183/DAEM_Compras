"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useSearchParams } from "next/navigation";

import { toast } from "sonner";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import pb from "@/lib/pocketbase";
import { FACTURAS_COLLECTION } from "@/services/facturas.service";
import { getIngresosMensualesSep } from "@/services/ingresos-mensuales-sep.service";
import { ORDENES_COMPRA_COLLECTION } from "@/services/ordenes-compra.service";
import { createProyeccionSep, getProyeccionSepList, updateProyeccionSep } from "@/services/proyeccion-sep.service";
import { getRequirentes } from "@/services/requirentes.service";
import { getRrhhSepList } from "@/services/rrhh-sep.service";
import type { Compra } from "@/types/compra";
import type { Factura } from "@/types/factura";
import type { OrdenCompra } from "@/types/orden-compra";
import type { ProyeccionSep } from "@/types/proyeccion-sep";
import type { Requirente } from "@/types/requirente";

const CUSTOM_ORDER = [
  "Colegio de Cultura y Difusión Artistica",
  "Liceo RAAC",
  "Escuela La Unión",
  "Escuela J.A.R.",
  "Escuela Radimadi",
  "Colegio Técnico Profesional H.O.V.",
  "Escuela Rural Catamutún",
  "Escuela Rural Choroico",
  "Escuela Rural Puerto Nuevo",
  "Escuela Rural Los Esteros",
  "Escuela Rural Folleco",
  "Escuela Rural Cuinco",
  "Escuela Rural Huillinco",
  "Escuela Rural Traiguén",
  "Escuela Rural Carimanca",
  "Escuela Rural Flor María Luisa M.",
  "Escuela Aldea Campesina",
  "Escuela Rural Llancacura",
  "Escuela Rural Mashue",
  "Escuela Rural Pilpilcahuin",
  "Escuela Rural El Huape",
  "Escuela Rural Los Chilcos",
  "Escuela Rural Huacahue",
  "Escuela El Maitén",
];

import { ProyeccionSepTable } from "./components/proyeccion-sep-table";

export default function ProyeccionSepPage() {
  const searchParams = useSearchParams();
  const search = searchParams.get("search") || "";

  // We will hold both raw lists and merge them for the view
  const [schools, setSchools] = useState<Requirente[]>([]);
  const [projections, setProjections] = useState<ProyeccionSep[]>([]);

  // Auxiliary data
  const [rrhhSums, setRrhhSums] = useState<Record<string, number>>({});
  const [rrhhProjectedSums, setRrhhProjectedSums] = useState<Record<string, number>>({});
  const [presupuestoProyectadoSums, setPresupuestoProyectadoSums] = useState<Record<string, number>>({});
  const [schoolLatestMonthNames, setSchoolLatestMonthNames] = useState<Record<string, string>>({});
  const [schoolLatestRrhhMonthNames, setSchoolLatestRrhhMonthNames] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch ALL SEP establishments
      const schoolsResult = await getRequirentes({
        perPage: 500,
        sep_filter: true,
        active_filter: true,
        sort: "nombre",
      });

      // Sort by custom order
      const getOrderIndex = (name: string) => {
        const lowerName = name.toLowerCase();
        const targetIndex = CUSTOM_ORDER.findIndex((ordered) => {
          const lowerOrdered = ordered.toLowerCase().replace(/\./g, "");
          const cleanName = lowerName.replace(/\./g, "");

          if (cleanName.includes(lowerOrdered) || lowerOrdered.includes(cleanName)) return true;

          const acronym = lowerOrdered.split(" ").pop() || "";
          if (acronym.length >= 3 && cleanName.includes(acronym)) return true;

          return false;
        });
        return targetIndex === -1 ? 999 : targetIndex;
      };

      const sortedSchools = [...schoolsResult.items].sort((a, b) => {
        return getOrderIndex(a.nombre) - getOrderIndex(b.nombre);
      });

      setSchools(sortedSchools);

      // 2. Fetch existing projections
      const projectionResult = await getProyeccionSepList({ perPage: 500 });
      const existingProjections = projectionResult.items;

      // 3. Fetch RRHH data for calculation (Filtered by Selected Year)
      const rrhhResult = await getRrhhSepList({
        perPage: 500,
        anio_filter: selectedYear,
      });

      // 4. Fetch ALL Ingresos for selected year, calculate presupuesto and persist it
      const ingresosResult = await getIngresosMensualesSep({
        perPage: 2000,
        anio: selectedYear,
      });

      // Sum total_reflejar per establishment
      const iSums: Record<string, number> = {};
      for (const item of ingresosResult.items) {
        const schoolId = item.requirente;
        if (schoolId) {
          iSums[schoolId] = (iSums[schoolId] || 0) + (item.total_reflejar || 0);
        }
      }

      // Persist calculated budget to proyeccion_sep.presupuesto and compras_facturadas
      // Step 5: Fetch all compras with subvencion 'Ley SEP' for the selected year
      const startOfYear = `${selectedYear}-01-01 00:00:00`;
      const endOfYear = `${selectedYear}-12-31 23:59:59`;

      // First: get ALL compras that are Ley SEP (filter on compras table directly)
      const comprasResult = await pb.collection("compras").getFullList<Compra>({
        filter: `subvencion.nombre = 'Ley SEP' && ((fecha_inicio >= '${startOfYear}' && fecha_inicio <= '${endOfYear}') || (fecha_inicio = '' && created >= '${startOfYear}' && created <= '${endOfYear}'))`,
        sort: "-created",
      });

      // Build a map of compraId -> unidad_requirente
      const compraSchoolMap: Record<string, string> = {};
      for (const compra of comprasResult) {
        compraSchoolMap[compra.id] = compra.unidad_requirente;
      }
      const compraIds = Object.keys(compraSchoolMap);

      console.log("[DEBUG] Total compras SEP encontradas:", compraIds.length);

      // Step 6: Fetch all facturas for those compras (in batches if needed)
      let allFacturas: Factura[] = [];
      if (compraIds.length > 0) {
        // Build filter: compra = 'id1' || compra = 'id2' || ...
        const batchSize = 50;
        for (let i = 0; i < compraIds.length; i += batchSize) {
          const batch = compraIds.slice(i, i + batchSize);
          const compraFilter = batch.map((id) => `compra = '${id}'`).join(" || ");
          const facturasResult = await pb.collection(FACTURAS_COLLECTION).getFullList<Factura>({
            filter: compraFilter,
          });
          allFacturas = allFacturas.concat(facturasResult);
        }
      }

      // Sum monto per school using compraSchoolMap
      const fSums: Record<string, number> = {};
      for (const factura of allFacturas) {
        const schoolId = compraSchoolMap[factura.compra];
        if (schoolId) {
          fSums[schoolId] = (fSums[schoolId] || 0) + (factura.monto || 0);
        }
      }

      console.log("[DEBUG] Total facturas encontradas:", allFacturas.length);
      console.log("[DEBUG] fSums (facturadas por escuela):", fSums);

      // Step 7: Fetch all OCs for those compras (in batches if needed)
      let allOCs: OrdenCompra[] = [];
      if (compraIds.length > 0) {
        const batchSize = 50;
        for (let i = 0; i < compraIds.length; i += batchSize) {
          const batch = compraIds.slice(i, i + batchSize);
          const compraFilter = batch.map((id) => `compra = '${id}'`).join(" || ");
          const ocsResult = await pb.collection(ORDENES_COMPRA_COLLECTION).getFullList<OrdenCompra>({
            filter: compraFilter,
          });
          allOCs = allOCs.concat(ocsResult);
        }
      }

      // Sum oc_valor per school using compraSchoolMap
      const ocSums: Record<string, number> = {};
      for (const oc of allOCs) {
        const schoolId = compraSchoolMap[oc.compra];
        if (schoolId) {
          ocSums[schoolId] = (ocSums[schoolId] || 0) + (oc.oc_valor || 0);
        }
      }

      // Subtract facturas from OCs to get the real "committed" amount (Saldo por facturar)
      for (const schoolId in ocSums) {
        ocSums[schoolId] = Math.max(0, ocSums[schoolId] - (fSums[schoolId] || 0));
      }

      console.log("[DEBUG] Total OCs encontradas:", allOCs.length);
      console.log("[DEBUG] ocSums (obligadas/pendientes por escuela):", ocSums);

      // DEBUG: Check Liceo RAAC specifically
      const raacSchool = sortedSchools.find((s) => s.nombre.includes("RAAC"));
      if (raacSchool) {
        console.log("[DEBUG] Liceo RAAC id:", raacSchool.id);
        console.log(
          "[DEBUG] RAAC compras SEP:",
          comprasResult.filter((c) => c.unidad_requirente === raacSchool.id).length,
        );
        console.log("[DEBUG] RAAC facturadas:", fSums[raacSchool.id] || 0);
        console.log("[DEBUG] RAAC obligadas (Saldo OC - Fact):", ocSums[raacSchool.id] || 0);
      }

      const savePromises = sortedSchools.map(async (school) => {
        const presupuesto = iSums[school.id] || 0;
        const comprasFacturadas = fSums[school.id] || 0;
        const comprasObligadas = ocSums[school.id] || 0;
        const existing = existingProjections.find((p) => p.establecimiento === school.id);
        if (existing) {
          return updateProyeccionSep(existing.id, {
            presupuesto,
            compras_facturadas: comprasFacturadas,
            compras_obligadas: comprasObligadas,
          });
        }
        return createProyeccionSep({
          establecimiento: school.id,
          presupuesto,
          total_utilizado: 0,
          compras_facturadas: comprasFacturadas,
          compras_obligadas: comprasObligadas,
          rrhh: "",
        });
      });
      const updatedProjections = await Promise.all(savePromises);
      setProjections(updatedProjections);

      // 7. Calculate Presupuesto Proyectado
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
      const pSums: Record<string, number> = {};
      const monthNames: Record<string, string> = {};
      const schoolLatestIngreso: Record<string, { total: number; monthIndex: number }> = {};

      ingresosResult.items.forEach((item) => {
        const schoolId = item.requirente;
        const monthIndex = MONTH_ORDER.indexOf(item.mes);
        if (monthIndex === -1) return; // Skip "Saldo Inicial"

        if (!schoolLatestIngreso[schoolId] || monthIndex >= schoolLatestIngreso[schoolId].monthIndex) {
          schoolLatestIngreso[schoolId] = {
            total: item.total_reflejar || 0,
            monthIndex: monthIndex,
          };
        }
      });

      schoolsResult.items.forEach((school) => {
        const latest = schoolLatestIngreso[school.id];
        if (latest) {
          const remainingMonths = 11 - latest.monthIndex;
          pSums[school.id] = (latest.total || 0) * remainingMonths;
          monthNames[school.id] = MONTH_ORDER[latest.monthIndex];
        } else {
          pSums[school.id] = 0;
          monthNames[school.id] = "";
        }
      });
      setPresupuestoProyectadoSums(pSums);
      setSchoolLatestMonthNames(monthNames);

      const sums: Record<string, number> = {};

      // Logic for RRHH Projected: Fill forward 0 values
      const schoolMonthlyData: Record<string, Record<string, number>> = {};
      const projectedSums: Record<string, number> = {};
      const rrhhMonthNames: Record<string, string> = {};

      // First pass: Organize real data by school and month
      rrhhResult.items.forEach((item) => {
        const schoolId = item.escuelas;
        if (!sums[schoolId]) sums[schoolId] = 0;
        sums[schoolId] += item.total;

        if (!schoolMonthlyData[schoolId]) schoolMonthlyData[schoolId] = {};
        schoolMonthlyData[schoolId][item.mes] = item.total;
      });
      setRrhhSums(sums);

      // Second pass: Calculate projected sums
      const MONTHS = [
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

      schoolsResult.items.forEach((school) => {
        const schoolId = school.id;
        const monthlyData = schoolMonthlyData[schoolId] || {};

        let projectedSum = 0;
        let lastNonZero = 0;
        let lastMonthName = "";

        MONTHS.forEach((month) => {
          const val = monthlyData[month] || 0;
          if (val > 0) {
            lastNonZero = val;
            lastMonthName = month;
          }
          // Only sum the future part (where val is 0 but we have a base value)
          if (val === 0 && lastNonZero > 0) {
            projectedSum += lastNonZero;
          }
        });

        projectedSums[schoolId] = projectedSum;
        rrhhMonthNames[schoolId] = lastMonthName;
      });
      setRrhhProjectedSums(projectedSums);
      setSchoolLatestRrhhMonthNames(rrhhMonthNames);
    } catch (error) {
      console.error("Error loading Proyeccion SEP data:", error);
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredSchools = useMemo(() => {
    if (!search) return schools;
    const lowerSearch = search.toLowerCase();
    return schools.filter((s) => s.nombre.toLowerCase().includes(lowerSearch));
  }, [schools, search]);

  return (
    <div className="flex min-w-0 max-w-full flex-col gap-6 overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Proyección SEP</h1>
          <p className="text-muted-foreground">Gestión de presupuesto y gastos SEP por establecimiento.</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-[120px]">
          <Select value={selectedYear.toString()} onValueChange={(val) => setSelectedYear(Number(val))}>
            <SelectTrigger>
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-muted-foreground text-sm">
          Calculando acciones y RRHH para: <span className="font-semibold">{selectedYear}</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Cargando registros...</div>
        </div>
      ) : (
        <ProyeccionSepTable
          schools={filteredSchools}
          projections={projections}
          rrhhSums={rrhhSums}
          rrhhProjectedSums={rrhhProjectedSums}
          presupuestoProyectadoSums={presupuestoProyectadoSums}
          schoolLatestMonthNames={schoolLatestMonthNames}
          schoolLatestRrhhMonthNames={schoolLatestRrhhMonthNames}
        />
      )}
    </div>
  );
}
