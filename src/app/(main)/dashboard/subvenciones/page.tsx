"use client";

import { useEffect, useState } from "react";

import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { getSubvenciones } from "@/services/subvenciones.service";
import type { Subvencion } from "@/types/subvencion";

import { SubvencionDialog } from "./components/subvencion-dialog";
import { SubvencionesTable } from "./components/subvenciones-table";

export default function SubvencionesPage() {
    const [subvenciones, setSubvenciones] = useState<Subvencion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showCreateDialog, setShowCreateDialog] = useState(false);

    const loadSubvenciones = async () => {
        setIsLoading(true);
        try {
            const result = await getSubvenciones({
                page: currentPage,
                perPage: 10,
                search,
            });
            setSubvenciones(result.items);
            setTotalPages(result.totalPages);
        } catch (error) {
            console.error("Error loading subvenciones:", error);
            toast.error("Error al cargar subvenciones");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadSubvenciones();
    }, [currentPage, search]);

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setCurrentPage(1);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Subvenciones</h1>
                    <p className="text-muted-foreground">Gestiona las subvenciones del sistema</p>
                </div>
                <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Subvención
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre o descripción..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
            ) : (
                <>
                    <SubvencionesTable subvenciones={subvenciones} onSubvencionUpdated={loadSubvenciones} />

                    {totalPages > 1 && (
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                    if (
                                        page === 1 ||
                                        page === totalPages ||
                                        (page >= currentPage - 1 && page <= currentPage + 1)
                                    ) {
                                        return (
                                            <PaginationItem key={page}>
                                                <PaginationLink
                                                    onClick={() => setCurrentPage(page)}
                                                    isActive={currentPage === page}
                                                    className="cursor-pointer"
                                                >
                                                    {page}
                                                </PaginationLink>
                                            </PaginationItem>
                                        );
                                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                                        return (
                                            <PaginationItem key={page}>
                                                <PaginationEllipsis />
                                            </PaginationItem>
                                        );
                                    }
                                    return null;
                                })}

                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        className={
                                            currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
                                        }
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    )}
                </>
            )}

            <SubvencionDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                onSuccess={() => {
                    setShowCreateDialog(false);
                    loadSubvenciones();
                }}
            />
        </div>
    );
}
