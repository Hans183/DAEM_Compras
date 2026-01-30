"use client";

import { useState } from "react";
import { Edit, Trash2 } from "lucide-react";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { Accion } from "@/types/accion";
import { AccionDialog } from "./accion-dialog";
import { DeleteAccionDialog } from "./delete-accion-dialog";

interface AccionesTableProps {
    data: Accion[];
    onDataChanged: () => void;
}

export function AccionesTable({ data, onDataChanged }: AccionesTableProps) {
    const [editingAccion, setEditingAccion] = useState<Accion | null>(null);
    const [deletingAccion, setDeletingAccion] = useState<Accion | null>(null);

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Establecimiento</TableHead>
                            <TableHead>Dimensión</TableHead>
                            <TableHead>Monto Gral.</TableHead>
                            <TableHead>Monto SEP</TableHead>
                            <TableHead>Responsable</TableHead>
                            <TableHead className="w-[100px]">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    No se encontraron acciones.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.nombre}</TableCell>
                                    <TableCell>{item.expand?.establecimiento?.nombre || "N/A"}</TableCell>
                                    <TableCell>{item.dimension}</TableCell>
                                    <TableCell>${item.monto_subvencion_general?.toLocaleString("es-CL")}</TableCell>
                                    <TableCell>${item.monto_sep?.toLocaleString("es-CL")}</TableCell>
                                    <TableCell>{item.responsable}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setEditingAccion(item)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive"
                                                onClick={() => setDeletingAccion(item)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <AccionDialog
                open={!!editingAccion}
                onOpenChange={(open) => !open && setEditingAccion(null)}
                accionToEdit={editingAccion}
                onSuccess={() => {
                    setEditingAccion(null);
                    onDataChanged();
                }}
            />

            <DeleteAccionDialog
                open={!!deletingAccion}
                onOpenChange={(open) => !open && setDeletingAccion(null)}
                accion={deletingAccion}
                onSuccess={() => {
                    setDeletingAccion(null);
                    onDataChanged();
                }}
            />
        </>
    );
}
