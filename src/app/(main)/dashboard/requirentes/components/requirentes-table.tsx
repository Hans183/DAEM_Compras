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
import { Badge } from "@/components/ui/badge";
import type { Requirente } from "@/types/requirente";

import { DeleteRequirenteDialog } from "./delete-requirente-dialog";
import { RequirenteDialog } from "./requirente-dialog";

interface RequirentesTableProps {
    requirentes: Requirente[];
    onRequirenteUpdated: () => void;
}

export function RequirentesTable({ requirentes, onRequirenteUpdated }: RequirentesTableProps) {
    const [editingRequirente, setEditingRequirente] = useState<Requirente | null>(null);
    const [deletingRequirente, setDeletingRequirente] = useState<Requirente | null>(null);

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Fecha Creación</TableHead>
                            <TableHead className="w-12"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requirentes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    No se encontraron unidades requirentas
                                </TableCell>
                            </TableRow>
                        ) : (
                            requirentes.map((requirente) => (
                                <TableRow key={requirente.id}>
                                    <TableCell className="font-medium">{requirente.nombre}</TableCell>
                                    <TableCell>
                                        <Badge variant={requirente.active ? "default" : "secondary"}>
                                            {requirente.active ? "Activo" : "Inactivo"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(requirente.created).toLocaleDateString("es-CL")}
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
                                                <DropdownMenuItem onClick={() => setEditingRequirente(requirente)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => setDeletingRequirente(requirente)}
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

            {editingRequirente && (
                <RequirenteDialog
                    requirente={editingRequirente}
                    open={!!editingRequirente}
                    onOpenChange={(open) => !open && setEditingRequirente(null)}
                    onSuccess={() => {
                        setEditingRequirente(null);
                        onRequirenteUpdated();
                    }}
                />
            )}

            {deletingRequirente && (
                <DeleteRequirenteDialog
                    requirente={deletingRequirente}
                    open={!!deletingRequirente}
                    onOpenChange={(open) => !open && setDeletingRequirente(null)}
                    onSuccess={() => {
                        setDeletingRequirente(null);
                        onRequirenteUpdated();
                    }}
                />
            )}
        </>
    );
}
