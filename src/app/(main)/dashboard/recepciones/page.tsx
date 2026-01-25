"use client";

import { useAuth } from "@/hooks/use-auth";
import { RecepcionesTable } from "./components/recepciones-table";
import { Loader2 } from "lucide-react";

export default function RecepcionesPage() {
    const { user, loading } = useAuth();

    if (loading) {

        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user || (!user.role.includes("Admin") && !user.role.includes("Bodega"))) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-destructive mb-2">Acceso Denegado</h1>
                    <p className="text-muted-foreground">No tienes permisos para ver este módulo.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Recepciones de Bodega</h2>
                <div className="flex items-center space-x-2">
                    {/* Additional actions if needed */}
                </div>
            </div>

            <RecepcionesTable currentUser={user} />
        </div>
    );
}
