"use client";

import { useRouter, useSearchParams } from "next/navigation";
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
import type { Compra, EstadoCompra, GetComprasParams } from "@/types/compra";
import type { Subvencion } from "@/types/subvencion";
import { getCompras } from "@/services/compras.service";
import { getSubvenciones } from "@/services/subvenciones.service";
import { useAuth } from "@/hooks/use-auth";
import { canCreateCompra } from "@/utils/permissions";

import { ComprasTable } from "./components/compras-table";
import { CompraDialog } from "./components/compra-dialog";

export default function ComprasPage() {
    const searchParams = useSearchParams();
    const urlSearch = searchParams.get("search") || "";

    const [comprasData, setComprasData] = useState<ListResult<Compra> | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState(urlSearch); // Initialize with URL param
    const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    // Subventions state
    const [subvenciones, setSubvenciones] = useState<Subvencion[]>([]);

    const { user } = useAuth();

    // Sync local search when URL changes (e.g. from global search)
    useEffect(() => {
        if (urlSearch !== search) {
            setSearch(urlSearch);
        }
    }, [urlSearch]);

    // Filtros de columna
    const [filters, setFilters] = useState<GetComprasParams>({
        unidad_requirente_filter: undefined,
        numero_ordinario: undefined,
        descripcion_filter: "",
        comprador_filter: undefined,
        estado_filter: undefined,
        created_from: "",
        created_to: "",
        subvencion_filter: undefined,
    });

    useEffect(() => {
        const fetchSubvenciones = async () => {
            try {
                const result = await getSubvenciones({ perPage: 100, sort: "nombre" });
                setSubvenciones(result.items);
            } catch (error) {
                console.error("Error loading subvenciones:", error);
            }
        };
        fetchSubvenciones();
    }, []);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset to first page on search
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    const loadCompras = useCallback(async () => {
        setLoading(true);
        try {
            const isObservador = user?.role.includes("Observador");
            const restrictedFilters = { ...filters };

            // Si es observador y tiene dependencia asignada, filtramos por ella
            if (isObservador && user?.dependencia) {
                restrictedFilters.unidad_requirente_id = user.dependencia;
            }

            const data = await getCompras({
                page,
                perPage: 30,
                search: debouncedSearch,
                sort: "-created",
                ...restrictedFilters,
            });
            setComprasData(data);
        } catch (error) {
            console.error("Error loading compras:", error);
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearch, filters, user]);

    useEffect(() => {
        loadCompras();
    }, [loadCompras]);

    const userCanCreate = user ? canCreateCompra(user.role) : false;
    const isObservadorRestricted = user?.role.includes("Observador") && !!user?.dependencia;

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Compras</h1>
                    <p className="text-muted-foreground">
                        Gestiona las compras del sistema
                    </p>
                </div>
                {userCanCreate && (
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva Compra
                    </Button>
                )}
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por numero de Ordinario..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="w-[300px]">
                    <Select
                        value={filters.subvencion_filter || "all"}
                        onValueChange={(value) => {
                            setFilters(prev => ({
                                ...prev,
                                subvencion_filter: value === "all" ? undefined : value
                            }));
                            setPage(1);
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Filtrar por Subvención" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas las subvenciones</SelectItem>
                            {subvenciones.map((sub) => (
                                <SelectItem key={sub.id} value={sub.id}>
                                    {sub.nombre}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {loading && !comprasData ? (
                <div className="flex items-center justify-center p-8">
                    <div className="text-muted-foreground">Cargando compras...</div>
                </div>
            ) : (
                <>
                    <div className="relative">
                        {loading && (
                            <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center backdrop-blur-[1px]">
                                <div className="text-muted-foreground text-sm bg-background px-3 py-1 rounded-full border shadow-sm">Actualizando...</div>
                            </div>
                        )}
                        <ComprasTable
                            compras={comprasData?.items || []}
                            onCompraUpdated={loadCompras}
                            filters={filters}
                            onFiltersChange={(newFilters) => {
                                setFilters(newFilters);
                                setPage(1); // Reset to first page when filters change
                            }}
                            currentUser={user}
                            isRestricted={isObservadorRestricted}
                        />
                    </div>

                    {comprasData && comprasData.totalPages > 1 && (
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>

                                {[...Array(comprasData.totalPages)].map((_, i) => {
                                    const pageNum = i + 1;
                                    if (
                                        pageNum === 1 ||
                                        pageNum === comprasData.totalPages ||
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
                                        onClick={() => setPage((p) => Math.min(comprasData.totalPages, p + 1))}
                                        className={
                                            page === comprasData.totalPages
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

            <CompraDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                onSuccess={() => {
                    setIsCreateDialogOpen(false);
                    loadCompras();
                }}
                currentUser={user}
            />
        </div>
    );
}
