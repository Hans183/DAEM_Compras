"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";

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
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { createRequirente, updateRequirente } from "@/services/requirentes.service";
import type { Requirente } from "@/types/requirente";

import { requirenteFormSchema, type RequirenteFormValues } from "../schemas/requirente-form.schema";

interface RequirenteDialogProps {
    requirente?: Requirente;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function RequirenteDialog({ requirente, open, onOpenChange, onSuccess }: RequirenteDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditing = !!requirente;

    const form = useForm<RequirenteFormValues>({
        resolver: zodResolver(requirenteFormSchema),
        defaultValues: {
            nombre: requirente?.nombre || "",
            active: requirente?.active ?? true,
        },
    });

    const onSubmit = async (data: RequirenteFormValues) => {
        setIsSubmitting(true);

        try {
            if (isEditing) {
                await updateRequirente(requirente.id, data);
                toast.success("Unidad requirente actualizada exitosamente");
            } else {
                await createRequirente(data);
                toast.success("Unidad requirente creada exitosamente");
            }

            form.reset();
            onSuccess();
        } catch (error: any) {
            console.error("Error saving requirente:", error);
            toast.error(error?.message || "Error al guardar unidad requirente");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Editar Unidad Requirente" : "Crear Nueva Unidad Requirente"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Modifica los datos de la unidad requirente."
                            : "Complete los datos para crear una nueva unidad requirente."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="nombre"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nombre de la unidad" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="active"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                    <div className="space-y-0.5">
                                        <FormLabel>Estado</FormLabel>
                                        <FormDescription>
                                            Activar o desactivar esta unidad requirente
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Guardando..." : isEditing ? "Guardar Cambios" : "Crear"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
