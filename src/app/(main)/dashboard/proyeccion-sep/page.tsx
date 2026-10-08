"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useSearchParams } from "next/navigation";

import { toast } from "sonner";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { getLocalStorageValue, setLocalStorageValue } from "@/lib/local-storage.client";
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

interface YearCacheData {
  projections: ProyeccionSep[];
  rrhhSums: Record<string, number>;
  rrhhProjectedSums: Record<string, number>;
  presupuestoProyectadoSums: Record<string, number>;
  schoolLatestMonthNames: Record<string, string>;
  schoolLatestRrhhMonthNames: Record<string, string>;
}

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

  // Column visibility state and persistence
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    nombre: true,
    presupuesto: true,
    total_utilizado: true,
    por_gastar: true,
    porcentaje_utilizado: true,
    porcentaje_pagado: true,
    compras_facturadas: true,
    compras_obligadas: true,
    rrhh: true,
    rrhh_proyectado: true,
    suma_facturado_rrhh: true,
    presupuesto_proyectado: true,
    porcentaje_factura_anual: true,
    porcentaje_aprox_utilizado: true,
    disponible_proyectado: true,
    total_proyectado: true,
  });

  const { user } = useAuth();
  const storageKey = user ? `proyeccion-sep-columns-${user.id}` : null;

  // Load preferences
  useEffect(() => {
    if (storageKey) {
      const saved = getLocalStorageValue(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setVisibleColumns((prev) => ({ ...prev, ...parsed }));
        } catch (err) {
          console.error("Error loading column preferences:", err);
        }
      }
    }
  }, [storageKey]);

  const handleVisibleColumnsChange = (newColumns: Record<string, boolean>) => {
    setVisibleColumns(newColumns);
    if (storageKey) {
      setLocalStorageValue(storageKey, JSON.stringify(newColumns));
    }
  };

  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // In-memory cache by year and reference to already fetched schools
  const yearCacheRef = useRef<Record<number, YearCacheData>>({});
  const schoolsRef = useRef<Requirente[]>([]);

  const loadData = useCallback(async () => {
    // If already in memory for this year, show cached data immediately without blocking spinner
    const cached = yearCacheRef.current[selectedYear];
    if (cached) {
      setProjections(cached.projections);
      setRrhhSums(cached.rrhhSums);
      setRrhhProjectedSums(cached.rrhhProjectedSums);
      setPresupuestoProyectadoSums(cached.presupuestoProyectadoSums);
      setSchoolLatestMonthNames(cached.schoolLatestMonthNames);
      setSchoolLatestRrhhMonthNames(cached.schoolLatestRrhhMonthNames);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const startOfYear = `${selectedYear}-01-01 00:00:00`;
      const endOfYear = `${selectedYear}-12-31 23:59:59`;

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

      // 1. Parallel fetch of all independent initial datasets
      const [schoolsResult, projectionResult, rrhhResult, ingresosResult, comprasResult] = await Promise.all([
        schoolsRef.current.length > 0
          ? Promise.resolve({ items: schoolsRef.current })
          : getRequirentes({
              perPage: 500,
              sep_filter: true,
              active_filter: true,
              sort: "nombre",
            }),
        getProyeccionSepList({ perPage: 500 }),
        getRrhhSepList({
          perPage: 500,
          anio_filter: selectedYear,
        }),
        getIngresosMensualesSep({
          perPage: 2000,
          anio: selectedYear,
        }),
        pb.collection("compras").getFullList<Compra>({
          filter: `subvencion.nombre = 'Ley SEP' && ((fecha_inicio >= '${startOfYear}' && fecha_inicio <= '${endOfYear}') || (fecha_inicio = '' && created >= '${startOfYear}' && created <= '${endOfYear}'))`,
          sort: "-created",
          fields: "id,unidad_requirente",
        }),
      ]);

      // Sort and memoize schools
      let sortedSchools = schoolsRef.current;
      if (sortedSchools.length === 0) {
        sortedSchools = [...schoolsResult.items]
          .filter((school) => {
            if (user?.role.includes("Observador")) {
              return school.id === user.dependencia;
            }
            return true;
          })
          .sort((a, b) => getOrderIndex(a.nombre) - getOrderIndex(b.nombre));
        schoolsRef.current = sortedSchools;
        setSchools(sortedSchools);
      }

      const existingProjections = projectionResult.items;

      // Sum total_reflejar per establishment
      const iSums: Record<string, number> = {};
      for (const item of ingresosResult.items) {
        const schoolId = item.requirente;
        if (schoolId) {
          iSums[schoolId] = (iSums[schoolId] || 0) + (item.total_reflejar || 0);
        }
      }

      // Build map of compraId -> unidad_requirente
      const compraSchoolMap: Record<string, string> = {};
      for (const compra of comprasResult) {
        compraSchoolMap[compra.id] = compra.unidad_requirente;
      }
      const compraIds = Object.keys(compraSchoolMap);

      // 2. Concurrently fetch all batches of Facturas and OCs
      let allFacturas: Factura[] = [];
      let allOCs: OrdenCompra[] = [];

      if (compraIds.length > 0) {
        const batchSize = 50;
        const facPromises: Promise<Factura[]>[] = [];
        const ocPromises: Promise<OrdenCompra[]>[] = [];

        for (let i = 0; i < compraIds.length; i += batchSize) {
          const batch = compraIds.slice(i, i + batchSize);
          const compraFilter = batch.map((id) => `compra = '${id}'`).join(" || ");
          facPromises.push(
            pb.collection(FACTURAS_COLLECTION).getFullList<Factura>({
              filter: compraFilter,
              fields: "compra,monto",
            }),
          );
          ocPromises.push(
            pb.collection(ORDENES_COMPRA_COLLECTION).getFullList<OrdenCompra>({
              filter: compraFilter,
              fields: "compra,oc_valor",
            }),
          );
        }

        const [facResults, ocResults] = await Promise.all([Promise.all(facPromises), Promise.all(ocPromises)]);

        allFacturas = facResults.flat();
        allOCs = ocResults.flat();
      }

      // Sum facturas monto per school
      const fSums: Record<string, number> = {};
      for (const factura of allFacturas) {
        const schoolId = compraSchoolMap[factura.compra];
        if (schoolId) {
          fSums[schoolId] = (fSums[schoolId] || 0) + (factura.monto || 0);
        }
      }

      // Sum OCs oc_valor per school
      const ocSums: Record<string, number> = {};
      for (const oc of allOCs) {
        const schoolId = compraSchoolMap[oc.compra];
        if (schoolId) {
          ocSums[schoolId] = (ocSums[schoolId] || 0) + (oc.oc_valor || 0);
        }
      }

      // Subtract facturas from OCs to get Saldo por facturar (compras obligadas)
      for (const schoolId in ocSums) {
        ocSums[schoolId] = Math.max(0, ocSums[schoolId] - (fSums[schoolId] || 0));
      }

      // 3. Calculate Presupuesto Proyectado
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

      sortedSchools.forEach((school) => {
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

      // 4. Calculate RRHH Real and Projected
      const sums: Record<string, number> = {};
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

      sortedSchools.forEach((school) => {
        const schoolId = school.id;
        const monthlyData = schoolMonthlyData[schoolId] || {};

        let projectedSum = 0;
        let lastValue = 0;
        let lastMonthName = "";

        MONTHS.forEach((month) => {
          const recordValue = monthlyData[month];
          const hasRecord = recordValue !== undefined;
          const val = recordValue || 0;

          if (hasRecord) {
            lastValue = val;
            lastMonthName = month;
          } else {
            if (lastValue > 0) {
              projectedSum += lastValue;
            }
          }
        });

        projectedSums[schoolId] = projectedSum;
        rrhhMonthNames[schoolId] = lastMonthName;
      });

      // 5. Build calculated projections directly in memory (zero UI wait for DB writes)
      const calculatedProjections: ProyeccionSep[] = sortedSchools.map((school) => {
        const existing = existingProjections.find((p) => p.establecimiento === school.id);
        const presupuesto = iSums[school.id] || 0;
        const comprasFacturadas = fSums[school.id] || 0;
        const comprasObligadas = ocSums[school.id] || 0;

        return {
          id: existing?.id || school.id,
          collectionId: existing?.collectionId || "",
          collectionName: existing?.collectionName || "proyeccion_sep",
          created: existing?.created || "",
          updated: existing?.updated || "",
          establecimiento: school.id,
          presupuesto,
          total_utilizado: 0,
          compras_facturadas: comprasFacturadas,
          compras_obligadas: comprasObligadas,
          rrhh: "",
        };
      });

      // Update UI state immediately!
      setProjections(calculatedProjections);
      setPresupuestoProyectadoSums(pSums);
      setSchoolLatestMonthNames(monthNames);
      setRrhhSums(sums);
      setRrhhProjectedSums(projectedSums);
      setSchoolLatestRrhhMonthNames(rrhhMonthNames);

      // Save into cache for instantaneous retrieval if switching years
      yearCacheRef.current[selectedYear] = {
        projections: calculatedProjections,
        rrhhSums: sums,
        rrhhProjectedSums: projectedSums,
        presupuestoProyectadoSums: pSums,
        schoolLatestMonthNames: monthNames,
        schoolLatestRrhhMonthNames: rrhhMonthNames,
      };

      // 6. Non-blocking background sync for changed records (dirty check)
      const dirtySync = async () => {
        try {
          const syncPromises: Promise<unknown>[] = [];
          for (const school of sortedSchools) {
            const presupuesto = iSums[school.id] || 0;
            const comprasFacturadas = fSums[school.id] || 0;
            const comprasObligadas = ocSums[school.id] || 0;
            const existing = existingProjections.find((p) => p.establecimiento === school.id);

            if (existing) {
              if (
                existing.presupuesto !== presupuesto ||
                existing.compras_facturadas !== comprasFacturadas ||
                existing.compras_obligadas !== comprasObligadas
              ) {
                syncPromises.push(
                  updateProyeccionSep(existing.id, {
                    presupuesto,
                    compras_facturadas: comprasFacturadas,
                    compras_obligadas: comprasObligadas,
                  }),
                );
              }
            } else {
              syncPromises.push(
                createProyeccionSep({
                  establecimiento: school.id,
                  presupuesto,
                  total_utilizado: 0,
                  compras_facturadas: comprasFacturadas,
                  compras_obligadas: comprasObligadas,
                  rrhh: "",
                }),
              );
            }
          }
          if (syncPromises.length > 0) {
            await Promise.allSettled(syncPromises);
          }
        } catch (syncErr) {
          console.warn("[ProyeccionSEP] Advertencia en sincronización en segundo plano:", syncErr);
        }
      };
      dirtySync();
    } catch (error) {
      console.error("Error loading Proyeccion SEP data:", error);
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, [selectedYear, user?.dependencia, user?.role]);

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
          visibleColumns={visibleColumns}
          onVisibleColumnsChange={handleVisibleColumnsChange}
        />
      )}
    </div>
  );
}
