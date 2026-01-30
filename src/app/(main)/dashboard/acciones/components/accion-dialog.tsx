"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";

import { createAccion, updateAccion } from "@/services/acciones.service";
import { getDimensiones, getSubdimenciones } from "@/services/dimensiones.service";
import type { Accion } from "@/types/accion";
import type { Dimension, Subdimencion } from "@/types/dimension";
import { getRequirentes } from "@/services/requirentes.service";
import type { Requirente } from "@/types/requirente";

const formSchema = z.object({
    nombre: z.string().min(1, "El nombre es requerido"),
    establecimiento: z.string().min(1, "El establecimiento es requerido"),
    dimension: z.string().optional(),
    subdimencion: z.string().optional(),
    monto_subvencion_general: z.coerce.number().min(0),
    monto_sep: z.coerce.number().min(0),
    objetivo_estrategico: z.string().optional(),
    estrategia: z.string().optional(),
    metodo_verificacion: z.string().optional(),
    descripcion: z.string().optional(),
    recursos_necesarios: z.string().optional(),
    programa_asociado: z.string().optional(),
    ate: z.string().optional(),
    responsable: z.string().optional(),
    tic: z.string().optional(),
    planes: z.string().optional(),
});

interface AccionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    accionToEdit?: Accion | null;
}

// Currency formatter utility
const formatCurrency = (value: number | string) => {
    if (!value) return "";
    // Remove non-digits
    const number = Number(String(value).replace(/[^0-9]/g, ""));
    return new Intl.NumberFormat("es-CL").format(number);
};

const parseCurrency = (value: string) => {
    return Number(value.replace(/\./g, ""));
};

export function AccionDialog({
    open,
    onOpenChange,
    onSuccess,
    accionToEdit,
}: AccionDialogProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [dimensiones, setDimensiones] = useState<Dimension[]>([]);
    const [requirentes, setRequirentes] = useState<Requirente[]>([]);
    const [subdimenciones, setSubdimenciones] = useState<Subdimencion[]>([]);
    const [loadingDimensions, setLoadingDimensions] = useState(false);
    const [openCombobox, setOpenCombobox] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            nombre: "",
            establecimiento: "",
            dimension: "",
            subdimencion: "",
            monto_subvencion_general: 0,
            monto_sep: 0,
            objetivo_estrategico: "",
            estrategia: "",
            metodo_verificacion: "",
            descripcion: "",
            recursos_necesarios: "",
            programa_asociado: "",
            ate: "",
            responsable: "",
            tic: "",
            planes: "",
        },
    });

    // Watch dimension to filter subdimenciones
    const selectedDimension = form.watch("dimension");

    // Load dimensions on mount
    useEffect(() => {
        const loadDocs = async () => {
            setLoadingDimensions(true);
            try {
                const [dims, reqs] = await Promise.all([
                    getDimensiones(),
                    getRequirentes({ perPage: 500, sort: "nombre", sep_filter: true }),
                ]);
                setDimensiones(dims);
                setRequirentes(reqs.items);
            } catch (error) {
                console.error("Error loading dimensions:", error);
            } finally {
                setLoadingDimensions(false);
            }
        };
        if (open) {
            loadDocs();
        }
    }, [open]);

    // Load subdimensions when dimension changes
    useEffect(() => {
        const loadSubs = async () => {
            if (!selectedDimension) {
                setSubdimenciones([]);
                return;
            }
            try {
                const subs = await getSubdimenciones(selectedDimension);
                setSubdimenciones(subs);
            } catch (error) {
                console.error("Error loading subdimensions:", error);
            }
        };
        loadSubs();
    }, [selectedDimension]);

    useEffect(() => {
        if (open) {
            if (accionToEdit) {
                form.reset({
                    nombre: accionToEdit.nombre,
                    establecimiento: accionToEdit.establecimiento || "",
                    dimension: accionToEdit.dimension,
                    subdimencion: accionToEdit.subdimencion,
                    monto_subvencion_general: accionToEdit.monto_subvencion_general,
                    monto_sep: accionToEdit.monto_sep,
                    objetivo_estrategico: accionToEdit.objetivo_estrategico,
                    estrategia: accionToEdit.estrategia,
                    metodo_verificacion: accionToEdit.metodo_verificacion,
                    descripcion: accionToEdit.descripcion || "",
                    recursos_necesarios: accionToEdit.recursos_necesarios || "",
                    programa_asociado: accionToEdit.programa_asociado || "",
                    ate: accionToEdit.ate || "",
                    responsable: accionToEdit.responsable || "",
                    tic: accionToEdit.tic || "",
                    planes: accionToEdit.planes || "",
                });
            } else {
                form.reset({
                    nombre: "",
                    establecimiento: "",
                    dimension: "",
                    subdimencion: "",
                    monto_subvencion_general: 0,
                    monto_sep: 0,
                    objetivo_estrategico: "",
                    estrategia: "",
                    metodo_verificacion: "",
                    descripcion: "",
                    recursos_necesarios: "",
                    programa_asociado: "",
                    ate: "",
                    responsable: "",
                    tic: "",
                    planes: "",
                });
            }
        }
    }, [open, accionToEdit, form]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSaving(true);
        try {
            if (accionToEdit) {
                await updateAccion(accionToEdit.id, values);
                toast.success("Acción actualizada correctamente");
            } else {
                await createAccion(values);
                toast.success("Acción creada correctamente");
            }
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error("Error saving accion:", error);
            toast.error("Error al guardar la acción");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {accionToEdit ? "Editar Acción" : "Nueva Acción"}
                    </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="nombre"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Nombre</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nombre de la acción" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="establecimiento"
                                render={({ field }) => (
                                    <FormItem className="col-span-2 flex flex-col">
                                        <FormLabel>Establecimiento</FormLabel>
                                        <Popover open={openCombobox} onOpenChange={setOpenCombobox} modal={true}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        aria-expanded={openCombobox}
                                                        className={cn(
                                                            "justify-between",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value
                                                            ? requirentes.find(
                                                                (r) => r.id === field.value
                                                            )?.nombre
                                                            : "Seleccione establecimiento"}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[400px] p-0" align="start">
                                                <Command>
                                                    <CommandInput placeholder="Buscar establecimiento..." />
                                                    <CommandList className="max-h-[300px] overflow-y-auto">
                                                        <CommandEmpty>
                                                            No se encontró establecimiento.
                                                        </CommandEmpty>
                                                        {requirentes.map((r) => (
                                                            <CommandItem
                                                                value={r.nombre}
                                                                key={r.id}
                                                                onSelect={() => {
                                                                    field.onChange(r.id);
                                                                    setOpenCombobox(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        r.id === field.value
                                                                            ? "opacity-100"
                                                                            : "opacity-0"
                                                                    )}
                                                                />
                                                                {r.nombre}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="dimension"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Dimensión</FormLabel>
                                        <Select
                                            onValueChange={(value) => {
                                                field.onChange(value);
                                                // Reset subdimencion logic if needed, but react-hook-form handles value.
                                                // We might want to clear subdimencion if dimension changes manually?
                                                // For now let's keep it simple.
                                            }}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccione dimensión" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent position="popper">
                                                {dimensiones.map((d) => (
                                                    <SelectItem key={d.id} value={d.id}>
                                                        {d.nombre}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="subdimencion"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Subdimensión</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccione subdimensión" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent position="popper">
                                                {subdimenciones.map((s) => (
                                                    <SelectItem key={s.id} value={s.id}>
                                                        {s.nombre.length > 50
                                                            ? s.nombre.substring(0, 50) + "..."
                                                            : s.nombre}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="monto_subvencion_general"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Monto Subvención General</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="text"
                                                placeholder="0"
                                                value={formatCurrency(field.value)}
                                                onChange={(e) => {
                                                    const rawValue = parseCurrency(e.target.value);
                                                    field.onChange(rawValue);
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="monto_sep"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Monto SEP</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="text"
                                                placeholder="0"
                                                value={formatCurrency(field.value)}
                                                onChange={(e) => {
                                                    const rawValue = parseCurrency(e.target.value);
                                                    field.onChange(rawValue);
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="objetivo_estrategico"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Objetivo Estratégico</FormLabel>
                                        <FormControl>
                                            <Input {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="estrategia"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Estrategia</FormLabel>
                                        <FormControl>
                                            <Input {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="descripcion"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Descripción</FormLabel>
                                        <FormControl>
                                            <Textarea {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="metodo_verificacion"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Método Verificación</FormLabel>
                                        <FormControl>
                                            <Input {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="recursos_necesarios"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Recursos Necesarios</FormLabel>
                                        <FormControl>
                                            <Input {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="programa_asociado"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Programa Asociado</FormLabel>
                                        <FormControl>
                                            <Input {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="ate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ATE</FormLabel>
                                        <FormControl>
                                            <Input {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="responsable"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Responsable</FormLabel>
                                        <FormControl>
                                            <Input {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="tic"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>TIC</FormLabel>
                                        <FormControl>
                                            <Input {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="planes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Planes</FormLabel>
                                        <FormControl>
                                            <Input {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSaving}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
