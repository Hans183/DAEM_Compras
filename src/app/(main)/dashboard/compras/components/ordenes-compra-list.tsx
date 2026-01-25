"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Trash2, Plus, ExternalLink, Pencil, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { toast } from "sonner";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    // Dialog imports removed as they were unused
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import type { OrdenCompra } from "@/types/orden-compra";
import { createOrdenCompra, deleteOrdenCompra, getOrdenesByCompra, getOrdenCompraFileUrl, updateOrdenCompra } from "@/services/ordenes-compra.service";
import { getHolidays, type Holiday } from "@/services/holidays.service";
import { parseToLocalDate } from "@/utils/date-utils";



const ordenCompraSchema = z.object({
    oc: z.string().min(1, "El número de OC es requerido"),
    oc_fecha: z.string().min(1, "La fecha es requerida"),
    oc_valor: z.number().min(0, "El valor debe ser positivo"),
    plazo_entrega: z.date({
        required_error: "La fecha de entrega es requerida",
    }),

    oc_adjunto: z.instanceof(File).optional(),
});

type OrdenCompraFormValues = z.infer<typeof ordenCompraSchema>;

interface OrdenesCompraListProps {
    compraId: string;
    onUpdate: () => void;
    canEdit: boolean;
}

export function OrdenesCompraList({ compraId, onUpdate, canEdit }: OrdenesCompraListProps) {
    const [ordenes, setOrdenes] = useState<OrdenCompra[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [holidays, setHolidays] = useState<Holiday[]>([]);

    const [editingOc, setEditingOc] = useState<OrdenCompra | null>(null);

    const form = useForm<OrdenCompraFormValues>({
        // ... existing config
        resolver: zodResolver(ordenCompraSchema),
        defaultValues: {
            oc: "",
            oc_fecha: new Date().toISOString().split("T")[0],
            oc_valor: 0,
            plazo_entrega: undefined,
        },
    });

    // Watch values for live calculation in form
    const watchFecha = form.watch("oc_fecha");


    const loadOrdenes = async () => {
        try {
            const result = await getOrdenesByCompra(compraId);
            setOrdenes(result.items);
        } catch (error) {
            console.error("Error loading OCs:", error);
            toast.error("Error al cargar órdenes de compra");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const fetchHolidays = async () => {
            const currentYear = new Date().getFullYear();
            const data = await getHolidays(currentYear);
            setHolidays(data);
        };
        fetchHolidays();
    }, []);

    useEffect(() => {
        if (compraId) {
            loadOrdenes();
        }
    }, [compraId]);



    // ... existing functions (onSubmit, handleEditClick, handleCancelEdit, handleDelete) ...

    const onSubmit = async (data: OrdenCompraFormValues) => {
        setIsCreating(true);
        try {
            if (editingOc) {
                await updateOrdenCompra(editingOc.id, {
                    ...data,
                    oc_fecha: data.oc_fecha,
                    plazo_entrega: format(data.plazo_entrega, "yyyy-MM-dd"),
                });
                toast.success("Orden de compra actualizada");
                setEditingOc(null);
            } else {
                await createOrdenCompra({
                    compra: compraId,
                    ...data,
                    oc_fecha: data.oc_fecha,
                    plazo_entrega: format(data.plazo_entrega, "yyyy-MM-dd"),
                });

                toast.success("Orden de compra agregada");
            }

            form.reset({
                oc: "",
                oc_fecha: new Date().toISOString().split("T")[0],
                oc_valor: 0,
                plazo_entrega: undefined,
            });
            await loadOrdenes();
            onUpdate();
        } catch (error) {
            console.error(editingOc ? "Error updating OC:" : "Error creating OC:", error);
            toast.error(editingOc ? "Error al actualizar orden de compra" : "Error al crear orden de compra");
        } finally {
            setIsCreating(false);
        }
    };

    const handleEditClick = (oc: OrdenCompra) => {
        setEditingOc(oc);
        let formattedDate = "";
        try {
            // Handle both ISO string with T or space
            if (oc.oc_fecha) {
                const dateObj = parseToLocalDate(oc.oc_fecha);
                if (dateObj && !isNaN(dateObj.getTime())) {
                    formattedDate = format(dateObj, "yyyy-MM-dd");

                } else {
                    formattedDate = new Date().toISOString().split("T")[0];;
                }
            }
        } catch (e) {
            formattedDate = new Date().toISOString().split("T")[0];
        }

        form.reset({
            oc: oc.oc,
            oc_fecha: formattedDate,
            oc_valor: oc.oc_valor,
            plazo_entrega: parseToLocalDate(oc.plazo_entrega),

        });
    };


    const handleCancelEdit = () => {
        setEditingOc(null);
        form.reset({
            oc: "",
            oc_fecha: new Date().toISOString().split("T")[0],
            oc_valor: 0,
            plazo_entrega: undefined,
        });
    };

    const handleDelete = async (id: string) => {
        setIsDeleting(id);
        try {
            await deleteOrdenCompra(id);
            toast.success("Orden de compra eliminada");
            await loadOrdenes();
            onUpdate();
        } catch (error) {
            console.error("Error deleting OC:", error);
            toast.error("Error al eliminar orden de compra");
        } finally {
            setIsDeleting(null);
        }
    };

    const totalValor = ordenes.reduce((sum, item) => sum + item.oc_valor, 0);

    if (isLoading) {
        return <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium">Órdenes de Compra Asociadas</h4>
                <Badge variant="outline" className="text-xs">
                    Total: $ {new Intl.NumberFormat("es-CL").format(totalValor)}
                </Badge>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>N° OC</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Fecha Entrega</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead className="w-[80px]">Adjunto</TableHead>
                            {canEdit && <TableHead className="w-[100px]"></TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {ordenes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={canEdit ? 6 : 5} className="text-center text-muted-foreground text-sm h-20">
                                    No hay órdenes de compra registradas.
                                </TableCell>
                            </TableRow>
                        ) : (
                            ordenes.map((oc) => (
                                <TableRow key={oc.id} className={editingOc?.id === oc.id ? "bg-muted/50" : ""}>
                                    <TableCell className="font-medium">{oc.oc}</TableCell>
                                    <TableCell>{oc.oc_fecha ? format(parseToLocalDate(oc.oc_fecha) || new Date(), "dd/MM/yyyy") : "-"}</TableCell>
                                    <TableCell>
                                        {oc.plazo_entrega ? format(parseToLocalDate(oc.plazo_entrega) || new Date(), "dd/MM/yyyy") : "-"}
                                    </TableCell>

                                    <TableCell>$ {new Intl.NumberFormat("es-CL").format(oc.oc_valor)}</TableCell>
                                    <TableCell>
                                        {oc.oc_adjunto ? (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => window.open(getOrdenCompraFileUrl(oc, oc.oc_adjunto!)!, "_blank")}
                                                title="Ver Adjunto"
                                            >
                                                <ExternalLink className="h-4 w-4 text-blue-500" />
                                            </Button>
                                        ) : (
                                            <span className="text-muted-foreground text-xs text-center block">-</span>
                                        )}
                                    </TableCell>
                                    {canEdit && (
                                        <TableCell className="text-right">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEditClick(oc)}
                                                className="mr-1"
                                                title="Editar"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                disabled={isDeleting === oc.id}
                                                onClick={() => handleDelete(oc.id)}
                                                title="Eliminar"
                                            >
                                                {isDeleting === oc.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {canEdit && (
                <div className="bg-muted/30 p-4 rounded-md border">
                    <div className="flex justify-between items-center mb-3">
                        <h5 className="text-xs font-semibold uppercase text-muted-foreground">
                            {editingOc ? "Editar Orden de Compra" : "Agregar Nueva OC"}
                        </h5>
                        {editingOc && (
                            <Button type="button" variant="ghost" size="sm" onClick={handleCancelEdit} className="h-6 text-xs text-muted-foreground hover:text-foreground">
                                Cancelar Edición
                            </Button>
                        )}
                    </div>
                    <Form {...form}>
                        <div className="flex gap-4 items-end">
                            <div className="grid grid-cols-12 gap-2 w-full">
                                <div className="col-span-3">
                                    <FormField
                                        control={form.control}
                                        name="oc"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">N° OC</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="OC-123"
                                                        className="h-8 text-xs"
                                                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="col-span-3">
                                    <FormField
                                        control={form.control}
                                        name="oc_fecha"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">Fecha</FormLabel>
                                                <FormControl>
                                                    <Input {...field} type="date" className="h-8 text-xs" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <FormField
                                        control={form.control}
                                        name="plazo_entrega"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel className="text-xs">Fecha Entrega (Días Hábiles)</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "h-8 text-xs w-full pl-3 text-left font-normal",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value ? (
                                                                    format(field.value, "dd/MM/yyyy")
                                                                ) : (
                                                                    <span>Seleccionar fecha</span>
                                                                )}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={field.onChange}
                                                            disabled={(date) => {
                                                                // Disable weekends (Sunday=0, Saturday=6)
                                                                if (date.getDay() === 0 || date.getDay() === 6) return true;
                                                                // Disable holidays
                                                                const dateStr = format(date, "yyyy-MM-dd");
                                                                return holidays.some(h => h.date === dateStr);
                                                            }}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <FormField
                                        control={form.control}
                                        name="oc_valor"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">Valor</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="text"
                                                        className="h-8 text-xs"
                                                        placeholder="0"
                                                        {...field}
                                                        value={field.value ? new Intl.NumberFormat("es-CL").format(field.value) : ""}
                                                        onChange={(e) => {
                                                            const rawValue = e.target.value.replace(/\./g, "");
                                                            if (rawValue === "" || /^\d+$/.test(rawValue)) {
                                                                field.onChange(rawValue === "" ? 0 : Number(rawValue));
                                                            }
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <FormField
                                        control={form.control}
                                        name="oc_adjunto"
                                        render={({ field: { value, onChange, ...field } }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">
                                                    {editingOc && editingOc.oc_adjunto ? "Cambiar Adjunto" : "Adjunto"}
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        type="file"
                                                        accept=".pdf,.jpg,.png"
                                                        className="h-8 text-xs"
                                                        onChange={(e) => onChange(e.target.files?.[0])}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                disabled={isCreating}
                                className="h-8 mb-0.5"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    form.handleSubmit(onSubmit)(e);
                                }}
                            >
                                {isCreating ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : editingOc ? (
                                    <Pencil className="h-4 w-4" />
                                ) : (
                                    <Plus className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </Form>
                </div>
            )}
        </div>
    );
}
