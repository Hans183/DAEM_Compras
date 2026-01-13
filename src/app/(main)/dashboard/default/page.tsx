"use client";

import { useEffect, useState } from "react";
import { DollarSign, ShoppingCart, TrendingUp, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardStats, type DashboardStats } from "@/services/dashboard.service";
import { TopBuyersChart } from "../_components/charts/top-buyers-chart";
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
                            Compradores Activos
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.rankingCompradores.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Realizando gestiones
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4">
                    <TopBuyersChart data={stats.rankingCompradores} />
                </div>
                <div className="col-span-3">
                    <SpendingBySubventionChart data={stats.rankingSubvenciones} />
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-7">
                    <TopUnitsChart data={stats.rankingUnidades} />
                </div>
            </div>

        </div>
    );
}
