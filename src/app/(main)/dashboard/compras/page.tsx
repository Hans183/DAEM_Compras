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
import type { Compra, EstadoCompra, GetComprasParams } from "@/types/compra";
import { getCompras } from "@/services/compras.service";
import { useAuth } from "@/hooks/use-auth";
import { canCreateCompra } from "@/utils/permissions";

import { ComprasTable } from "./components/compras-table";
import { CompraDialog } from "./components/compra-dialog";

export default function ComprasPage() {
    const [comprasData, setComprasData] = useState<ListResult<Compra> | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const { user } = useAuth();

    // Filtros de columna
    const [filters, setFilters] = useState<GetComprasParams>({
        unidad_requirente_filter: undefined,
        numero_ordinario: undefined,
        descripcion_filter: "",
        odd_filter: "",
        estado_filter: undefined,
        fecha_odd_from: "",
        fecha_odd_to: "",
        valor_min: undefined,
        valor_max: undefined,
    });

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
            const data = await getCompras({
                page,
                perPage: 30,
                search: debouncedSearch,
                sort: "-created",
                ...filters,
            });
            setComprasData(data);
        } catch (error) {
            console.error("Error loading compras:", error);
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearch, filters]);

    useEffect(() => {
        loadCompras();
    }, [loadCompras]);

    const userCanCreate = user ? canCreateCompra(user.role) : false;

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

            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Buscar compras..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-8">
                    <div className="text-muted-foreground">Cargando compras...</div>
                </div>
            ) : (
                <>
                    <ComprasTable
                        compras={comprasData?.items || []}
                        onCompraUpdated={loadCompras}
                        filters={filters}
                        onFiltersChange={(newFilters) => {
                            setFilters(newFilters);
                            setPage(1); // Reset to first page when filters change
                        }}
                        currentUser={user}
                    />

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
