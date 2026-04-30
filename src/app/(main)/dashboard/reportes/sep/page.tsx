"use client";

import { useCallback, useEffect, useState } from "react";

import { Calendar as CalendarIcon, Check, ChevronsUpDown, RotateCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { getSepSchoolReport, type SchoolSepKpis } from "@/services/reports.service";
import { getRequirentes } from "@/services/requirentes.service";
import type { Requirente } from "@/types/requirente";

import { SepSchoolEvolutionChart, SepSchoolEvolutionChartSkeleton } from "./components/sep-school-evolution-chart";
import { SepSchoolKpiCards, SepSchoolKpiCardsSkeleton } from "./components/sep-school-kpi-cards";
import { SepSchoolProgressChart, SepSchoolProgressChartSkeleton } from "./components/sep-school-progress-chart";

export default function SepReportPage() {
  const { user } = useAuth();
  const isObservador = user?.role.includes("Observador");

  const [schools, setSchools] = useState<Requirente[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);

  // Filters
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [schoolId, setSchoolId] = useState<string>(isObservador ? user?.dependencia || "" : "");
  const [openCombobox, setOpenCombobox] = useState(false);

  // Data
  const [kpis, setKpis] = useState<SchoolSepKpis | null>(null);
  const [loading, setLoading] = useState(false);

  // Load schools
  useEffect(() => {
    setSchoolsLoading(true);
    getRequirentes({ perPage: 500, sort: "nombre", sep_filter: true })
      .then((data) => {
        let items = data.items;
        if (isObservador && user?.dependencia) {
          items = items.filter((s) => s.id === user.dependencia);
        }
        setSchools(items);

        // Auto-select if Observador or only one school
        if (isObservador && user?.dependencia) {
          setSchoolId(user.dependencia);
        }
      })
      .finally(() => setSchoolsLoading(false));
  }, [isObservador, user?.dependencia]);

  const selectedSchool = schools.find((s) => s.id === schoolId);

  const loadData = useCallback(async () => {
    if (!schoolId || !selectedSchool) return;

    setLoading(true);
    try {
      const data = await getSepSchoolReport(schoolId, selectedSchool.nombre, year);
      setKpis(data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar reporte SEP del establecimiento");
    } finally {
      setLoading(false);
    }
  }, [schoolId, selectedSchool, year]);

  useEffect(() => {
    if (schoolId && selectedSchool) {
      loadData();
    }
  }, [loadData, schoolId, selectedSchool]);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* ── Header ── */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Reporte Ley SEP</h1>
          <p className="text-muted-foreground">KPIs e indicadores individuales por establecimiento</p>
        </div>

        {/* ── Filters Toolbar ── */}
        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-background p-2.5 shadow-sm">
          {/* Year */}
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v, 10))}>
              <SelectTrigger className="h-8 w-[100px]">
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => currentYear - i).map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mx-1 h-6 w-[1px] bg-border" />

          {/* Reload */}
          {kpis && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground hover:text-foreground"
              onClick={loadData}
              disabled={loading}
            >
              <RotateCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          )}
        </div>
      </div>

      {/* ── School Selector (centered, prominent) ── */}
      {!isObservador && (
        <div className="flex justify-center">
          <div className="relative flex w-full max-w-[560px] flex-col items-center gap-5 rounded-xl border bg-card p-6 shadow-sm">
            <div className="-top-3 absolute w-max bg-card px-3 text-center text-muted-foreground text-xs font-medium uppercase tracking-wider">
              Seleccionar Establecimiento
            </div>

            <div className="w-full">
              <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCombobox}
                    className="h-11 w-full justify-between bg-background font-normal"
                    disabled={schoolsLoading}
                  >
                    <span className="truncate">
                      {schoolsLoading
                        ? "Cargando establecimientos..."
                        : selectedSchool
                          ? selectedSchool.nombre
                          : "Seleccione un establecimiento"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[520px] p-0" align="center">
                  <Command>
                    <CommandInput placeholder="Buscar establecimiento..." />
                    <CommandList>
                      <CommandEmpty>No se encontró ningún establecimiento.</CommandEmpty>
                      <CommandGroup>
                        {schools.map((school) => (
                          <CommandItem
                            key={school.id}
                            value={`${school.nombre} ${school.id}`}
                            onSelect={() => {
                              setSchoolId(school.id);
                              setOpenCombobox(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4 shrink-0",
                                schoolId === school.id ? "opacity-100" : "opacity-0",
                              )}
                            />
                            <span className="truncate">{school.nombre}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {selectedSchool && (
              <p className="text-sm">
                Establecimiento: <span className="font-semibold text-primary">{selectedSchool.nombre}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Observador: show school name ── */}
      {isObservador && selectedSchool && (
        <div className="rounded-lg border bg-card p-4 text-center shadow-sm">
          <p className="font-medium text-lg">{selectedSchool.nombre}</p>
          <p className="text-muted-foreground text-sm">Reporte {year}</p>
        </div>
      )}

      {/* ── Empty state ── */}
      {!schoolId && !isObservador && (
        <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed">
          <div className="text-center">
            <p className="font-medium text-muted-foreground">Seleccione un establecimiento para ver los indicadores</p>
            <p className="mt-1 text-muted-foreground/60 text-sm">Los KPIs se calcularán automáticamente</p>
          </div>
        </div>
      )}

      {/* ── Loading state ── */}
      {loading && schoolId && (
        <div className="space-y-6">
          <SepSchoolKpiCardsSkeleton />
          <div className="grid gap-4 md:grid-cols-7">
            <div className="md:col-span-4">
              <SepSchoolEvolutionChartSkeleton />
            </div>
            <div className="md:col-span-3">
              <SepSchoolProgressChartSkeleton />
            </div>
          </div>
        </div>
      )}

      {/* ── KPIs & Charts ── */}
      {!loading && kpis && (
        <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          {/* KPI Cards */}
          <SepSchoolKpiCards kpis={kpis} />

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-7">
            <div className="md:col-span-4">
              <SepSchoolEvolutionChart kpis={kpis} year={year} />
            </div>
            <div className="md:col-span-3">
              <SepSchoolProgressChart kpis={kpis} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
