"use client";

import { useCallback, useEffect, useState } from "react";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Building2, Calendar as CalendarIcon, DollarSign, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { getSepReport, type SepReportStats } from "@/services/reports.service";
import { getRequirentes } from "@/services/requirentes.service";
import type { Requirente } from "@/types/requirente";

import { SepEvolutionChart } from "../../_components/charts/sep-evolution-chart";

export default function SepReportPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SepReportStats | null>(null);
  const [schools, setSchools] = useState<Requirente[]>([]);

  const isObservador = user?.role.includes("Observador");

  // Filters
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState<string>("all");
  const [schoolId, setSchoolId] = useState<string>(isObservador ? user?.dependencia || "all" : "all");

  // Load Schools for Filter
  useEffect(() => {
    getRequirentes({ perPage: 100, sort: "nombre", sep_filter: true }).then((data) => {
      setSchools(data.items);
    });
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const m = month === "all" ? undefined : parseInt(month, 10);
      const s = schoolId === "all" ? undefined : schoolId;

      const data = await getSepReport(year, s, m);
      setStats(data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar reporte SEP");
    } finally {
      setLoading(false);
    }
  }, [year, month, schoolId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(val);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Reporte Ley SEP</h1>
          <p className="text-muted-foreground">Seguimiento presupuestario de compras SEP</p>
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-background p-2 shadow-sm">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v, 10))}>
              <SelectTrigger className="h-8 w-[100px]">
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mx-1 h-4 w-[1px] bg-border" />

          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="h-8 w-[140px]">
              <SelectValue placeholder="Todos los meses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los meses</SelectItem>
              {Array.from({ length: 12 }).map((_, i) => {
                const date = new Date(year, i);
                const monthName = format(date, "MMMM", { locale: es });
                return (
                  <SelectItem key={monthName} value={i.toString()}>
                    {monthName}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <div className="mx-1 h-4 w-[1px] bg-border" />

          {!isObservador && (
            <Select value={schoolId} onValueChange={setSchoolId}>
              <SelectTrigger className="h-8 w-[200px]">
                <SelectValue placeholder="Todas las Escuelas" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="all">Todas las Escuelas</SelectItem>
                {schools.map((school) => (
                  <SelectItem key={school.id} value={school.id}>
                    {school.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Check if filtered to reset? */}
          {(month !== "all" || schoolId !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground hover:text-foreground"
              onClick={() => {
                setMonth("all");
                setSchoolId("all");
              }}
            >
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {loading && !stats ? (
        <div className="flex h-[400px] w-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
        </div>
      ) : stats ? (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">Inversión Total SEP</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">{formatCurrency(stats.totalInvestment)}</div>
                <p className="text-muted-foreground text-xs">En compras con órdenes generadas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">Solicitudes Gestionadas</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">{stats.totalOrders}</div>
                <p className="text-muted-foreground text-xs">Total de procesos de compra SEP</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">Establecimientos</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">{stats.bySchool.length}</div>
                <p className="text-muted-foreground text-xs">Con movimientos este periodo</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts & Details */}
          <div className="grid gap-4 md:grid-cols-7">
            <div className="col-span-4">
              <SepEvolutionChart data={stats.monthlyEvolution} year={year} />
            </div>
            <div className="col-span-3">
              <Card className="flex h-full flex-col">
                <CardHeader>
                  <CardTitle>Desglose por Escuela</CardTitle>
                </CardHeader>
                <CardContent className="max-h-[400px] flex-1 overflow-auto">
                  <div className="space-y-4">
                    {stats.bySchool.map((item) => (
                      <div key={item.name} className="flex items-center">
                        <div className="ml-4 flex-1 space-y-1">
                          <p className="font-medium text-sm leading-none">{item.name}</p>
                          <p className="text-muted-foreground text-xs">{item.count} compras</p>
                        </div>
                        <div className="font-medium text-sm">{formatCurrency(item.amount)}</div>
                      </div>
                    ))}
                    {stats.bySchool.length === 0 && (
                      <div className="py-8 text-center text-muted-foreground">Sin datos para mostrar</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
