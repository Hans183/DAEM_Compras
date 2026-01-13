"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import type { ListResult } from "pocketbase";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getRrhhSepList } from "@/services/rrhh-sep.service";
import { getRequirentes } from "@/services/requirentes.service";
import type { RrhhSep, GetRrhhSepParams } from "@/types/rrhh-sep";
import type { Requirente } from "@/types/requirente";
import { MONTHS } from "@/types/rrhh-sep";
import { RrhhSepTable } from "./components/rrhh-sep-table";
import { RrhhSepDialog } from "./components/rrhh-sep-dialog";

export default function RrhhSepPage() {
    const [data, setData] = useState<ListResult<RrhhSep> | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [schools, setSchools] = useState<Requirente[]>([]);

    // Filter states - Default to current month and year
    const [selectedMonth, setSelectedMonth] = useState<string>(MONTHS[new Date().getMonth()]);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedSchool, setSelectedSchool] = useState<string>("");

    // Debounce is not strictly needed for month select, but good if we add text search later.
    // Since we filtered by exact match on month and relation on school, currently only month filter is implemented in UI for simplicity,
    // or maybe I should add school filter too?
    // The simplified requirement didn't specify advanced filters, but let's stick to Month filter for now as it's the most common aggregation.
    // Load schools for filter
    useEffect(() => {
        const loadSchools = async () => {
            try {
                const result = await getRequirentes({ perPage: 200, sort: "nombre", sep_filter: true });
                setSchools(result.items);
            } catch (error) {
                console.error("Error loading schools:", error);
            }
        };
        loadSchools();
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getRrhhSepList({
                page,
                perPage: 30,
                sort: "-created",
                mes_filter: selectedMonth === "all" ? undefined : selectedMonth,
                anio_filter: selectedYear || undefined,
                escuelas_filter: selectedSchool === "all" ? undefined : selectedSchool,
            });
            setData(result);
        } catch (error) {
            console.error("Error loading RRHH SEP data:", error);
        } finally {
            setLoading(false);
        }
    }, [page, selectedMonth, selectedYear, selectedSchool]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">RRHH SEP</h1>
                    <p className="text-muted-foreground">
                        Gestiona el gasto en personal por establecimiento
                    </p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Registro
                </Button>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
                <div className="w-[120px]">
                    <Input
                        type="number"
                        placeholder="Año"
                        value={selectedYear}
                        onChange={(e) => {
                            setSelectedYear(Number(e.target.value));
                            setPage(1);
                        }}
                    />
                </div>
                <div className="w-[180px]">
                    <Select
                        value={selectedMonth}
                        onValueChange={(value) => {
                            setSelectedMonth(value);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Filtrar por mes" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los meses</SelectItem>
                            {MONTHS.map((month) => (
                                <SelectItem key={month} value={month}>
                                    {month}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="w-[250px]">
                    <Select
                        value={selectedSchool}
                        onValueChange={(value) => {
                            setSelectedSchool(value);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Filtrar por establecimiento" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los establecimientos</SelectItem>
                            {schools.map((school) => (
                                <SelectItem key={school.id} value={school.id}>
                                    {school.nombre}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-8">
                    <div className="text-muted-foreground">Cargando registros...</div>
                </div>
            ) : (
                <>
                    <RrhhSepTable
                        data={data?.items || []}
                        onDataChanged={loadData}
                    />

                    {data && data.totalPages > 1 && (
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>

                                {[...Array(data.totalPages)].map((_, i) => {
                                    const pageNum = i + 1;
                                    if (
                                        pageNum === 1 ||
                                        pageNum === data.totalPages ||
                                        (pageNum >= page - 1 && pageNum <= page + 1)
                                    ) {
                                        return (
                                            <PaginationItem key={pageNum}>
                                                <PaginationLink
                                                    onClick={() => setPage(pageNum)}
                                                    isActive={page === pageNum}
                                                    className="cursor-pointer"
                                                >
                                                    {pageNum}
                                                </PaginationLink>
                                            </PaginationItem>
                                        );
                                    }
                                    return null;
                                })}

                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                                        className={
                                            page === data.totalPages
                                                ? "pointer-events-none opacity-50"
                                                : "cursor-pointer"
                                        }
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    )}
                </>
            )}

            <RrhhSepDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onSuccess={loadData}
            />
        </div>
    );
}
