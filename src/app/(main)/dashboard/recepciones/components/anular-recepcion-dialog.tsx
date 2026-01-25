"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

import { cancelRecepcion } from "@/services/recepciones.service";
import type { Recepcion } from "@/types/recepcion";

const anularSchema = z.object({
    motivo: z.string().min(5, "El motivo debe tener al menos 5 caracteres"),
});

interface AnularRecepcionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    recepcion: Recepcion;
    onSuccess: () => void;
}

export function AnularRecepcionDialog({ open, onOpenChange, recepcion, onSuccess }: AnularRecepcionDialogProps) {
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof anularSchema>>({
        resolver: zodResolver(anularSchema),
        defaultValues: {
            motivo: "",
        },
    });

    const onSubmit = async (data: z.infer<typeof anularSchema>) => {
        setIsLoading(true);
        try {
            await cancelRecepcion(recepcion.id, data.motivo);
            toast.success("Recepción anulada correctamente");
            form.reset();
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error("Error canceling reception:", error);
            toast.error("Error al anular la recepción");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Anular Recepción {recepcion.folio}</DialogTitle>
                    <DialogDescription>
                        Esta acción marcará la recepción como anulada y no podrá deshacerse.
                        Por favor ingrese el motivo.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="motivo"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Motivo de Anulación</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Indique la razón..."
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" variant="destructive" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Anular Recepción
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
