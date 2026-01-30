"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { getCompras } from "@/services/compras.service";
import { getSubvenciones } from "@/services/subvenciones.service";
import type { Compra } from "@/types/compra";
import type { ListResult } from "pocketbase";
import { ComprasSepTable } from "./components/compras-sep-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ComprasSepPage() {
    const [data, setData] = useState<ListResult<Compra> | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [sepSubvencionId, setSepSubvencionId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Initial load: Find the "Ley SEP" subvencion ID using a robust search
    useEffect(() => {
        const findSepId = async () => {
            try {
                // Try searching strictly first
                let result = await getSubvenciones({ search: "SEP", perPage: 50 });

                // Logic: Look for "Ley SEP" or just "SEP". Ideally user configures this string.
                // We'll pick the first one that contains "SEP" case insensitive if exact match fails.

                let foundSep = result.items.find(s =>
                    s.nombre.toLowerCase().includes("sep") ||
                    s.descripcion.toLowerCase().includes("sep")
                );

                if (foundSep) {
                    setSepSubvencionId(foundSep.id);
                } else {
                    setError("No se pudo encontrar la subvención 'Ley SEP'. Por favor verifique que exista en el sistema.");
                    setLoading(false);
                }
            } catch (err) {
                console.error("Error finding SEP subvencion:", err);
                setError("Error al buscar la subvención SEP.");
                setLoading(false);
            }
        };
        findSepId();
    }, []);

    const loadCompras = useCallback(async () => {
        if (!sepSubvencionId) return;

        setLoading(true);
        try {
            const result = await getCompras({
                page,
                perPage: 30,
                sort: "-created",
                subvencion_filter: sepSubvencionId,
            });
            setData(result);
        } catch (err) {
            console.error("Error loading compras:", err);
            // setError("Error al cargar las compras."); 
        } finally {
            setLoading(false);
        }
    }, [page, sepSubvencionId]);

    useEffect(() => {
        if (sepSubvencionId) {
            loadCompras();
        }
    }, [loadCompras, sepSubvencionId]);

    if (error) {
        return (
            <div className="p-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        )
    }

    // While searching for ID (initial state)
    if (loading && !sepSubvencionId) {
        return (
            <div className="flex h-full items-center justify-center p-6">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Compras SEP</h1>
            </div>

            {loading && !data ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <>
                    <ComprasSepTable
                        data={data?.items || []}
                        onDataChanged={loadCompras}
                    />

                    {data && data.totalPages > 1 && (
                        <div className="flex justify-center mt-4">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                        />
                                    </PaginationItem>
                                    <PaginationItem>
                                        <PaginationLink isActive>{page}</PaginationLink>
                                    </PaginationItem>
                                    <PaginationItem>
                                        <PaginationNext
                                            onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                                            className={page === data.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
