"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, Filter, DollarSign, ShoppingCart, Building2 } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getSepReport, type SepReportStats } from "@/services/reports.service";
import { SepEvolutionChart } from "../../_components/charts/sep-evolution-chart";
import { getRequirentes } from "@/services/requirentes.service";
import type { Requirente } from "@/types/requirente";

export default function SepReportPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<SepReportStats | null>(null);
    const [schools, setSchools] = useState<Requirente[]>([]);

    // Filters
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(currentYear);
    const [month, setMonth] = useState<string>("all");
    const [schoolId, setSchoolId] = useState<string>("all");

    // Load Schools for Filter
    useEffect(() => {
        getRequirentes({ perPage: 100, sort: "nombre", sep_filter: true }).then((data) => {
            setSchools(data.items);
        });
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const m = month === "all" ? undefined : parseInt(month);
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reporte Ley SEP</h1>
                    <p className="text-muted-foreground">
                        Seguimiento presupuestario de compras SEP
                    </p>
                </div>

                {/* Filters Toolbar */}
                <div className="flex flex-wrap items-center gap-2 bg-background p-2 rounded-lg border shadow-sm">
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
                            <SelectTrigger className="w-[100px] h-8">
                                <SelectValue placeholder="Año" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="2024">2024</SelectItem>
                                <SelectItem value="2025">2025</SelectItem>
                                <SelectItem value="2026">2026</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="h-4 w-[1px] bg-border mx-1" />

                    <Select value={month} onValueChange={setMonth}>
                        <SelectTrigger className="w-[140px] h-8">
                            <SelectValue placeholder="Todos los meses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los meses</SelectItem>
                            {Array.from({ length: 12 }).map((_, i) => {
                                const date = new Date(year, i);
                                return (
                                    <SelectItem key={i} value={i.toString()}>
                                        {format(date, "MMMM", { locale: es })}
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>

                    <div className="h-4 w-[1px] bg-border mx-1" />

                    <Select value={schoolId} onValueChange={setSchoolId}>
                        <SelectTrigger className="w-[200px] h-8">
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

                    {/* Check if filtered to reset? */}
                    {(month !== "all" || schoolId !== "all") && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-muted-foreground hover:text-foreground"
                            onClick={() => { setMonth("all"); setSchoolId("all"); }}
                        >
                            Limpiar
                        </Button>
                    )}
                </div>
            </div>

            {loading && !stats ? (
                <div className="h-[400px] w-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : stats ? (
                <>
                    {/* KPI Cards */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Inversión Total SEP</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(stats.totalInvestment)}</div>
                                <p className="text-xs text-muted-foreground">
                                    En compras con órdenes generadas
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Solicitudes Gestionadas</CardTitle>
                                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                                <p className="text-xs text-muted-foreground">
                                    Total de procesos de compra SEP
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Establecimientos</CardTitle>
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.bySchool.length}</div>
                                <p className="text-xs text-muted-foreground">
                                    Con movimientos este periodo
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts & Details */}
                    <div className="grid gap-4 md:grid-cols-7">
                        <div className="col-span-4">
                            <SepEvolutionChart data={stats.monthlyEvolution} year={year} />
                        </div>
                        <div className="col-span-3">
                            <Card className="h-full flex flex-col">
                                <CardHeader>
                                    <CardTitle>Desglose por Escuela</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1 overflow-auto max-h-[400px]">
                                    <div className="space-y-4">
                                        {stats.bySchool.map((item) => (
                                            <div key={item.name} className="flex items-center">
                                                <div className="ml-4 space-y-1 flex-1">
                                                    <p className="text-sm font-medium leading-none">{item.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {item.count} compras
                                                    </p>
                                                </div>
                                                <div className="font-medium text-sm">
                                                    {formatCurrency(item.amount)}
                                                </div>
                                            </div>
                                        ))}
                                        {stats.bySchool.length === 0 && (
                                            <div className="text-center text-muted-foreground py-8">
                                                Sin datos para mostrar
                                            </div>
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
