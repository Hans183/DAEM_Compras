"use client";

import { useState, useEffect } from "react";
import { MoreHorizontal, Pencil, Trash2, FileText, X, Printer, AlertTriangle, CheckCircle, Clock, Eye, Ban } from "lucide-react";
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
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
import { getUserAvatarUrl, getUsers } from "@/services/users.service";
import { getOrdenCompraFileUrl } from "@/services/ordenes-compra.service";
import { canEditCompra, canDeleteCompra, canCancelCompra } from "@/utils/permissions";

import { DeleteCompraDialog } from "./delete-compra-dialog";
import { CompraDialog } from "./compra-dialog";
import { CancelCompraDialog } from "./cancel-compra-dialog";

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
    const [cancelingCompra, setCancelingCompra] = useState<Compra | null>(null);
    const [duplicatingCompra, setDuplicatingCompra] = useState<Compra | null>(null);
    const [viewingCompra, setViewingCompra] = useState<Compra | null>(null);
    const [showFilters, setShowFilters] = useState<boolean>(false);
    const [buyers, setBuyers] = useState<User[]>([]);

    useEffect(() => {
        const fetchBuyers = async () => {
            try {
                // Fetch all users to filter by role in UI or just fetch generic
                // Assuming we want to show all possible buyers
                const result = await getUsers({ perPage: 100 });
                setBuyers(result.items.filter(u => u.role.includes("Comprador")));
            } catch (error) {
                console.error("Error fetching buyers:", error);
            }
        };
        fetchBuyers();
    }, []);

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
            comprador_filter: "",
            estado_filter: undefined,
            created_from: "",
            created_to: "",
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
                                <TableHead className="w-[140px]">Fecha</TableHead>
                                <TableHead>N° Ord.</TableHead>
                                <TableHead>Requirente</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>OC</TableHead>
                                <TableHead className="w-[50px]">Comp.</TableHead>
                                <TableHead>Plazo Entrega</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                            {showFilters && (
                                <TableRow className="bg-muted/50">
                                    <TableHead className="py-2">
                                        <div className="flex gap-1">
                                            <Input
                                                type="date"
                                                value={filters.created_from || ""}
                                                onChange={(e) => updateFilter("created_from", e.target.value)}
                                                className="h-8 w-[130px] text-xs px-2"
                                                placeholder="Desde"
                                            />
                                        </div>
                                        <div className="flex gap-1 mt-1">
                                            <Input
                                                type="date"
                                                value={filters.created_to || ""}
                                                onChange={(e) => updateFilter("created_to", e.target.value)}
                                                className="h-8 w-[130px] text-xs px-2"
                                                placeholder="Hasta"
                                            />
                                        </div>
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
                                        <Input
                                            placeholder="Filtrar..."
                                            value={filters.unidad_requirente_filter || ""}
                                            onChange={(e) => updateFilter("unidad_requirente_filter", e.target.value)}
                                            className="h-8 w-full"
                                        />
                                    </TableHead>
                                    <TableHead className="py-2">
                                        <Input
                                            placeholder="Filtrar..."
                                            value={filters.descripcion_filter || ""}
                                            onChange={(e) => updateFilter("descripcion_filter", e.target.value)}
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

                                    <TableHead className="py-2"></TableHead>
                                    <TableHead className="py-2">
                                        <Select
                                            value={filters.comprador_filter || undefined}
                                            onValueChange={(value) => updateFilter("comprador_filter", value === "all" ? undefined : value)}
                                        >
                                            <SelectTrigger className="h-8 w-full p-1">
                                                <SelectValue placeholder="" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos</SelectItem>
                                                {buyers.map((buyer) => (
                                                    <SelectItem key={buyer.id} value={buyer.id}>
                                                        {buyer.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
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
                                            {format(parseISO(compra.created), "dd/MM/yyyy")}
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
                                        <TableCell>
                                            {compra.expand?.unidad_requirente?.nombre || "-"}
                                        </TableCell>
                                        <TableCell>
                                            <div className="max-w-[200px] truncate" title={compra.descripcion}>
                                                {compra.descripcion}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getEstadoBadgeVariant(compra.estado)}>
                                                {compra.estado}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                {compra.expand?.["ordenes_compra(compra)"]?.map((oc) => (
                                                    <div key={oc.id} className="flex items-center gap-1">
                                                        <span className="text-xs">{oc.oc}</span>
                                                        {oc.oc_adjunto && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-5 w-5"
                                                                title={`Ver Adjunto OC ${oc.oc}`}
                                                                onClick={() => {
                                                                    const url = getOrdenCompraFileUrl(oc, oc.oc_adjunto!);
                                                                    if (url) window.open(url, "_blank");
                                                                }}
                                                            >
                                                                <FileText className="h-3 w-3 text-blue-500" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                ))}
                                                {(!compra.expand?.["ordenes_compra(compra)"] || compra.expand["ordenes_compra(compra)"].length === 0) && (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {compra.expand?.comprador ? (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Avatar className="h-8 w-8 cursor-help">
                                                                <AvatarImage
                                                                    src={getUserAvatarUrl(compra.expand.comprador)}
                                                                    alt={compra.expand.comprador.name}
                                                                />
                                                                <AvatarFallback>
                                                                    {compra.expand.comprador.name
                                                                        .split(" ")
                                                                        .map((n) => n[0])
                                                                        .join("")
                                                                        .substring(0, 2)
                                                                        .toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{compra.expand.comprador.name}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {compra.plazo_de_entrega ? `${compra.plazo_de_entrega} días` : "-"}
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
                                                        {currentUser && currentUser.role.includes("Encargado compras") && (
                                                            <DropdownMenuItem onClick={() => setDuplicatingCompra(compra)}>
                                                                <FileText className="mr-2 h-4 w-4" />
                                                                Duplicar
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem onClick={() => setViewingCompra(compra)}>
                                                            <Printer className="mr-2 h-4 w-4" />
                                                            Ver Ficha
                                                        </DropdownMenuItem>
                                                        {currentUser && canDeleteCompra(currentUser.role) && (
                                                            <DropdownMenuItem
                                                                onClick={() => setDeletingCompra(compra)}
                                                                className="text-destructive"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Eliminar
                                                            </DropdownMenuItem>
                                                        )}
                                                        {currentUser && canCancelCompra(currentUser.role) && compra.estado !== "Anulado" && (
                                                            <DropdownMenuItem
                                                                onClick={() => setCancelingCompra(compra)}
                                                                className="text-orange-600"
                                                            >
                                                                <Ban className="mr-2 h-4 w-4" />
                                                                Anular
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

            {cancelingCompra && (
                <CancelCompraDialog
                    compra={cancelingCompra}
                    open={!!cancelingCompra}
                    onOpenChange={(open) => !open && setCancelingCompra(null)}
                    onSuccess={() => {
                        setCancelingCompra(null);
                        onCompraUpdated();
                    }}
                    currentUser={currentUser}
                />
            )}

            {duplicatingCompra && (
                <CompraDialog
                    initialData={duplicatingCompra}
                    isDuplicate={true}
                    open={!!duplicatingCompra}
                    onOpenChange={(open) => !open && setDuplicatingCompra(null)}
                    onSuccess={() => {
                        setDuplicatingCompra(null);
                        onCompraUpdated();
                    }}
                    currentUser={currentUser}
                />
            )}

            {viewingCompra && (
                <Dialog open={!!viewingCompra} onOpenChange={(open) => !open && setViewingCompra(null)}>
                    <DialogContent aria-describedby="ficha-compra-desc" className="max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:overflow-visible print:border-0 print:shadow-none print:bg-white print:static print:transform-none">
                        <DialogTitle className="sr-only">Ficha de Compra</DialogTitle>
                        <DialogDescription id="ficha-compra-desc" className="sr-only">
                            Detalles completos de la solicitud de compra
                        </DialogDescription>

                        <CompraSheet compra={viewingCompra} />
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}
