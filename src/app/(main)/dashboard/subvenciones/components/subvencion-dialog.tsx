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
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createSubvencion, updateSubvencion } from "@/services/subvenciones.service";
import type { Subvencion } from "@/types/subvencion";

import { subvencionFormSchema, type SubvencionFormValues } from "../schemas/subvencion-form.schema";

interface SubvencionDialogProps {
    subvencion?: Subvencion;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function SubvencionDialog({ subvencion, open, onOpenChange, onSuccess }: SubvencionDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditing = !!subvencion;

    const form = useForm<SubvencionFormValues>({
        resolver: zodResolver(subvencionFormSchema),
        defaultValues: {
            nombre: subvencion?.nombre || "",
            descripcion: subvencion?.descripcion || "",
        },
    });

    const onSubmit = async (data: SubvencionFormValues) => {
        setIsSubmitting(true);

        try {
            if (isEditing) {
                await updateSubvencion(subvencion.id, data);
                toast.success("Subvención actualizada exitosamente");
            } else {
                await createSubvencion(data);
                toast.success("Subvención creada exitosamente");
            }

            form.reset();
            onSuccess();
        } catch (error: any) {
            console.error("Error saving subvencion:", error);
            toast.error(error?.message || "Error al guardar subvención");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Subvención" : "Crear Nueva Subvención"}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Modifica los datos de la subvención."
                            : "Completa los datos para crear una nueva subvención."}
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
                                        <Input placeholder="Nombre de la subvención" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="descripcion"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descripción</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Describe la subvención..."
                                            className="min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
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
                                {isSubmitting ? "Guardando..." : isEditing ? "Guardar Cambios" : "Crear Subvención"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
