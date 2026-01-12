"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2, FileText, X, Printer, AlertTriangle, CheckCircle, Clock, Eye } from "lucide-react";
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CompraSheet } from "./compra-sheet";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { Compra, GetComprasParams } from "@/types/compra";
import { ESTADOS_COMPRA } from "@/types/compra";
import type { User } from "@/types/user";
import { getCompraFileUrl } from "@/services/compras.service";
import { canEditCompra, canDeleteCompra } from "@/utils/permissions";

import { DeleteCompraDialog } from "./delete-compra-dialog";
import { CompraDialog } from "./compra-dialog";

interface ComprasTableProps {
    compras: Compra[];
    onCompraUpdated: () => void;
    filters: GetComprasParams;
    onFiltersChange: (filters: GetComprasParams) => void;
    currentUser: User | null;
}

export function ComprasTable({ compras, onCompraUpdated, filters, onFiltersChange, currentUser }: ComprasTableProps) {
    const [editingCompra, setEditingCompra] = useState<Compra | null>(null);
    const [deletingCompra, setDeletingCompra] = useState<Compra | null>(null);
    const [viewingCompra, setViewingCompra] = useState<Compra | null>(null);
    const [showFilters, setShowFilters] = useState<boolean>(false);

    const getEstadoBadgeVariant = (estado: string) => {
        switch (estado) {
            case "Asignado":
                return "outline";
            case "Comprado":
                return "default";
            case "En Bodega":
                return "secondary";
            case "Entregado":
                return "default";
            default:
                return "outline";
        }
    };

    const RenderDeliveryStatus = ({ compra }: { compra: Compra }) => {
        if (!compra.fecha_odd || !compra.plazo_de_entrega) return <span className="text-muted-foreground">-</span>;

        // Si ya está entregado, no mostrar alerta de atraso
        if (compra.estado === "Entregado" || compra.estado === "En Bodega") {
            return <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">Completado</Badge>;
        }

        const fechaOdd = parseISO(compra.fecha_odd);
        const deadline = addDays(fechaOdd, compra.plazo_de_entrega);
        const today = new Date();
        const daysDiff = differenceInCalendarDays(today, deadline);

        // daysDiff > 0 means today is AFTER deadline (Delayed)
        // daysDiff <= 0 means today is BEFORE or ON deadline (On Time)

        if (daysDiff > 0) {
            return (
                <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Atrasado ({daysDiff} {daysDiff === 1 ? 'día' : 'días'})</span>
                </Badge>
            );
        } else {
            const remainingDays = Math.abs(daysDiff);
            return (
                <Badge variant="outline" className="flex items-center gap-1 w-fit border-green-500 text-green-600 bg-green-50">
                    <Clock className="h-3 w-3" />
                    <span>A tiempo ({remainingDays} {remainingDays === 1 ? 'día' : 'días'} restantes)</span>
                </Badge>
            );
        }
    };

    const updateFilter = (key: string, value: any) => {
        onFiltersChange({
            ...filters,
            [key]: value || undefined,
        });
    };

    const clearAllFilters = () => {
        onFiltersChange({
            unidad_requirente_filter: "",
            numero_ordinario: undefined,
            descripcion_filter: "",
            odd_filter: "",
            estado_filter: undefined,
            fecha_odd_from: "",
            fecha_odd_to: "",
            valor_min: undefined,
            valor_max: undefined,
        });
    };

    const hasActiveFilters = Object.values(filters).some((v) => v !== undefined && v !== "");

    return (
        <>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Button
                        variant={showFilters ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        {showFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
                    </Button>
                    {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                            <X className="mr-2 h-4 w-4" />
                            Limpiar Filtros
                        </Button>
                    )}
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Unidad Requirente</TableHead>
                                <TableHead>N° Ordinario</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>ODD</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Fecha ODD</TableHead>
                                <TableHead>Plazo Entrega</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                            {showFilters && (
                                <TableRow className="bg-muted/50">
                                    <TableHead className="py-2">
                                        <Input
                                            placeholder="Filtrar..."
                                            value={filters.unidad_requirente_filter || ""}
                                            onChange={(e) => updateFilter("unidad_requirente_filter", e.target.value)}
                                            className="h-8 w-full"
                                        />
                                    </TableHead>
                                    <TableHead className="py-2">
                                        <Input
                                            type="number"
                                            placeholder="Filtrar..."
                                            value={filters.numero_ordinario || ""}
                                            onChange={(e) =>
                                                updateFilter("numero_ordinario", e.target.value ? Number(e.target.value) : undefined)
                                            }
                                            className="h-8 w-full"
                                        />
                                    </TableHead>
                                    <TableHead className="py-2">
                                        <div className="flex gap-1">
                                            <Input
                                                type="number"
                                                placeholder="Mín"
                                                value={filters.valor_min || ""}
                                                onChange={(e) =>
                                                    updateFilter("valor_min", e.target.value ? Number(e.target.value) : undefined)
                                                }
                                                className="h-8 w-20"
                                            />
                                            <Input
                                                type="number"
                                                placeholder="Máx"
                                                value={filters.valor_max || ""}
                                                onChange={(e) =>
                                                    updateFilter("valor_max", e.target.value ? Number(e.target.value) : undefined)
                                                }
                                                className="h-8 w-20"
                                            />
                                        </div>
                                    </TableHead>
                                    <TableHead className="py-2">
                                        <Input
                                            placeholder="Filtrar..."
                                            value={filters.odd_filter || ""}
                                            onChange={(e) => updateFilter("odd_filter", e.target.value)}
                                            className="h-8 w-full"
                                        />
                                    </TableHead>
                                    <TableHead className="py-2">
                                        <Select
                                            value={filters.estado_filter || undefined}
                                            onValueChange={(value) => updateFilter("estado_filter", value)}
                                        >
                                            <SelectTrigger className="h-8 w-full">
                                                <SelectValue placeholder="Todos" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ESTADOS_COMPRA.map((estado) => (
                                                    <SelectItem key={estado} value={estado}>
                                                        {estado}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </TableHead>
                                    <TableHead className="py-2">
                                        <div className="flex gap-1">
                                            <Input
                                                type="date"
                                                value={filters.fecha_odd_from || ""}
                                                onChange={(e) => updateFilter("fecha_odd_from", e.target.value)}
                                                className="h-8 w-32"
                                                placeholder="Desde"
                                            />
                                            <Input
                                                type="date"
                                                value={filters.fecha_odd_to || ""}
                                                onChange={(e) => updateFilter("fecha_odd_to", e.target.value)}
                                                className="h-8 w-32"
                                                placeholder="Hasta"
                                            />
                                        </div>
                                    </TableHead>
                                    <TableHead className="py-2"></TableHead>
                                    <TableHead className="py-2"></TableHead>
                                </TableRow>
                            )}
                        </TableHeader>
                        <TableBody>
                            {compras.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                        No se encontraron compras
                                    </TableCell>
                                </TableRow>
                            ) : (
                                compras.map((compra) => (
                                    <TableRow key={compra.id}>
                                        <TableCell>
                                            {compra.expand?.unidad_requirente?.nombre || "-"}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                {compra.numero_ordinario}
                                                {compra.adjunta_ordinario && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-20"
                                                        title="Ver Ordinario"
                                                        onClick={() => {
                                                            const url = getCompraFileUrl(compra, "adjunta_ordinario");
                                                            if (url) window.open(url, "_blank");
                                                        }}
                                                    > <span className="sr-only">Ver Ordinario</span>
                                                        <FileText className="h-4 w-4 text-blue-500" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {new Intl.NumberFormat('es-CL', {
                                                style: 'currency',
                                                currency: 'CLP'
                                            }).format(compra.valor)}
                                        </TableCell>
                                        <TableCell>{compra.odd}</TableCell>
                                        <TableCell>
                                            <Badge variant={getEstadoBadgeVariant(compra.estado)}>
                                                {compra.estado}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {compra.fecha_odd ? format(parseISO(compra.fecha_odd), "dd/MM/yyyy") : "-"}
                                        </TableCell>
                                        <TableCell>
                                            <RenderDeliveryStatus compra={compra} />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setViewingCompra(compra)}
                                                    title="Ver Ficha"
                                                >
                                                    <Eye className="h-4 w-4 text-blue-600" />
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Abrir menú</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                        {currentUser && canEditCompra(currentUser.role, compra) && (
                                                            <DropdownMenuItem onClick={() => setEditingCompra(compra)}>
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                Editar
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem onClick={() => setViewingCompra(compra)}>
                                                            <Printer className="mr-2 h-4 w-4" />
                                                            Ver Ficha
                                                        </DropdownMenuItem>
                                                        {compra.adjunta_odd && (
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    const url = getCompraFileUrl(compra, "adjunta_odd");
                                                                    if (url) window.open(url, "_blank");
                                                                }}
                                                            >
                                                                <FileText className="mr-2 h-4 w-4" />
                                                                Ver Adjunto ODD
                                                            </DropdownMenuItem>
                                                        )}
                                                        {currentUser && canDeleteCompra(currentUser.role) && (
                                                            <DropdownMenuItem
                                                                onClick={() => setDeletingCompra(compra)}
                                                                className="text-destructive"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Eliminar
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {editingCompra && (
                <CompraDialog
                    compra={editingCompra}
                    open={!!editingCompra}
                    onOpenChange={(open) => !open && setEditingCompra(null)}
                    onSuccess={() => {
                        setEditingCompra(null);
                        onCompraUpdated();
                    }}
                    currentUser={currentUser}
                />
            )}

            {deletingCompra && (
                <DeleteCompraDialog
                    compra={deletingCompra}
                    open={!!deletingCompra}
                    onOpenChange={(open) => !open && setDeletingCompra(null)}
                    onSuccess={() => {
                        setDeletingCompra(null);
                        onCompraUpdated();
                    }}
                />
            )}

            {viewingCompra && (
                <Dialog open={!!viewingCompra} onOpenChange={(open) => !open && setViewingCompra(null)}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:overflow-visible print:border-0 print:shadow-none print:bg-white print:static print:transform-none">
                        <DialogTitle className="sr-only">Ficha de Compra</DialogTitle>

                        <CompraSheet compra={viewingCompra} />
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}
