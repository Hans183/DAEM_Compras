"use client";

import { useCallback, useEffect, useState } from "react";

import { toast } from "sonner";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getIngresosMensualesSep } from "@/services/ingresos-mensuales-sep.service";
import { getRequirentes } from "@/services/requirentes.service";
import { getRrhhSepList } from "@/services/rrhh-sep.service";
import type { Requirente } from "@/types/requirente";
import { MONTHS } from "@/types/rrhh-sep";

import { PorcentajeGastoRrhhTable } from "./components/porcentaje-gasto-rrhh-table";

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

export default function PorcentajeGastoRrhhPage() {
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState<Requirente[]>([]);
  const [rrhhData, setRrhhData] = useState<Record<string, number>>({});
  const [ingresosData, setIngresosData] = useState<Record<string, number>>({});

  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTHS[new Date().getMonth()]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch schools (SEP filter)
      const schoolsResult = await getRequirentes({
        perPage: 500,
        sep_filter: true,
        active_filter: true,
        sort: "nombre",
      });

      const getOrderIndex = (name: string) => {
        const lowerName = name.toLowerCase();
        const targetIndex = CUSTOM_ORDER.findIndex((ordered) => {
          const lowerOrdered = ordered.toLowerCase().replace(/\./g, "");
          const cleanName = lowerName.replace(/\./g, "");
          if (cleanName.includes(lowerOrdered) || lowerOrdered.includes(cleanName)) return true;
          return false;
        });
        return targetIndex === -1 ? 999 : targetIndex;
      };

      const sortedSchools = [...schoolsResult.items].sort((a, b) => {
        return getOrderIndex(a.nombre) - getOrderIndex(b.nombre);
      });

      setSchools(sortedSchools);

      // 2. Fetch RRHH data for selected period
      const rrhhResult = await getRrhhSepList({
        perPage: 500,
        anio_filter: selectedYear,
        mes_filter: selectedMonth,
      });

      const rrhhMap: Record<string, number> = {};
      rrhhResult.items.forEach((item) => {
        rrhhMap[item.escuelas] = (rrhhMap[item.escuelas] || 0) + item.total;
      });
      setRrhhData(rrhhMap);

      // 3. Fetch Income data for selected period
      const ingresosResult = await getIngresosMensualesSep({
        perPage: 500,
        anio: selectedYear,
        mes: selectedMonth as any,
      });

      const ingresosMap: Record<string, number> = {};
      ingresosResult.items.forEach((item) => {
        ingresosMap[item.requirente] = (ingresosMap[item.requirente] || 0) + item.total_reflejar;
      });
      setIngresosData(ingresosMap);
    } catch (error) {
      console.error("Error loading Porcentaje Gasto RRHH data:", error);
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="flex min-w-0 max-w-full flex-col gap-6 overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Porcentaje Gasto RRHH</h1>
          <p className="text-muted-foreground">Comparativa de gasto en personal vs ingresos mensuales SEP.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
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

        <div className="w-[150px]">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger>
              <SelectValue placeholder="Mes" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month) => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-muted-foreground text-sm">
          Filtrando por:{" "}
          <span className="font-semibold">
            {selectedMonth} {selectedYear}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Cargando registros...</div>
        </div>
      ) : (
        <PorcentajeGastoRrhhTable
          schools={schools}
          rrhhData={rrhhData}
          ingresosData={ingresosData}
          year={selectedYear}
          month={selectedMonth}
        />
      )}
    </div>
  );
}
