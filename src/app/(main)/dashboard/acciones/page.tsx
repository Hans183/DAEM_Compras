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
import { getAcciones } from "@/services/acciones.service";
import { getCompras } from "@/services/compras.service";
import { getRequirentes } from "@/services/requirentes.service";
import { getDimensiones, getSubdimenciones } from "@/services/dimensiones.service";
import type { Accion } from "@/types/accion";
import type { Requirente } from "@/types/requirente";
import type { Dimension, Subdimencion } from "@/types/dimension";
import { AccionesTable } from "./components/acciones-table";
import { AccionDialog } from "./components/accion-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function AccionesPage() {
    const [data, setData] = useState<ListResult<Accion> | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Filter states
    const [establecimientos, setEstablecimientos] = useState<Requirente[]>([]);
    const [dimensiones, setDimensiones] = useState<Dimension[]>([]);
    const [subdimenciones, setSubdimenciones] = useState<Subdimencion[]>([]);

    const [selectedEstablecimiento, setSelectedEstablecimiento] = useState<string>("");
    const [selectedDimension, setSelectedDimension] = useState<string>("");
    const [selectedSubdimencion, setSelectedSubdimencion] = useState<string>("");

    // Load filter options
    useEffect(() => {
        const loadOptions = async () => {
            try {
                const [schoolsMsg, dimsMsg] = await Promise.all([
                    getRequirentes({ perPage: 500, sort: "nombre" }),
                    getDimensiones()
                ]);
                setEstablecimientos(schoolsMsg.items);
                setDimensiones(dimsMsg);
            } catch (error) {
                console.error("Error loading filter options:", error);
            }
        };
        loadOptions();
    }, []);

    // Load subdimensions when dimension changes
    useEffect(() => {
        const loadSubs = async () => {
            if (selectedDimension && selectedDimension !== "all") {
                const subs = await getSubdimenciones(selectedDimension);
                setSubdimenciones(subs);
            } else {
                setSubdimenciones([]);
            }
        };
        loadSubs();
    }, [selectedDimension]);

    // Cleanup subdimension selection if dimension changes
    useEffect(() => {
        if (selectedDimension === "all" || !selectedDimension) {
            setSelectedSubdimencion("");
        }
    }, [selectedDimension]);

    // Debounce search
    const [debouncedSearch, setDebouncedSearch] = useState("");
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const [usageMap, setUsageMap] = useState<Record<string, number>>({});

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [accionesResult, comprasResult] = await Promise.all([
                getAcciones({
                    page,
                    perPage: 30,
                    search: debouncedSearch,
                    establecimiento_filter: selectedEstablecimiento === "all" ? "" : selectedEstablecimiento,
                    dimension_filter: selectedDimension === "all" ? "" : selectedDimension,
                    subdimencion_filter: selectedSubdimencion === "all" ? "" : selectedSubdimencion,
                }),
                // Fetch ALL compras to calculate usage correctly across all actions
                // Optimization: In a real large app, we might want to aggregate this on the backend
                getCompras({ perPage: 1000, sort: "-created" })
            ]);

            setData(accionesResult);

            // Calculate usage map
            const map: Record<string, number> = {};
            comprasResult.items.forEach(compra => {
                if (compra.accion && compra.presupuesto) {
                    if (!map[compra.accion]) map[compra.accion] = 0;
                    map[compra.accion] += compra.presupuesto;
                }
            });
            setUsageMap(map);

        } catch (error) {
            console.error("Error loading acciones:", error);
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearch, selectedEstablecimiento, selectedDimension, selectedSubdimencion]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Acciones</h1>
                    <p className="text-muted-foreground">
                        Gestiona las acciones y su planificación
                    </p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Acción
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar acciones..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPage(1);
                        }}
                        className="pl-8"
                    />
                </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-6">
                <div className="w-[240px]">
                    <Select
                        value={selectedEstablecimiento}
                        onValueChange={(val) => {
                            setSelectedEstablecimiento(val);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Establecimiento" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {establecimientos.map((school) => (
                                <SelectItem key={school.id} value={school.id}>
                                    {school.nombre.length > 25 ? `${school.nombre.slice(0, 25)}...` : school.nombre}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="w-[200px]">
                    <Select
                        value={selectedDimension}
                        onValueChange={(val) => {
                            setSelectedDimension(val);
                            setSelectedSubdimencion(""); // Reset sub when dim changes
                            setPage(1);
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Dimensión" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            {dimensiones.map((dim) => (
                                <SelectItem key={dim.id} value={dim.id}>
                                    {dim.nombre}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="w-[200px]">
                    <Select
                        value={selectedSubdimencion}
                        onValueChange={(val) => {
                            setSelectedSubdimencion(val);
                            setPage(1);
                        }}
                        disabled={!selectedDimension || selectedDimension === "all"}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Subdimensión" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            {subdimenciones.map((sub) => (
                                <SelectItem key={sub.id} value={sub.id}>
                                    {sub.nombre}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-8">
                    <div className="text-muted-foreground">Cargando acciones...</div>
                </div>
            ) : (
                <>
                    <AccionesTable
                        data={data?.items || []}
                        usageMap={usageMap}
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

            <AccionDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onSuccess={loadData}
            />
        </div>
    );
}
