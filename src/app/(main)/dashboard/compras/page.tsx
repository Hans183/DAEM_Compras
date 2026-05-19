"use client";

import { useCallback, useEffect, useState } from "react";

import { useSearchParams } from "next/navigation";

import { Check, ChevronsUpDown, Plus, Search } from "lucide-react";
import type { ListResult } from "pocketbase";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { getCompras } from "@/services/compras.service";
import { getRequirenteById, getRequirentes } from "@/services/requirentes.service";
import { getSubvenciones } from "@/services/subvenciones.service";
import type { Compra, GetComprasParams } from "@/types/compra";
import type { Requirente } from "@/types/requirente";
import type { Subvencion } from "@/types/subvencion";
import { canCreateCompra } from "@/utils/permissions";

import { CompraDialog } from "./components/compra-dialog";
import { ComprasTable } from "./components/compras-table";

export default function ComprasPage() {
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get("search") || "";

  const [comprasData, setComprasData] = useState<ListResult<Compra> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Search states
  const [ordinarioSearch, setOrdinarioSearch] = useState("");
  const [debouncedOrdinario, setDebouncedOrdinario] = useState("");

  const [globalSearch, setGlobalSearch] = useState(urlSearch);
  const [debouncedGlobal, setDebouncedGlobal] = useState(urlSearch);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Subventions state
  const [subvenciones, setSubvenciones] = useState<Subvencion[]>([]);
  // Requirentes state
  const [requirentes, setRequirentes] = useState<Requirente[]>([]);
  const [loadingRequirentes, setLoadingRequirentes] = useState(true);
  const [openRequirenteCombobox, setOpenRequirenteCombobox] = useState(false);

  const { user, loading: authLoading } = useAuth();

  // Sync local search when URL changes (e.g. from global search)
  useEffect(() => {
    setGlobalSearch(urlSearch);
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
    unidad_requirente_id: undefined,
  });

  useEffect(() => {
    if (authLoading) return;

    const fetchSubvenciones = async () => {
      try {
        const result = await getSubvenciones({ perPage: 100, sort: "nombre" });
        setSubvenciones(result.items);
      } catch (error) {
        console.error("Error loading subvenciones:", error);
      }
    };
    const fetchRequirentes = async () => {
      setLoadingRequirentes(true);
      try {
        const isObservador = user?.role?.includes("Observador");
        const isRestricted = isObservador && !!user?.dependencia;

        if (isRestricted && user?.dependencia) {
          const req = await getRequirenteById(user.dependencia);
          if (req) {
            setRequirentes([req]);
          } else {
            // Fallback since the dependency ID wasn't found (returned null)
            const result = await getRequirentes({ perPage: 500, sort: "nombre" });
            setRequirentes(result.items);
          }
        } else {
          const result = await getRequirentes({ perPage: 500, sort: "nombre" });
          setRequirentes(result.items);
        }
      } catch (error) {
        console.error("Error loading requirentes:", error);
      } finally {
        setLoadingRequirentes(false);
      }
    };
    fetchSubvenciones();
    fetchRequirentes();
  }, [authLoading, user?.role, user?.dependencia]);

  // Debounce Ordinario search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedOrdinario(ordinarioSearch);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [ordinarioSearch]);

  // Debounce Global search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedGlobal(globalSearch);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [globalSearch]);

  const loadCompras = useCallback(async () => {
    if (authLoading) return;
    setLoading(true);
    try {
      const isObservador = user?.role?.includes("Observador");
      const restrictedFilters = { ...filters };

      // Si es observador y tiene dependencia asignada, filtramos por ella
      if (isObservador && user?.dependencia) {
        restrictedFilters.unidad_requirente_id = user.dependencia;
      }

      const data = await getCompras({
        page,
        perPage: 30,
        search: debouncedGlobal,
        search_fields: ["descripcion", "oc"], // General search only in Description and OC
        sort: "-created",
        ...restrictedFilters,
        // Override with top search if present
        numero_ordinario: debouncedOrdinario || restrictedFilters.numero_ordinario,
      });
      setComprasData(data);
    } catch (error) {
      console.error("Error loading compras:", error);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedOrdinario, debouncedGlobal, filters, user?.role, user?.dependencia, authLoading]);

  useEffect(() => {
    loadCompras();
  }, [loadCompras]);

  const handleFiltersChange = useCallback((newFilters: GetComprasParams) => {
    setFilters((prev) => {
      // Shallow comparison to break infinite loops
      const hasChanged = Object.keys(newFilters).some(
        (key) => newFilters[key as keyof GetComprasParams] !== prev[key as keyof GetComprasParams],
      );
      if (!hasChanged) return prev;
      return newFilters;
    });
    setPage(1); // Reset to first page when filters change
  }, []);

  const userCanCreate = user ? canCreateCompra(user.role) : false;
  const isObservadorRestricted = user?.role.includes("Observador") && !!user?.dependencia;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Compras</h1>
          <p className="text-muted-foreground">Gestiona las compras del sistema</p>
        </div>
        {userCanCreate && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Compra
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative max-w-[200px] flex-1">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="N° Ordinario..."
            value={ordinarioSearch}
            onChange={(e) => setOrdinarioSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="relative max-w-sm flex-1">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Búsqueda General (Desc / OC)..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="w-[250px]">
          <Select
            value={filters.subvencion_filter || "all"}
            onValueChange={(value) => {
              handleFiltersChange({
                ...filters,
                subvencion_filter: value === "all" ? undefined : value,
              });
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
        <div className="w-[250px]">
          {isObservadorRestricted ? (
            <Select value={user?.dependencia || "restricted"} disabled={true}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {loadingRequirentes
                    ? "Cargando..."
                    : requirentes.find((r) => r.id === user?.dependencia)?.nombre ||
                      `Establecimiento N/A (${user?.dependencia})`}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={user?.dependencia || "restricted"}>
                  {loadingRequirentes
                    ? "Cargando..."
                    : requirentes.find((r) => r.id === user?.dependencia)?.nombre ||
                      `Establecimiento N/A (${user?.dependencia})`}
                </SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Popover open={openRequirenteCombobox} onOpenChange={setOpenRequirenteCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openRequirenteCombobox}
                  className="w-full justify-between bg-background font-normal"
                  disabled={loadingRequirentes}
                >
                  <span className="truncate">
                    {loadingRequirentes
                      ? "Cargando..."
                      : filters.unidad_requirente_id
                        ? requirentes.find((r) => r.id === filters.unidad_requirente_id)?.nombre ||
                          "Filtrar por Establecimiento"
                        : "Todos los establecimientos"}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar establecimiento..." />
                  <CommandList>
                    <CommandEmpty>No se encontró ningún establecimiento.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all-establishments Todos los establecimientos"
                        onSelect={() => {
                          handleFiltersChange({
                            ...filters,
                            unidad_requirente_id: undefined,
                          });
                          setOpenRequirenteCombobox(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 shrink-0",
                            !filters.unidad_requirente_id ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <span className="truncate">Todos los establecimientos</span>
                      </CommandItem>
                      {requirentes.map((req) => (
                        <CommandItem
                          key={req.id}
                          value={`${req.nombre} ${req.id}`}
                          onSelect={() => {
                            handleFiltersChange({
                              ...filters,
                              unidad_requirente_id: req.id,
                            });
                            setOpenRequirenteCombobox(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 shrink-0",
                              filters.unidad_requirente_id === req.id ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <span className="truncate">{req.nombre}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
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
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
                <div className="rounded-full border bg-background px-3 py-1 text-muted-foreground text-sm shadow-sm">
                  Actualizando...
                </div>
              </div>
            )}
            <ComprasTable
              compras={comprasData?.items || []}
              onCompraUpdated={loadCompras}
              filters={filters}
              onFiltersChange={handleFiltersChange}
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
                    className={page === comprasData.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
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
