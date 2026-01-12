"use client";

import { useState } from "react";

import { toast } from "sonner";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteSubvencion } from "@/services/subvenciones.service";
import type { Subvencion } from "@/types/subvencion";

interface DeleteSubvencionDialogProps {
    subvencion: Subvencion;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function DeleteSubvencionDialog({
    subvencion,
    open,
    onOpenChange,
    onSuccess,
}: DeleteSubvencionDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);

        try {
            await deleteSubvencion(subvencion.id);
            toast.success("Subvención eliminada exitosamente");
            onSuccess();
        } catch (error: any) {
            console.error("Error deleting subvencion:", error);
            toast.error(error?.message || "Error al eliminar subvención");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Estás a punto de eliminar la subvención <strong>{subvencion.nombre}</strong>. Esta acción
                        no se puede deshacer.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeleting ? "Eliminando..." : "Eliminar Subvención"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
