"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { Subvencion } from "@/types/subvencion";

import { DeleteSubvencionDialog } from "./delete-subvencion-dialog";
import { SubvencionDialog } from "./subvencion-dialog";

interface SubvencionesTableProps {
    subvenciones: Subvencion[];
    onSubvencionUpdated: () => void;
}

export function SubvencionesTable({ subvenciones, onSubvencionUpdated }: SubvencionesTableProps) {
    const [editingSubvencion, setEditingSubvencion] = useState<Subvencion | null>(null);
    const [deletingSubvencion, setDeletingSubvencion] = useState<Subvencion | null>(null);

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead>Fecha Creación</TableHead>
                            <TableHead className="w-12"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {subvenciones.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    No se encontraron subvenciones
                                </TableCell>
                            </TableRow>
                        ) : (
                            subvenciones.map((subvencion) => (
                                <TableRow key={subvencion.id}>
                                    <TableCell className="font-medium">{subvencion.nombre}</TableCell>
                                    <TableCell className="max-w-md truncate">{subvencion.descripcion}</TableCell>
                                    <TableCell>
                                        {new Date(subvencion.created).toLocaleDateString("es-CL")}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Abrir menú</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => setEditingSubvencion(subvencion)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => setDeletingSubvencion(subvencion)}
                                                    className="text-destructive"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {editingSubvencion && (
                <SubvencionDialog
                    subvencion={editingSubvencion}
                    open={!!editingSubvencion}
                    onOpenChange={(open) => !open && setEditingSubvencion(null)}
                    onSuccess={() => {
                        setEditingSubvencion(null);
                        onSubvencionUpdated();
                    }}
                />
            )}

            {deletingSubvencion && (
                <DeleteSubvencionDialog
                    subvencion={deletingSubvencion}
                    open={!!deletingSubvencion}
                    onOpenChange={(open) => !open && setDeletingSubvencion(null)}
                    onSuccess={() => {
                        setDeletingSubvencion(null);
                        onSubvencionUpdated();
                    }}
                />
            )}
        </>
    );
}
