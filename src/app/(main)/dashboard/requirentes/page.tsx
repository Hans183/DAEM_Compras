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
import type { Requirente } from "@/types/requirente";
import { getRequirentes } from "@/services/requirentes.service";

import { RequirentesTable } from "./components/requirentes-table";
import { RequirenteDialog } from "./components/requirente-dialog";

export default function RequirentesPage() {
    const [requirentesData, setRequirentesData] = useState<ListResult<Requirente> | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    const loadRequirentes = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getRequirentes({
                page,
                perPage: 30,
                search: debouncedSearch,
                sort: "-created",
            });
            setRequirentesData(data);
        } catch (error) {
            console.error("Error loading requirentes:", error);
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearch]);

    useEffect(() => {
        loadRequirentes();
    }, [loadRequirentes]);

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Unidades Requirentes</h1>
                    <p className="text-muted-foreground">
                        Gestiona las unidades requirentes del sistema
                    </p>
                </div>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Unidad
                </Button>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Buscar unidades requirentes..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-8">
                    <div className="text-muted-foreground">Cargando unidades requirentes...</div>
                </div>
            ) : (
                <>
                    <RequirentesTable
                        requirentes={requirentesData?.items || []}
                        onRequirenteUpdated={loadRequirentes}
                    />

                    {requirentesData && requirentesData.totalPages > 1 && (
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>

                                {[...Array(requirentesData.totalPages)].map((_, i) => {
                                    const pageNum = i + 1;
                                    if (
                                        pageNum === 1 ||
                                        pageNum === requirentesData.totalPages ||
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
                                        onClick={() => setPage((p) => Math.min(requirentesData.totalPages, p + 1))}
                                        className={
                                            page === requirentesData.totalPages
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

            <RequirenteDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                onSuccess={() => {
                    setIsCreateDialogOpen(false);
                    loadRequirentes();
                }}
            />
        </div>
    );
}
