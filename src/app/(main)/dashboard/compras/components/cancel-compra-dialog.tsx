"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, AlertTriangle } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { updateCompra } from "@/services/compras.service";
import type { Compra } from "@/types/compra";
import type { User } from "@/types/user";

const formSchema = z.object({
    motivo_anula: z.string().min(10, {
        message: "El motivo de anulación debe tener al menos 10 caracteres.",
    }),
});

interface CancelCompraDialogProps {
    compra: Compra;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    currentUser: User | null;
}

export function CancelCompraDialog({
    compra,
    open,
    onOpenChange,
    onSuccess,
    currentUser,
}: CancelCompraDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            motivo_anula: "",
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);
        try {
            await updateCompra(compra.id, {
                estado: "Anulado",
                motivo_anula: values.motivo_anula,
                usuario_modificador: currentUser?.name || currentUser?.email || "Usuario desconocido",
            });
            toast.success("Compra anulada exitosamente");
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error("Error anulando compra:", error);
            toast.error("Error al anular la compra");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Anular Compra
                    </DialogTitle>
                    <DialogDescription>
                        Esta acción es irreversible. Una vez anulada, la compra no podrá ser modificada.
                        Por favor, ingrese un motivo para continuar.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="motivo_anula"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Motivo de Anulación</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Describa por qué se anula esta compra..."
                                            className="resize-none min-h-[100px]"
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
                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Anulando...
                                    </>
                                ) : (
                                    "Confirmar Anulación"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
