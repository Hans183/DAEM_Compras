"use client";

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { MoreHorizontal, FileText, X, AlertTriangle, Eye, Ban, Pencil, Loader2, Calendar as CalendarIcon, Printer } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import { getAllRecepciones, getRecepcionFileUrl } from "@/services/recepciones.service";
import type { Recepcion } from "@/types/recepcion";
import type { User } from "@/types/user";
import { cn } from "@/lib/utils";
import { CompraSheet } from "../../compras/components/compra-sheet";
import { AnularRecepcionDialog } from "./anular-recepcion-dialog";
import { RecepcionDialog } from "../../compras/components/recepcion-dialog"; // Reusing the dialog? Wait, RecepcionDialog needs 'compra' prop. 
// Issue: RecepcionDialog currently requires 'compra'. For editing, we might need to adapt it or fetch the compra.
// For now, I will enable Edit only if we interpret how to pass 'compra'.
// Actually, Recepcion has 'expand.compra'.

interface RecepcionesTableProps {
    currentUser: User | null;
}

export function RecepcionesTable({ currentUser }: RecepcionesTableProps) {
    const [recepciones, setRecepciones] = useState<Recepcion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);

    const [viewingRecepcion, setViewingRecepcion] = useState<Recepcion | null>(null);
    const [editingRecepcion, setEditingRecepcion] = useState<Recepcion | null>(null);
    const [cancelingRecepcion, setCancelingRecepcion] = useState<Recepcion | null>(null);

    // Editing not fully implemented yet in RecepcionDialog for general update, 
    // but we can add it if requested. For now focusing on List, View, Print, Anular.

    const fetchRecepciones = async () => {
        setIsLoading(true);
        try {
            let filter = "";
            const filters: string[] = [];

            if (searchTerm) {
                filters.push(`(folio ~ "${searchTerm}" || compra.numero_ordinario ~ "${searchTerm}" || documento_numero ~ "${searchTerm}")`);
            }

            if (filterDate) {
                const dateStr = format(filterDate, "yyyy-MM-dd");
                filters.push(`fecha_recepcion ~ "${dateStr}"`);
            }

            if (filters.length > 0) {
                filter = filters.join(" && ");
            }

            const result = await getAllRecepciones(1, 100, filter);
            // Pagination to be added if needed, sticking to 100 for now or implement full pagination later
            setRecepciones(result.items);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar recepciones");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchRecepciones();
        }, 500);
        return () => clearTimeout(timeout);
    }, [searchTerm, filterDate]);

    const handleSuccess = () => {
        fetchRecepciones();
        setCancelingRecepcion(null);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Input
                        placeholder="Buscar por Folio, OC, N° Doc..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                    />
                </div>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("justify-start text-left font-normal", !filterDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filterDate ? format(filterDate, "dd/MM/yyyy") : "Filtrar por fecha"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={filterDate}
                            onSelect={setFilterDate}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
                {filterDate && (
                    <Button variant="ghost" size="icon" onClick={() => setFilterDate(undefined)}>
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Folio</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Compra / OC</TableHead>
                            <TableHead>Unidad Requirente</TableHead>
                            <TableHead>Documento</TableHead>
                            <TableHead>Receptor</TableHead>
                            <TableHead className="text-center">Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : recepciones.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                    No se encontraron recepciones
                                </TableCell>
                            </TableRow>
                        ) : (
                            recepciones.map((recepcion) => (
                                <TableRow key={recepcion.id}>
                                    <TableCell className="font-mono font-medium">{recepcion.folio}</TableCell>
                                    <TableCell>{format(parseISO(recepcion.fecha_recepcion), "dd/MM/yyyy")}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-xs">
                                                {recepcion.expand?.orden_compra?.oc || recepcion.expand?.compra?.numero_ordinario}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                                                {recepcion.expand?.compra?.descripcion}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {recepcion.expand?.compra?.expand?.unidad_requirente?.nombre || "-"}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium">{recepcion.documento_tipo}</span>
                                            <span className="text-xs text-muted-foreground">{recepcion.documento_numero || "-"}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs">{recepcion.expand?.recepcionado_por?.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={recepcion.estado === "Anulado" ? "destructive" : "outline"} className={cn(
                                            recepcion.estado === "Anulado" ? "bg-red-100 text-red-800 hover:bg-red-200 border-red-200" : "bg-green-100 text-green-800 hover:bg-green-200 border-green-200"
                                        )}>
                                            {recepcion.estado || "Conforme"}
                                        </Badge>
                                    </TableCell>

                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => setViewingRecepcion(recepcion)}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    Ver Detalle Compra
                                                </DropdownMenuItem>

                                                {/* For displaying file links directly if needed */}
                                                {recepcion.adjuntos && recepcion.adjuntos.length > 0 && (
                                                    <DropdownMenuItem onClick={() => {
                                                        const url = getRecepcionFileUrl(recepcion, recepcion.adjuntos![0]);
                                                        if (url) window.open(url, "_blank");
                                                    }}>
                                                        <FileText className="mr-2 h-4 w-4" />
                                                        Ver Documento
                                                    </DropdownMenuItem>
                                                )}

                                                <DropdownMenuItem onClick={() => {
                                                    window.open(`/imprimir/recepciones/${recepcion.id}`, "_blank");
                                                }}>
                                                    <Printer className="mr-2 h-4 w-4" />
                                                    Imprimir
                                                </DropdownMenuItem>

                                                {recepcion.estado !== "Anulado" && (
                                                    <DropdownMenuItem
                                                        onClick={() => setEditingRecepcion(recepcion)}
                                                    >
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
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Dialogs */}
            {viewingRecepcion && viewingRecepcion.expand?.compra && (
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

            {editingRecepcion && editingRecepcion.expand?.compra && (
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
