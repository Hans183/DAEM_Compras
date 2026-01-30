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
    usageMap: Record<string, number>;
    onDataChanged: () => void;
}

export function AccionesTable({ data, usageMap, onDataChanged }: AccionesTableProps) {
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
                            <TableHead>Monto SEP</TableHead>
                            {/* <TableHead>Responsable</TableHead> */}
                            <TableHead>Valor Acción</TableHead>
                            <TableHead className="w-[150px]">% Uso</TableHead>
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
                            data.map((item) => {
                                const valorAccion = item.valor_accion || 0;
                                const used = usageMap[item.id] || 0;
                                const percentage = valorAccion > 0 ? (used / valorAccion) * 100 : 0;

                                // Color logic
                                let progressColor = "bg-green-500";
                                if (percentage >= 100) progressColor = "bg-red-500";
                                else if (percentage >= 80) progressColor = "bg-yellow-500";
                                else if (percentage >= 50) progressColor = "bg-blue-500";

                                return (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium max-w-[200px] truncate" title={item.nombre}>
                                            {item.nombre}
                                        </TableCell>
                                        <TableCell>{item.expand?.establecimiento?.nombre || "N/A"}</TableCell>
                                        <TableCell>{item.expand?.dimension?.nombre || item.dimension || "N/A"}</TableCell>
                                        <TableCell>${item.monto_sep?.toLocaleString("es-CL")}</TableCell>
                                        {/* <TableCell>{item.responsable}</TableCell> */}
                                        <TableCell>${valorAccion.toLocaleString("es-CL")}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 w-full">
                                                <span className="text-xs text-muted-foreground text-right">
                                                    {percentage.toFixed(1)}%
                                                </span>
                                                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${progressColor} transition-all duration-300`}
                                                        style={{ width: `${Math.min(percentage, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </TableCell>
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
                                );
                            })
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
