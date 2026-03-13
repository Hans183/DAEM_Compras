"use client";

import { useEffect, useState } from "react";

import { AlertTriangle, Clock, DollarSign, ShoppingCart, TrendingUp } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type DashboardStats, getDashboardStats } from "@/services/dashboard.service";

import { OperationalFunnelChart } from "../_components/charts/operational-funnel-chart";
import { ProcessingTimeChart } from "../_components/charts/processing-time-chart";
import { SpendingBySubventionChart } from "../_components/charts/spending-by-subvention-chart";
import { TopUnitsChart } from "../_components/charts/top-units-chart";
import { VolumeTrendChart } from "../_components/charts/volume-trend-chart";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Error loading dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Cargando tablero...</div>
      </div>
    );
  }

  if (!stats) return null;

  const currencyFormatter = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="font-bold text-3xl tracking-tight">Dashboard General</h1>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Gasto Total (Año)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{currencyFormatter.format(stats.totalSpent)}</div>
            <p className="text-muted-foreground text-xs">Pesos chilenos (CLP)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Órdenes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.totalOrders}</div>
            <p className="text-muted-foreground text-xs">Órdenes procesadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Unidades Activas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.rankingUnidades.length}</div>
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
            Hay <strong>{stats.stagnationCount} solicitudes estancadas</strong> sin movimiento por más de 10 días. Se
            recomienda revisar el listado de pendientes.
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
    </div>
  );
}
