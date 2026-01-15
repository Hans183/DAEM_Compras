"use client";

import { useState, useEffect } from "react";
import { MoreHorizontal, Pencil, Trash2, FileText, X, Printer, AlertTriangle, CheckCircle, Clock, Eye, Ban } from "lucide-react";
import { addDays, differenceInCalendarDays, format, parseISO, isPast, isToday } from "date-fns";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
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

import { getHolidays, type Holiday } from "@/services/holidays.service";
import { calculateBusinessDate } from "@/utils/date-utils";

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

// Debounced input component to prevent UI jitter
function DebouncedInput({
    value: initialValue,
    onChange,
    debounce = 500,
    ...props
}: {
    value: string | number;
    onChange: (value: string | number) => void;
    debounce?: number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">) {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            onChange(value);
        }, debounce);

        return () => clearTimeout(timeout);
    }, [value, debounce]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <Input
            {...props}
            value={value}
            onChange={(e) => setValue(e.target.value)}
        />
    );
}

export function ComprasTable({ compras, onCompraUpdated, filters, onFiltersChange, currentUser }: ComprasTableProps) {
    const [editingCompra, setEditingCompra] = useState<Compra | null>(null);
    const [deletingCompra, setDeletingCompra] = useState<Compra | null>(null);
    const [cancelingCompra, setCancelingCompra] = useState<Compra | null>(null);
    const [duplicatingCompra, setDuplicatingCompra] = useState<Compra | null>(null);
    const [viewingCompra, setViewingCompra] = useState<Compra | null>(null);
    const [buyers, setBuyers] = useState<User[]>([]);
    const [holidays, setHolidays] = useState<Holiday[]>([]);

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

        const fetchHolidays = async () => {
            const currentYear = new Date().getFullYear();
            const data = await getHolidays(currentYear);
            setHolidays(data);
        };
        fetchHolidays();
    }, []);

    const getEstadoColor = (estado: string) => {
        switch (estado) {
            case "Anulado":
            case "Devuelto":
                return "bg-red-100 text-red-800 border-red-200 hover:bg-red-100";
            case "En Proceso":
            case "Asignado":
                return "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100";
            case "Comprado":
            case "En Bodega":
            case "Entregado":
                return "bg-green-100 text-green-800 border-green-200 hover:bg-green-100";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100";
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
                <div className="flex items-center justify-end">
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
                            <TableRow className="bg-muted hover:bg-muted/80">
                                <TableHead className="!w-[20px] align-middle">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        id="date"
                                                        variant={"outline"}
                                                        size="sm"
                                                        className={cn(
                                                            "w-full h-8 justify-start text-left font-normal px-2 text-xs",
                                                            !filters.created_from && !filters.created_to && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-3 w-3" />
                                                        {filters.created_from ? (
                                                            filters.created_to ? (
                                                                <>
                                                                    {format(parseISO(filters.created_from), "dd/MM/yy")} -{" "}
                                                                    {format(parseISO(filters.created_to), "dd/MM/yy")}
                                                                </>
                                                            ) : (
                                                                format(parseISO(filters.created_from), "dd/MM/yy")
                                                            )
                                                        ) : (
                                                            <span className="font-bold text-foreground text-base">Fecha</span>
                                                        )}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="center">
                                                    <Calendar
                                                        initialFocus
                                                        mode="range"
                                                        defaultMonth={filters.created_from ? parseISO(filters.created_from) : new Date()}
                                                        selected={{
                                                            from: filters.created_from ? parseISO(filters.created_from) : undefined,
                                                            to: filters.created_to ? parseISO(filters.created_to) : undefined,
                                                        }}
                                                        onSelect={(range) => {
                                                            if (range?.from) {
                                                                updateFilter("fecha_inicio_from", format(range.from, "yyyy-MM-dd"));
                                                            } else {
                                                                updateFilter("fecha_inicio_from", undefined);
                                                            }
                                                            if (range?.to) {
                                                                updateFilter("fecha_inicio_to", format(range.to, "yyyy-MM-dd"));
                                                            } else {
                                                                updateFilter("fecha_inicio_to", undefined);
                                                            }
                                                        }}
                                                        numberOfMonths={2}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>
                                </TableHead>
                                <TableHead className="align-middle">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-foreground text-base whitespace-nowrap">Orden</span>
                                    </div>
                                </TableHead>
                                <TableHead className="align-middle">
                                    <div className="flex items-center gap-2">
                                        <DebouncedInput
                                            placeholder="Unidad requirente"
                                            value={filters.unidad_requirente_filter || ""}
                                            onChange={(value) => updateFilter("unidad_requirente_filter", value)}
                                            className="h-8 w-full font-bold text-foreground text-base"
                                        />
                                    </div>
                                </TableHead>
                                <TableHead className="align-middle">
                                    <div className="flex items-center gap-2 font-bold text-foreground text-base">
                                        <DebouncedInput
                                            placeholder="Descripción"
                                            value={filters.descripcion_filter || ""}
                                            onChange={(value) => updateFilter("descripcion_filter", value)}
                                            className="h-8 w-full"
                                        />
                                    </div>
                                </TableHead>
                                <TableHead className="align-middle">
                                    <div className="flex items-center gap-2">
                                        <Select
                                            value={filters.estado_filter || undefined}
                                            onValueChange={(value) => updateFilter("estado_filter", value)}
                                        >
                                            <SelectTrigger className="h-8 w-full font-bold text-foreground text-base">
                                                <SelectValue placeholder="Estado" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ESTADOS_COMPRA.map((estado) => (
                                                    <SelectItem key={estado} value={estado}>
                                                        {estado}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </TableHead>
                                <TableHead className="align-middle w-[150px]">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-foreground text-base">Órdenes de Compra</span>
                                    </div>
                                </TableHead>
                                <TableHead className="w-[120px] align-middle">
                                    <div className="flex items-center gap-2">
                                        <Select
                                            value={filters.comprador_filter || undefined}
                                            onValueChange={(value) => updateFilter("comprador_filter", value === "all" ? undefined : value)}
                                        >
                                            <SelectTrigger className="h-8 w-full p-1 font-bold text-foreground text-base">
                                                <SelectValue placeholder="Comprador" />
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
                                    </div>
                                </TableHead>

                                <TableHead className="w-12 align-top"></TableHead>
                            </TableRow>
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
                                            {compra.fecha_inicio ? compra.fecha_inicio.substring(0, 10).split('-').reverse().join('/') : "-"}
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
                                            <div className="flex justify-center">
                                                <Badge variant="outline" className={cn(getEstadoColor(compra.estado))}>
                                                    {compra.estado}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-2">
                                                {(!compra.expand?.["ordenes_compra(compra)"] || compra.expand["ordenes_compra(compra)"].length === 0) ? (
                                                    <span className="text-muted-foreground">-</span>
                                                ) : (
                                                    compra.expand["ordenes_compra(compra)"].map((oc) => {
                                                        let statusElement = null;
                                                        if (oc.oc_fecha && oc.plazo_entrega) {
                                                            const fechaStr = oc.oc_fecha.substring(0, 10);
                                                            const fechaBase = parseISO(fechaStr);
                                                            const fechaEntrega = calculateBusinessDate(fechaBase, oc.plazo_entrega, holidays);
                                                            const isDelayed = isPast(fechaEntrega) && !isToday(fechaEntrega);

                                                            statusElement = (
                                                                <div className="flex flex-col items-end leading-tight min-w-[80px]">
                                                                    <span className={cn("text-[10px] font-bold uppercase", isDelayed ? "text-red-500" : "text-green-600")}>
                                                                        {isDelayed ? "Retrasado" : "A tiempo"}
                                                                    </span>
                                                                    <span className="text-[10px] text-muted-foreground">
                                                                        {format(fechaEntrega, "dd/MM")}
                                                                    </span>
                                                                </div>
                                                            );
                                                        }

                                                        return (
                                                            <div key={oc.id} className="flex items-center justify-between gap-2 p-1 rounded hover:bg-muted/50 border border-transparent hover:border-border transition-colors group w-full">
                                                                <div className="flex items-center gap-1 min-w-[80px]">
                                                                    <span className="text-xs font-medium group-hover:underline decoration-dotted underline-offset-2">{oc.oc}</span>
                                                                    {oc.oc_adjunto && (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-5 w-5 opacity-50 group-hover:opacity-100 transition-opacity"
                                                                            title={`Ver Adjunto OC ${oc.oc}`}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                const url = getOrdenCompraFileUrl(oc, oc.oc_adjunto!);
                                                                                if (url) window.open(url, "_blank");
                                                                            }}
                                                                        >
                                                                            <FileText className="h-3 w-3 text-blue-500" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                                {statusElement}
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </TableCell>

                                        <TableCell>
                                            <div className="flex justify-center">
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
                                            </div>
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
                    </Table >
                </div >
            </div >

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
            )
            }

            {
                deletingCompra && (
                    <DeleteCompraDialog
                        compra={deletingCompra}
                        open={!!deletingCompra}
                        onOpenChange={(open) => !open && setDeletingCompra(null)}
                        onSuccess={() => {
                            setDeletingCompra(null);
                            onCompraUpdated();
                        }}
                    />
                )
            }

            {
                cancelingCompra && (
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
                )
            }

            {
                duplicatingCompra && (
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
                )
            }

            {
                viewingCompra && (
                    <Dialog open={!!viewingCompra} onOpenChange={(open) => !open && setViewingCompra(null)}>
                        <DialogContent aria-describedby="ficha-compra-desc" className="!max-w-[60vw] !w-[60vw] max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:overflow-visible print:border-0 print:shadow-none print:bg-white print:static print:transform-none">
                            <DialogTitle className="sr-only">Ficha de Compra</DialogTitle>
                            <DialogDescription id="ficha-compra-desc" className="sr-only">
                                Detalles completos de la solicitud de compra
                            </DialogDescription>

                            <CompraSheet compra={viewingCompra} />
                        </DialogContent>
                    </Dialog>
                )
            }
        </>
    );
}
