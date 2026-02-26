"use client";

import { useCallback, useEffect, useState } from "react";

import Link from "next/link";

import { Calendar, Check, ChevronsUpDown, ClipboardList, Plus, Search, Users } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { getAcciones } from "@/services/acciones.service";
import { getCompras } from "@/services/compras.service";
import { getDimensiones, getSubdimenciones } from "@/services/dimensiones.service";
import { getRequirentes } from "@/services/requirentes.service";
import type { Accion } from "@/types/accion";
import type { Dimension, Subdimencion } from "@/types/dimension";
import type { Requirente } from "@/types/requirente";

import { AccionDialog } from "./components/accion-dialog";
import { AccionesTable } from "./components/acciones-table";

export default function AccionesPage() {
  const [data, setData] = useState<ListResult<Accion> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Filter states
  const [establecimientos, setEstablecimientos] = useState<Requirente[]>([]);
  const [dimensiones, setDimensiones] = useState<Dimension[]>([]);
  const [subdimenciones, setSubdimenciones] = useState<Subdimencion[]>([]);

  const [selectedEstablecimiento, setSelectedEstablecimiento] = useState<string>("");
  const [selectedDimension, setSelectedDimension] = useState<string>("");
  const [selectedSubdimencion, setSelectedSubdimencion] = useState<string>("");
  const [openCombobox, setOpenCombobox] = useState(false);

  // Load filter options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [schoolsMsg, dimsMsg] = await Promise.all([
          getRequirentes({
            perPage: 500,
            sort: "nombre",
            sep_filter: true,
          }),
          getDimensiones(),
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
        getCompras({ perPage: 1000, sort: "-created" }),
      ]);

      setData(accionesResult);

      // Calculate usage map
      const map: Record<string, number> = {};
      comprasResult.items.forEach((compra) => {
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
    <div className="flex flex-col gap-8 p-6">
      {/* Top Header Section */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold tracking-tight">Apartado de Acciones</h1>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">PERIODO</span>
            <Select
              value={selectedYear.toString()}
              onValueChange={(val) => {
                setSelectedYear(Number(val));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-7 text-xs w-[120px]">
                <Calendar className="mr-2 h-3 w-3" />
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/compras-sep">
              <ClipboardList className="mr-2 h-4 w-4" />
              VER ORDENES
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/rrhh-sep">
              <Users className="mr-2 h-4 w-4" />
              VER DOCENTES
            </Link>
          </Button>
        </div>
      </div>

      {/* Center School Search Card */}
      <div className="flex justify-center my-2">
        <div className="w-[500px] border rounded-md p-6 flex flex-col items-center gap-6 relative mt-4">
          <div className="absolute -top-3 bg-background px-2 text-xs text-muted-foreground w-max text-center">
            Buscar Colegio
          </div>

          <div className="w-full">
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCombobox}
                  className="w-full h-10 justify-between font-normal bg-background"
                >
                  <span className="truncate">
                    {selectedEstablecimiento
                      ? selectedEstablecimiento === "all"
                        ? "Todos"
                        : establecimientos.find((school) => school.id === selectedEstablecimiento)?.nombre ||
                          "Seleccione un colegio"
                      : "Seleccione un colegio"}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[450px] p-0" align="center">
                <Command>
                  <CommandInput placeholder="Buscar colegio..." />
                  <CommandList>
                    <CommandEmpty>No se encontró ningún colegio.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="todos los colegios"
                        onSelect={() => {
                          setSelectedEstablecimiento("all");
                          setPage(1);
                          setOpenCombobox(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 shrink-0",
                            selectedEstablecimiento === "all" || !selectedEstablecimiento ? "opacity-100" : "opacity-0",
                          )}
                        />
                        Todos
                      </CommandItem>
                      {establecimientos.map((school) => (
                        <CommandItem
                          key={school.id}
                          value={`${school.nombre} ${school.id}`}
                          onSelect={() => {
                            setSelectedEstablecimiento(school.id);
                            setPage(1);
                            setOpenCombobox(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 shrink-0",
                              selectedEstablecimiento === school.id ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <span className="truncate">{school.nombre}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <Button className="font-semibold w-[240px]" size="lg" onClick={loadData}>
            CONSULTAR ACCIONES
          </Button>

          <div className="text-sm mt-2">
            Colegio consultado:{" "}
            <span className="font-semibold text-muted-foreground">
              {selectedEstablecimiento === "all" || !selectedEstablecimiento
                ? "Todos"
                : establecimientos.find((e) => e.id === selectedEstablecimiento)?.nombre}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Actions Row */}
      <div className="flex items-center justify-between mt-4">
        <div className="relative w-[600px]">
          <Input
            placeholder="Buscar"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="pr-10 h-10 bg-muted/20"
          />
          <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
        </div>
        <Button onClick={() => setIsCreateOpen(true)} variant="secondary" className="font-semibold px-6">
          <Plus className="mr-2 h-4 w-4" />
          AGREGAR ACCIÓN
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Cargando acciones...</div>
        </div>
      ) : (
        <>
          <AccionesTable data={data?.items || []} usageMap={usageMap} onDataChanged={loadData} />

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
                  if (pageNum === 1 || pageNum === data.totalPages || (pageNum >= page - 1 && pageNum <= page + 1)) {
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
                    className={page === data.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}

      <AccionDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} onSuccess={loadData} />
    </div>
  );
}
