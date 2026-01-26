"use client";

import { useEffect, useState } from "react";
import { DollarSign, ShoppingCart, TrendingUp, Users, Clock, AlertTriangle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getDashboardStats, type DashboardStats } from "@/services/dashboard.service";
import { ProcessingTimeChart } from "../_components/charts/processing-time-chart";
import { OperationalFunnelChart } from "../_components/charts/operational-funnel-chart";
import { TopUnitsChart } from "../_components/charts/top-units-chart";
import { SpendingBySubventionChart } from "../_components/charts/spending-by-subvention-chart";

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
            <h1 className="text-3xl font-bold tracking-tight">Dashboard General</h1>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Gasto Total (Año)
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {currencyFormatter.format(stats.totalSpent)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Pesos chilenos (CLP)
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Órdenes
                        </CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalOrders}</div>
                        <p className="text-xs text-muted-foreground">
                            Órdenes procesadas
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unidades Activas</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.rankingUnidades.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Unidades con compras
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Tiempo Promedio Gestión
                        </CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.avgCycleTime} días</div>
                        <p className="text-xs text-muted-foreground">
                            Desde solicitud hasta OC
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Stagnation Alert */}
            {stats.stagnationCount > 0 && (
                <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-900">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Atención Operativa</AlertTitle>
                    <AlertDescription>
                        Hay <strong>{stats.stagnationCount} solicitudes estancadas</strong> sin movimiento por más de 10 días.
                        Se recomienda revisar el listado de pendientes.
                    </AlertDescription>
                </Alert>
            )}

            {/* Charts Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4">
                    <ProcessingTimeChart data={stats.cycleTimeTrend} />
                </div>
                <div className="col-span-3">
                    <SpendingBySubventionChart data={stats.rankingSubvenciones} />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4">
                    <OperationalFunnelChart data={stats.funnelData} />
                </div>
                <div className="col-span-3">
                    <TopUnitsChart data={stats.rankingUnidades} />
                </div>
            </div>

        </div>
    );
}
