"use client";

import { useCallback, useEffect, useState } from "react";

import { useSearchParams } from "next/navigation";

import { AlertCircle, Loader2, X } from "lucide-react";
import type { ListResult } from "pocketbase";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCompras } from "@/services/compras.service";
import { getRequirentes } from "@/services/requirentes.service";
import { getSubvenciones } from "@/services/subvenciones.service";
import type { Compra } from "@/types/compra";
import type { Requirente } from "@/types/requirente";

import { ComprasSepTable } from "./components/compras-sep-table";

export default function ComprasSepPage() {
  const searchParams = useSearchParams();
  const search = searchParams.get("search") || "";

  const [data, setData] = useState<ListResult<Compra> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sepSubvencionId, setSepSubvencionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // States for filters
  const [establecimientos, setEstablecimientos] = useState<Requirente[]>([]);
  const [selectedEstablecimientoId, setSelectedEstablecimientoId] = useState<string>("all");
  const [ordinarioSearch, setOrdinarioSearch] = useState<string>("");

  // Initial load: Find the "Ley SEP" subvencion ID using a robust search
  useEffect(() => {
    const findSepId = async () => {
      try {
        // Try searching strictly first
        const result = await getSubvenciones({ search: "SEP", perPage: 50 });

        // Logic: Look for "Ley SEP" or just "SEP". Ideally user configures this string.
        // We'll pick the first one that contains "SEP" case insensitive if exact match fails.

        const foundSep = result.items.find(
          (s) => s.nombre.toLowerCase().includes("sep") || s.descripcion.toLowerCase().includes("sep"),
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

    // Load establishments for filter
    const loadEstablecimientos = async () => {
      try {
        const result = await getRequirentes({ perPage: 100, sort: "nombre", sep_filter: true });
        setEstablecimientos(result.items);
      } catch (err) {
        console.error("Error loading establishments:", err);
      }
    };
    loadEstablecimientos();
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
        search: search,
        unidad_requirente_id: selectedEstablecimientoId === "all" ? undefined : selectedEstablecimientoId,
        numero_ordinario: ordinarioSearch ? Number(ordinarioSearch) : undefined,
      });
      setData(result);
    } catch (err) {
      console.error("Error loading compras:", err);
      // setError("Error al cargar las compras.");
    } finally {
      setLoading(false);
    }
  }, [page, sepSubvencionId, search, selectedEstablecimientoId, ordinarioSearch]);

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
    );
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
        <h1 className="font-bold text-2xl tracking-tight">Compras SEP</h1>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex-1 min-w-[200px]">
          <label
            htmlFor="establecimiento-filter"
            className="text-xs font-medium mb-1.5 block text-muted-foreground uppercase tracking-wider"
          >
            Establecimiento
          </label>
          <Select
            value={selectedEstablecimientoId}
            onValueChange={(val) => {
              setSelectedEstablecimientoId(val);
              setPage(1);
            }}
          >
            <SelectTrigger id="establecimiento-filter" className="w-full">
              <SelectValue placeholder="Todos los establecimientos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los establecimientos</SelectItem>
              {establecimientos.map((est) => (
                <SelectItem key={est.id} value={est.id}>
                  {est.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label
            htmlFor="ordinario-filter"
            className="text-xs font-medium mb-1.5 block text-muted-foreground uppercase tracking-wider"
          >
            Número de Ordinario
          </label>
          <div className="relative">
            <Input
              id="ordinario-filter"
              placeholder="Buscar por N° Ord..."
              type="number"
              value={ordinarioSearch}
              onChange={(e) => {
                setOrdinarioSearch(e.target.value);
                setPage(1);
              }}
              className="pr-10"
            />
            {ordinarioSearch && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => {
                  setOrdinarioSearch("");
                  setPage(1);
                }}
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          <ComprasSepTable data={data?.items || []} onDataChanged={loadCompras} />

          {data && data.totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink isActive>{page}</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
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
