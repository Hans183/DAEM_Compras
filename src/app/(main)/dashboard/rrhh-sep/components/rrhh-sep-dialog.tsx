"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { RrhhSep } from "@/types/rrhh-sep";
import { MONTHS } from "@/types/rrhh-sep";
import { createRrhhSep, updateRrhhSep } from "@/services/rrhh-sep.service";
import { getRequirentes } from "@/services/requirentes.service";
import type { Requirente } from "@/types/requirente";

const formSchema = z.object({
    mes: z.string().min(1, "Debe seleccionar un mes"),
    anio: z.coerce.number().min(2020, "Año inválido").max(2100, "Año inválido"),
    escuelas: z.string().min(1, "Debe seleccionar una escuela"),
    total: z.coerce.number().min(0, "El total debe ser mayor o igual a 0"),
});

type FormValues = z.infer<typeof formSchema>;

interface RrhhSepDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    record?: RrhhSep;
    onSuccess: () => void;
}

export function RrhhSepDialog({
    open,
    onOpenChange,
    record,
    onSuccess,
}: RrhhSepDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [schools, setSchools] = useState<Requirente[]>([]);
    const [loadingSchools, setLoadingSchools] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            mes: "",
            anio: new Date().getFullYear(),
            escuelas: "",
            total: 0,
        },
    });

    useEffect(() => {
        if (open) {
            loadSchools();
            if (record) {
                form.reset({
                    mes: record.mes,
                    anio: record.anio,
                    escuelas: record.escuelas,
                    total: record.total,
                });
            } else {
                form.reset({
                    mes: "",
                    anio: new Date().getFullYear(),
                    escuelas: "",
                    total: 0,
                });
            }
        }
    }, [open, record, form]);

    const loadSchools = async () => {
        setLoadingSchools(true);
        try {
            // Fetch all active schools (high limit to get all)
            const result = await getRequirentes({ perPage: 200, sort: "nombre", sep_filter: true });
            // Filter only active ones if needed, though usually CRUD fetches all.
            // Assuming we only want active ones for new records, but existing records might reference inactive ones?
            // For simplicity, just list all.
            setSchools(result.items);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar escuelas");
        } finally {
            setLoadingSchools(false);
        }
    };

    const onSubmit = async (values: FormValues) => {
        setIsSubmitting(true);
        try {
            if (record) {
                await updateRrhhSep(record.id, values);
                toast.success("Registro actualizado correctamente");
            } else {
                await createRrhhSep(values);
                toast.success("Registro creado correctamente");
            }
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar el registro");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {record ? "Editar Registro" : "Nuevo Registro"}
                    </DialogTitle>
                    <DialogDescription>
                        {record
                            ? "Edite los detalles del registro de RRHH SEP."
                            : "Ingrese los detalles para el nuevo registro de RRHH SEP."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="mes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mes</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccione un mes" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {MONTHS.map((month) => (
                                                <SelectItem key={month} value={month}>
                                                    {month}
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
                            name="anio"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Año</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="escuelas"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Escuela (Unidad Requirente)</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        value={field.value}
                                        disabled={loadingSchools}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={loadingSchools ? "Cargando..." : "Seleccione una escuela"} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {schools.map((school) => (
                                                <SelectItem key={school.id} value={school.id}>
                                                    {school.nombre}
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
                            name="total"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Total Gasto Personal</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {record ? "Guardar Cambios" : "Crear Registro"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
