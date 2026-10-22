"use client";

import { useEffect, useState } from "react";

import {
  AlertTriangle,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  Loader2,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type DashboardStats, getDashboardStats, STAGNATION_DAYS } from "@/services/dashboard.service";

import { BuyersWorkloadChart } from "../_components/charts/buyers-workload-chart";
import { OperationalFunnelChart } from "../_components/charts/operational-funnel-chart";
import { ProcessingTimeChart } from "../_components/charts/processing-time-chart";
import { SpendingBySubventionChart } from "../_components/charts/spending-by-subvention-chart";
import { TopUnitsChart } from "../_components/charts/top-units-chart";
import { VolumeTrendChart } from "../_components/charts/volume-trend-chart";

// Caché en memoria por año para carga instantánea al volver a la vista
const cachedDashboardStats: Record<number, DashboardStats> = {};

const currencyFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export default function DashboardPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [stats, setStats] = useState<DashboardStats | null>(cachedDashboardStats[currentYear] ?? null);
  const [loading, setLoading] = useState(!cachedDashboardStats[currentYear]);
  const [showStagnant, setShowStagnant] = useState(false);

  useEffect(() => {
    let active = true;
    const cached = cachedDashboardStats[year];
    if (cached) {
      setStats(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    async function loadStats() {
      try {
        const data = await getDashboardStats(year);
        cachedDashboardStats[year] = data;
        if (active) setStats(data);
      } catch (error) {
        console.error("Error loading dashboard stats:", error);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadStats();
    return () => {
      active = false;
    };
  }, [year]);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Cargando tablero...</div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="font-bold text-3xl tracking-tight">Dashboard General</h1>
          {loading && (
            <span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
              <Loader2 className="h-3 w-3 animate-spin" />
              Actualizando...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <Select value={year.toString()} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="h-9 w-[110px]">
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
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Gasto Total ({stats.year})</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{currencyFormatter.format(stats.totalSpent)}</div>
            <p className="text-muted-foreground text-xs">Suma de Órdenes de Compra</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Solicitudes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.totalOrders.toLocaleString("es-CL")}</div>
            <p className="text-muted-foreground text-xs">
              Sin anuladas{stats.totalAnuladas > 0 ? ` (${stats.totalAnuladas} anuladas excluidas)` : ""}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Unidades Activas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.activeUnits}</div>
            <p className="text-muted-foreground text-xs">Unidades con compras</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Tiempo Promedio Gestión</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.avgCycleTime} días</div>
            <p className="text-muted-foreground text-xs">Desde solicitud hasta OC</p>
          </CardContent>
        </Card>
        <Card className="border-blue-100 bg-blue-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-blue-900 text-sm">Tasa de Conversión</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-blue-900">{stats.conversionRate}%</div>
            <p className="text-blue-700 text-xs">Solicitudes que llegan a OC</p>
          </CardContent>
        </Card>
        <Card className="border-green-100 bg-green-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-green-900 text-sm">Ahorro Institucional</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-green-900">{currencyFormatter.format(stats.totalSavings)}</div>
            <p className="text-green-700 text-xs">Presupuesto vs Valor OC</p>
          </CardContent>
        </Card>
      </div>

      {/* Stagnation Alert */}
      {stats.stagnationCount > 0 && (
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-900">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Atención Operativa</AlertTitle>
          <AlertDescription>
            <div className="flex w-full flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  Hay <strong>{stats.stagnationCount} solicitudes pendientes</strong> (Iniciado, Asignado o En Proceso)
                  sin movimiento por más de {STAGNATION_DAYS} días.
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 border-red-300 bg-white text-red-900 hover:bg-red-100"
                  onClick={() => setShowStagnant((v) => !v)}
                >
                  {showStagnant ? <ChevronUp className="mr-1 h-3 w-3" /> : <ChevronDown className="mr-1 h-3 w-3" />}
                  {showStagnant ? "Ocultar" : "Ver detalle"}
                </Button>
              </div>
              {showStagnant && (
                <div className="max-h-[300px] overflow-y-auto rounded-md border border-red-200 bg-white">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-red-100/80 text-left">
                      <tr>
                        <th className="px-3 py-2 font-semibold">N° Ord.</th>
                        <th className="px-3 py-2 font-semibold">Unidad</th>
                        <th className="px-3 py-2 font-semibold">Comprador</th>
                        <th className="px-3 py-2 font-semibold">Estado</th>
                        <th className="px-3 py-2 text-right font-semibold">Días sin movimiento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-red-100">
                      {stats.stagnantCompras.map((c) => (
                        <tr key={c.id}>
                          <td className="px-3 py-1.5 font-mono">{c.numero_ordinario}</td>
                          <td className="px-3 py-1.5">{c.unidad}</td>
                          <td className="px-3 py-1.5">{c.comprador}</td>
                          <td className="px-3 py-1.5">{c.estado}</td>
                          <td className="px-3 py-1.5 text-right font-semibold">{c.days}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Charts Grid - Row 1: Trends */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <VolumeTrendChart data={stats.volumeTrend} />
        </div>
        <div className="lg:col-span-3">
          <ProcessingTimeChart data={stats.cycleTimeTrend} />
        </div>
      </div>

      {/* Charts Grid - Row 2: Distributions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <OperationalFunnelChart data={stats.funnelData} />
        </div>
        <div className="lg:col-span-2">
          <SpendingBySubventionChart data={stats.rankingSubvenciones} />
        </div>
        <div className="lg:col-span-2">
          <TopUnitsChart data={stats.rankingUnidades} />
        </div>
      </div>

      {/* Row 3: Buyers workload */}
      <div className="grid gap-4">
        <BuyersWorkloadChart data={stats.rankingCompradores} />
      </div>
    </div>
  );
}
