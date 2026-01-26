import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus, Trash2, Upload, FileText, X, ClipboardPaste } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

import { createRecepcion, updateRecepcion } from "@/services/recepciones.service";
import type { User } from "@/types/user";
import type { Compra } from "@/types/compra";
import type { Recepcion } from "@/types/recepcion";

const recepcionSchema = z.object({
    fecha_recepcion: z.string().min(1, "La fecha es requerida"),
    documento_tipo: z.enum(["Guía de Despacho", "Factura", "Boleta", "Otro"], {
        required_error: "Seleccione un tipo de documento",
    }),
    documento_numero: z.string().optional(),
    observaciones: z.string().optional(),
    detalles: z.array(z.object({
        cantidad: z.number().min(0.01, "La cantidad debe ser mayor a 0"),
        detalle: z.string().min(1, "El detalle es requerido"),
    })).min(1, "Debe agregar al menos un detalle"),
    orden_compra: z.string().optional(),
    adjuntos: z.any().optional(), // FileList
});


type RecepcionFormValues = z.infer<typeof recepcionSchema>;

interface RecepcionDialogProps {
    compra: Compra;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    currentUser: User | null;
    initialData?: Recepcion;
}

export function RecepcionDialog({ compra, open, onOpenChange, onSuccess, currentUser, initialData }: RecepcionDialogProps) {
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<RecepcionFormValues>({
        resolver: zodResolver(recepcionSchema),
        defaultValues: {
            fecha_recepcion: new Date().toISOString().split("T")[0],
            orden_compra: "",
            documento_tipo: "Guía de Despacho",

            documento_numero: "",
            observaciones: "",
            detalles: [{ cantidad: 1, detalle: "" }],
        },
    });

    useEffect(() => {
        if (initialData && open) {
            // Populate form with initial data
            form.reset({
                fecha_recepcion: initialData.fecha_recepcion ? format(parseISO(initialData.fecha_recepcion), "yyyy-MM-dd") : new Date().toISOString().split("T")[0],
                orden_compra: initialData.orden_compra || "",
                documento_tipo: initialData.documento_tipo,
                documento_numero: initialData.documento_numero || "",
                observaciones: initialData.observaciones || "",
                detalles: initialData.expand?.["recepcion_detalles(recepcion)"]?.map(d => ({
                    cantidad: d.cantidad,
                    detalle: d.detalle
                })) || [{ cantidad: 1, detalle: "" }],
            });
        } else if (!initialData && open) {
            form.reset({
                fecha_recepcion: new Date().toISOString().split("T")[0],
                orden_compra: "",
                documento_tipo: "Guía de Despacho",
                documento_numero: "",
                observaciones: "",
                detalles: [{ cantidad: 1, detalle: "" }],
            });
        }
    }, [initialData, open, form]);


    const { fields, append, remove, replace } = useFieldArray({
        control: form.control,
        name: "detalles",
    });

    const handlePasteFromClipboard = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (!text) {
                toast.error("El portapapeles está vacío");
                return;
            }

            const rows = text.split(/\r?\n/).filter(row => row.trim() !== "");
            const limitedRows = rows.slice(0, 15);

            if (limitedRows.length === 0) {
                toast.error("No hay datos válidos para pegar");
                return;
            }

            const newDetalles = limitedRows.map(row => {
                // Try to split by tab
                let cols = row.split("\t");
                // If only 1 column, try splitting by comma, semicolon
                if (cols.length < 2) {
                    // Simple heuristic: if tab didn't work, maybe it's just one line or csv? 
                    // stick to tab as it's standard from Excel
                }

                let cantidad = 1;
                let detalle = "";

                if (cols.length >= 2) {
                    // Start with simple cleanup for number check
                    // Allow 1,5 or 1.5 or 1000
                    const isNumber = (str: string) => /^\d+([.,]\d+)?$/.test(str.trim());

                    const col0 = cols[0].trim();
                    const col1 = cols[1].trim();

                    const col0IsNum = isNumber(col0);
                    const col1IsNum = isNumber(col1);

                    if (col0IsNum && !col1IsNum) {
                        // Standard: Qty | Desc
                        cantidad = parseFloat(col0.replace(",", "."));
                        detalle = cols.slice(1).join(" ").trim();
                    } else if (!col0IsNum && col1IsNum) {
                        // Swapped: Desc | Qty
                        cantidad = parseFloat(col1.replace(",", "."));
                        detalle = cols[0].trim() + (cols.length > 2 ? " " + cols.slice(2).join(" ") : "");
                    } else if (col0IsNum && col1IsNum) {
                        // Both are numbers? Assume Qty | Price? or Qty | Code?
                        // Default to first is Qty.
                        cantidad = parseFloat(col0.replace(",", "."));
                        detalle = cols.slice(1).join(" ").trim();
                    } else {
                        // neither is number
                        detalle = row.trim();
                    }
                } else {
                    // Single column
                    const isNumber = (str: string) => /^\d+([.,]\d+)?$/.test(str.trim());
                    if (isNumber(cols[0])) {
                        // Just a number? maybe just pasting qty? 
                        // Unlikely. Treat as detail.
                        detalle = cols[0].trim();
                    } else {
                        detalle = cols[0].trim();
                    }
                }

                return { cantidad, detalle };
            });

            // Replace current details or Append? User asked "pegar datos", usually implies filling.
            // I'll replace if the only row is empty, otherwise append? 
            // "quiero que al pegar los datos del excel se generen la cantidad de lineas necesarias"
            // Let's verify if the form is "clean"
            const currentValues = form.getValues().detalles;
            if (currentValues.length === 1 && currentValues[0].detalle === "" && currentValues[0].cantidad === 1) {
                replace(newDetalles);
            } else {
                // Append, but check limit. 
                // The user said "un maximo de 15". Does he mean total or per paste?
                // "generen la cantidad de lineas necesarias con un maximo de 15"
                // I will append them.
                // Actually, useFieldArray replace might be better if they want to 'paste from excel' usually means bulk entry.
                // But replacing might lose existing work. 
                // Let's ask? No, act consistently. If I am pasting a list, I probably want that list.
                // However, appending is safer.
                // Let's replace ONLY IF the first item is empty (new form).
                // Otherwise append.

                // LIMIT CHECK: if total > 15?
                // "con un maximo de 15". I will limit the PASTED items to 15.
                newDetalles.forEach(d => append(d));
                // Wait, if I use forEach append it might be slow for many items in React Hook Form?
                // replace is faster but destructive.
                // Let's use append with the array if supported? FieldArray append supports array.
            }
            // Actually, if it's a fresh form, replace is better UX.
            if (currentValues.length === 1 && !currentValues[0].detalle) {
                replace(newDetalles);
            } else {
                append(newDetalles);
            }

            toast.success(`${newDetalles.length} filas pegadas desde Excel`);

        } catch (error) {
            console.error("Paste error:", error);
            toast.error("Error al leer del portapapeles. Asegúrate de dar permisos.");
        }
    };

    const onSubmit = async (data: RecepcionFormValues) => {
        if (!currentUser) {
            toast.error("No hay sesión activa");
            return;
        }

        setIsLoading(true);
        try {
            // Convert FileList to array
            const adjuntosArray = data.adjuntos && data.adjuntos.length > 0
                ? Array.from(data.adjuntos as FileList)
                : [];

            if (initialData) {
                await updateRecepcion(initialData.id, {
                    compra: compra.id,
                    orden_compra: data.orden_compra,
                    fecha_recepcion: new Date(data.fecha_recepcion),

                    documento_tipo: data.documento_tipo,
                    documento_numero: data.documento_numero || "",
                    observaciones: data.observaciones || "",
                    recepcionado_por: currentUser.id,
                    adjuntos: adjuntosArray,
                    detalles: data.detalles,
                });
                toast.success("Recepción actualizada correctamente");
            } else {
                await createRecepcion({
                    compra: compra.id,
                    orden_compra: data.orden_compra,
                    fecha_recepcion: new Date(data.fecha_recepcion), // Service formats this

                    documento_tipo: data.documento_tipo,
                    documento_numero: data.documento_numero || "",
                    observaciones: data.observaciones || "",
                    recepcionado_por: currentUser.id,
                    adjuntos: adjuntosArray,
                    detalles: data.detalles,
                });
                toast.success("Recepción registrada correctamente");
            }

            form.reset();
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error("Error creating/updating reception:", error);
            toast.error(initialData ? "Error al actualizar la recepción" : "Error al registrar la recepción");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{initialData ? `Editar Recepción ${initialData.folio}` : "Nueva Recepción de Bodega"}</DialogTitle>
                    <DialogDescription>
                        Ingrese los detalles de la recepción de productos o servicios.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                            {/* Header Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md bg-muted/20">
                                <FormItem>
                                    <FormLabel className="text-xs text-muted-foreground uppercase">Compra Asociada</FormLabel>
                                    <div className="font-mono font-bold">{compra.numero_ordinario}</div>
                                    <div className="text-sm truncate">{compra.descripcion}</div>
                                </FormItem>


                                <FormItem>
                                    <FormLabel className="text-xs text-muted-foreground uppercase">Subvención</FormLabel>
                                    <div className="font-medium">{compra.expand?.subvencion?.nombre || "N/A"}</div>
                                </FormItem>

                                <FormField
                                    control={form.control}
                                    name="fecha_recepcion"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Fecha Recepción</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {compra.expand?.["ordenes_compra(compra)"] && compra.expand["ordenes_compra(compra)"].length > 0 ? (
                                    <FormField
                                        control={form.control}
                                        name="orden_compra"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Orden de Compra</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Seleccione OC" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {compra.expand?.["ordenes_compra(compra)"]?.map((oc) => (
                                                            <SelectItem key={oc.id} value={oc.id}>
                                                                {oc.oc} ({format(parseISO(oc.oc_fecha), "dd/MM/yyyy")})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ) : (
                                    <FormItem>
                                        <FormLabel>Orden de Compra</FormLabel>
                                        <div className="text-sm text-muted-foreground italic py-2">No hay OCs asociadas</div>
                                    </FormItem>
                                )}


                                <FormField
                                    control={form.control}
                                    name="documento_tipo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tipo Documento</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccione tipo" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Guía de Despacho">Guía de Despacho</SelectItem>
                                                    <SelectItem value="Factura">Factura</SelectItem>
                                                    <SelectItem value="Boleta">Boleta</SelectItem>
                                                    <SelectItem value="Otro">Otro</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="documento_numero"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>N° Documento</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej: 12345" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Details Section */}
                            <div className="border rounded-md p-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-sm font-semibold uppercase">Detalle de lo Recibido</h4>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handlePasteFromClipboard}
                                            className="text-green-600 border-green-200 hover:bg-green-50"
                                        >
                                            <ClipboardPaste className="h-4 w-4 mr-2" />
                                            Pegar Excel
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => append({ cantidad: 1, detalle: "" })}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Agregar Ítem
                                        </Button>
                                    </div>
                                </div>

                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[100px]">Cant.</TableHead>
                                            <TableHead>Descripción / Detalle</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {fields.map((field, index) => (
                                            <TableRow key={field.id}>
                                                <TableCell>
                                                    <FormField
                                                        control={form.control}
                                                        name={`detalles.${index}.cantidad`}
                                                        render={({ field }) => (
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    className="h-8"
                                                                    {...field}
                                                                    onChange={e => field.onChange(e.target.valueAsNumber)}
                                                                />
                                                            </FormControl>
                                                        )}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <FormField
                                                        control={form.control}
                                                        name={`detalles.${index}.detalle`}
                                                        render={({ field }) => (
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="Descripción del producto..."
                                                                    className="h-8"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                        )}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => remove(index)}
                                                        className="text-destructive hover:bg-destructive/10"
                                                        disabled={fields.length === 1}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                {form.formState.errors.detalles && (
                                    <p className="text-sm text-destructive mt-2">{form.formState.errors.detalles.message}</p>
                                )}
                            </div>

                            {/* Footer Section: Observaciones & Files */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="observaciones"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Observaciones</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Comentarios adicionales..."
                                                    className="resize-none min-h-[80px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="adjuntos"
                                    render={({ field: { ref, name, onBlur, onChange } }) => (
                                        <FormItem>
                                            <FormLabel>Adjuntar Documentos</FormLabel>
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="file"
                                                        multiple
                                                        ref={ref}
                                                        name={name}
                                                        onBlur={onBlur}
                                                        onChange={(e) => {
                                                            onChange(e.target.files);
                                                        }}
                                                        className="cursor-pointer"
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                    />
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Puede subir múltiples archivos (PDF, JPG, PNG)
                                                </p>
                                                {initialData?.adjuntos && initialData.adjuntos.length > 0 && (
                                                    <div className="mt-2 text-xs text-muted-foreground bg-muted p-2 rounded">
                                                        <strong>Adjuntos actuales:</strong> {initialData.adjuntos.join(", ")}
                                                        <br /> (Subir nuevos archivos se sumará o reemplazará la lógica según implementación, aquí agrega)
                                                    </div>
                                                )}
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t mt-6">
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {initialData ? "Actualizar Recepción" : "Registrar Recepción"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog >
    );
}

