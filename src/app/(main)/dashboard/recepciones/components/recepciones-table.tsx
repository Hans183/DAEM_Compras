"use client";

import { useCallback, useEffect, useState } from "react";

import { format, parseISO } from "date-fns";
import {
  Ban,
  Calendar as CalendarIcon,
  Check,
  ChevronsUpDown,
  Eye,
  FileText,
  Loader2,
  MoreHorizontal,
  Pencil,
  Printer,
  Search,
  X,
} from "lucide-react";
import type { ListResult } from "pocketbase";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { getAllRecepciones, getRecepcionById, getRecepcionFileUrl } from "@/services/recepciones.service";
import { getRequirentes } from "@/services/requirentes.service";
import type { Recepcion } from "@/types/recepcion";
import type { Requirente } from "@/types/requirente";
import type { User } from "@/types/user";

import { CompraSheet } from "../../compras/components/compra-sheet";
import { RecepcionDialog } from "../../compras/components/recepcion-dialog";
import { AnularRecepcionDialog } from "./anular-recepcion-dialog";

// Cache en memoria de sesión para evitar recargar 500 establecimientos al volver a la vista
let cachedRequirentes: Requirente[] | null = null;

interface RecepcionesTableProps {
  currentUser: User | null;
}

export function RecepcionesTable({ currentUser }: RecepcionesTableProps) {
  const [recepcionesData, setRecepcionesData] = useState<ListResult<Recepcion> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Filter inputs
  const [oficioInput, setOficioInput] = useState("");
  const [debouncedOficio, setDebouncedOficio] = useState("");

  const [ocInput, setOcInput] = useState("");
  const [debouncedOc, setDebouncedOc] = useState("");

  const [folioInput, setFolioInput] = useState("");
  const [debouncedFolio, setDebouncedFolio] = useState("");

  const [documentoInput, setDocumentoInput] = useState("");
  const [debouncedDocumento, setDebouncedDocumento] = useState("");

  const [unidadRequirenteId, setUnidadRequirenteId] = useState<string | undefined>(undefined);
  const [estadoFilter, setEstadoFilter] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);

  // Requirentes combobox
  const [requirentes, setRequirentes] = useState<Requirente[]>(cachedRequirentes ?? []);
  const [loadingRequirentes, setLoadingRequirentes] = useState(!cachedRequirentes);
  const [openRequirenteCombobox, setOpenRequirenteCombobox] = useState(false);

  const [viewingRecepcion, setViewingRecepcion] = useState<Recepcion | null>(null);
  const [editingRecepcion, setEditingRecepcion] = useState<Recepcion | null>(null);
  const [cancelingRecepcion, setCancelingRecepcion] = useState<Recepcion | null>(null);
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);

  useEffect(() => {
    if (cachedRequirentes) return;
    let active = true;
    const fetchRequirentesList = async () => {
      setLoadingRequirentes(true);
      try {
        const result = await getRequirentes({ perPage: 500, sort: "nombre" });
        cachedRequirentes = result.items;
        if (active) setRequirentes(result.items);
      } catch (error) {
        console.error("Error loading requirentes:", error);
      } finally {
        if (active) setLoadingRequirentes(false);
      }
    };
    fetchRequirentesList();
    return () => {
      active = false;
    };
  }, []);

  // Debounce text filters and reset to page 1 only when input changes
  useEffect(() => {
    if (oficioInput === debouncedOficio) return;
    const timer = setTimeout(() => {
      setDebouncedOficio(oficioInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [oficioInput, debouncedOficio]);

  useEffect(() => {
    if (ocInput === debouncedOc) return;
    const timer = setTimeout(() => {
      setDebouncedOc(ocInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [ocInput, debouncedOc]);

  useEffect(() => {
    if (folioInput === debouncedFolio) return;
    const timer = setTimeout(() => {
      setDebouncedFolio(folioInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [folioInput, debouncedFolio]);

  useEffect(() => {
    if (documentoInput === debouncedDocumento) return;
    const timer = setTimeout(() => {
      setDebouncedDocumento(documentoInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [documentoInput, debouncedDocumento]);

  const fetchRecepciones = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getAllRecepciones({
        page,
        perPage: 20,
        numero_ordinario: debouncedOficio,
        oc: debouncedOc,
        folio: debouncedFolio,
        unidad_requirente_id: unidadRequirenteId,
        documento_numero: debouncedDocumento,
        estado: estadoFilter === "all" ? undefined : estadoFilter,
        fecha_recepcion: filterDate ? format(filterDate, "yyyy-MM-dd") : undefined,
      });
      setRecepcionesData(result);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar recepciones");
    } finally {
      setIsLoading(false);
    }
  }, [
    page,
    debouncedOficio,
    debouncedOc,
    debouncedFolio,
    unidadRequirenteId,
    debouncedDocumento,
    estadoFilter,
    filterDate,
  ]);

  useEffect(() => {
    fetchRecepciones();
  }, [fetchRecepciones]);

  const handleViewRecepcion = async (recepcion: Recepcion) => {
    setLoadingDetailId(recepcion.id);
    try {
      const fullRecepcion = await getRecepcionById(recepcion.id);
      setViewingRecepcion(fullRecepcion);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar el detalle de la compra");
    } finally {
      setLoadingDetailId(null);
    }
  };

  const handleEditRecepcion = async (recepcion: Recepcion) => {
    setLoadingDetailId(recepcion.id);
    try {
      const fullRecepcion = await getRecepcionById(recepcion.id);
      setEditingRecepcion(fullRecepcion);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar los detalles de la recepción para editar");
    } finally {
      setLoadingDetailId(null);
    }
  };

  const handleSuccess = () => {
    fetchRecepciones();
    setCancelingRecepcion(null);
  };

  const hasActiveFilters = Boolean(
    oficioInput ||
      ocInput ||
      folioInput ||
      unidadRequirenteId ||
      documentoInput ||
      estadoFilter !== "all" ||
      filterDate,
  );

  const clearAllFilters = () => {
    setOficioInput("");
    setDebouncedOficio("");
    setOcInput("");
    setDebouncedOc("");
    setFolioInput("");
    setDebouncedFolio("");
    setDocumentoInput("");
    setDebouncedDocumento("");
    setUnidadRequirenteId(undefined);
    setEstadoFilter("all");
    setFilterDate(undefined);
    setPage(1);
  };

  const recepciones = recepcionesData?.items || [];

  return (
    <div className="space-y-4">
      {/* Barra superior de filtros exactos */}
      <div className="rounded-lg border bg-card p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {/* 1. N° de Oficio */}
          <div className="relative">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="N° de Oficio (ej: 120)..."
              value={oficioInput}
              onChange={(e) => setOficioInput(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* 2. N° de Orden de Compra */}
          <div className="relative">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="N° Orden de Compra (OC)..."
              value={ocInput}
              onChange={(e) => setOcInput(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* 3. Folio de Recepción */}
          <div className="relative">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Folio Recepción (ej: 623)..."
              value={folioInput}
              onChange={(e) => setFolioInput(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* 4. Unidad Requirente */}
          <div>
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
                      ? "Cargando establecimientos..."
                      : unidadRequirenteId
                        ? requirentes.find((r) => r.id === unidadRequirenteId)?.nombre || "Filtrar Establecimiento"
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
                          setUnidadRequirenteId(undefined);
                          setPage(1);
                          setOpenRequirenteCombobox(false);
                        }}
                      >
                        <Check
                          className={cn("mr-2 h-4 w-4 shrink-0", !unidadRequirenteId ? "opacity-100" : "opacity-0")}
                        />
                        <span className="truncate">Todos los establecimientos</span>
                      </CommandItem>
                      {requirentes.map((req) => (
                        <CommandItem
                          key={req.id}
                          value={`${req.nombre} ${req.id}`}
                          onSelect={() => {
                            setUnidadRequirenteId(req.id);
                            setPage(1);
                            setOpenRequirenteCombobox(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 shrink-0",
                              unidadRequirenteId === req.id ? "opacity-100" : "opacity-0",
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
          </div>

          {/* 5. N° de Documento */}
          <div className="relative">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="N° Documento (Factura / Guía)..."
              value={documentoInput}
              onChange={(e) => setDocumentoInput(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* 6. Estado */}
          <div>
            <Select
              value={estadoFilter}
              onValueChange={(value) => {
                setEstadoFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Estado de recepción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="Conforme">Conforme</SelectItem>
                <SelectItem value="Anulado">Anulado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 7. Fecha de Recepción */}
          <div className="flex items-center gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !filterDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filterDate ? format(filterDate, "dd/MM/yyyy") : "Filtrar por fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filterDate}
                  onSelect={(d) => {
                    setFilterDate(d);
                    setPage(1);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {filterDate && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setFilterDate(undefined);
                  setPage(1);
                }}
                title="Quitar fecha"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Botón Limpiar Filtros */}
          <div className="flex items-center justify-end">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="w-full sm:w-auto">
                <X className="mr-2 h-4 w-4" />
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Contador de resultados */}
      {recepcionesData && (
        <div className="flex items-center justify-between px-1 text-muted-foreground text-xs">
          <div className="flex items-center gap-2">
            <span>
              Mostrando <strong>{recepciones.length}</strong> de <strong>{recepcionesData.totalItems}</strong>{" "}
              recepciones
            </span>
            {isLoading && (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Actualizando...
              </span>
            )}
          </div>
          {recepcionesData.totalPages > 1 && (
            <span>
              Página {page} de {recepcionesData.totalPages}
            </span>
          )}
        </div>
      )}

      <div
        className={cn(
          "rounded-md border bg-white transition-opacity",
          isLoading && recepciones.length > 0 && "opacity-70",
        )}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Folio</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>N° Oficio</TableHead>
              <TableHead>Orden de Compra</TableHead>
              <TableHead>Unidad Requirente</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Receptor</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && !recepcionesData ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : recepciones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  No se encontraron recepciones
                </TableCell>
              </TableRow>
            ) : (
              recepciones.map((recepcion) => {
                const directOc = recepcion.expand?.orden_compra?.oc;
                const isLoadingRowDetail = loadingDetailId === recepcion.id;

                return (
                  <TableRow key={recepcion.id}>
                    <TableCell className="font-medium font-mono">{recepcion.folio}</TableCell>
                    <TableCell>{format(parseISO(recepcion.fecha_recepcion), "dd/MM/yyyy")}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono font-semibold text-xs">
                          {recepcion.expand?.compra?.numero_ordinario ?? "-"}
                        </span>
                        <span
                          className="max-w-[180px] truncate text-[10px] text-muted-foreground"
                          title={recepcion.expand?.compra?.descripcion}
                        >
                          {recepcion.expand?.compra?.descripcion}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {directOc ? (
                        <span className="font-medium font-mono text-xs">{directOc}</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {recepcion.expand?.compra?.expand?.unidad_requirente?.nombre || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-xs">{recepcion.documento_tipo}</span>
                        <span className="text-muted-foreground text-xs">{recepcion.documento_numero || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{recepcion.expand?.recepcionado_por?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={recepcion.estado === "Anulado" ? "destructive" : "outline"}
                        className={cn(
                          recepcion.estado === "Anulado"
                            ? "border-red-200 bg-red-100 text-red-800 hover:bg-red-200"
                            : "border-green-200 bg-green-100 text-green-800 hover:bg-green-200",
                        )}
                      >
                        {recepcion.estado || "Conforme"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoadingRowDetail}>
                            {isLoadingRowDetail ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewRecepcion(recepcion)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalle Compra
                          </DropdownMenuItem>

                          {recepcion.adjuntos && recepcion.adjuntos.length > 0 && (
                            <DropdownMenuItem
                              onClick={() => {
                                const fileName = recepcion.adjuntos?.[0];
                                if (fileName) {
                                  const url = getRecepcionFileUrl(recepcion, fileName);
                                  if (url) window.open(url, "_blank");
                                }
                              }}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Ver Documento
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem
                            onClick={() => {
                              window.open(`/imprimir/recepciones/${recepcion.id}`, "_blank");
                            }}
                          >
                            <Printer className="mr-2 h-4 w-4" />
                            Imprimir
                          </DropdownMenuItem>

                          {recepcion.estado !== "Anulado" && (
                            <DropdownMenuItem onClick={() => handleEditRecepcion(recepcion)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                          )}

                          {recepcion.estado !== "Anulado" && (
                            <DropdownMenuItem
                              onClick={() => setCancelingRecepcion(recepcion)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Anular Recepción
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      {recepcionesData && recepcionesData.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>

            {[...Array(recepcionesData.totalPages)].map((_, i) => {
              const pageNum = i + 1;
              if (
                pageNum === 1 ||
                pageNum === recepcionesData.totalPages ||
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
                onClick={() => setPage((p) => Math.min(recepcionesData.totalPages, p + 1))}
                className={page === recepcionesData.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Dialogs */}
      {viewingRecepcion?.expand?.compra && (
        <Dialog open={!!viewingRecepcion} onOpenChange={(open) => !open && setViewingRecepcion(null)}>
          <DialogContent className="!max-w-[60vw] !w-[60vw] max-h-[90vh] overflow-y-auto">
            <DialogTitle className="sr-only">Detalle de Compra</DialogTitle>
            <DialogDescription className="sr-only">
              Detalles de la compra y sus órdenes de compra asociadas.
            </DialogDescription>
            <CompraSheet
              compra={viewingRecepcion.expand.compra}
              currentUser={currentUser}
              linkedOcId={viewingRecepcion.expand?.orden_compra?.id}
            />
          </DialogContent>
        </Dialog>
      )}

      {editingRecepcion?.expand?.compra && (
        <RecepcionDialog
          compra={editingRecepcion.expand.compra}
          open={!!editingRecepcion}
          onOpenChange={(open) => !open && setEditingRecepcion(null)}
          onSuccess={handleSuccess}
          currentUser={currentUser}
          initialData={editingRecepcion}
        />
      )}

      {cancelingRecepcion && (
        <AnularRecepcionDialog
          open={!!cancelingRecepcion}
          onOpenChange={(open) => !open && setCancelingRecepcion(null)}
          recepcion={cancelingRecepcion}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
