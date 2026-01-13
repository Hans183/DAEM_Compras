"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { RrhhSep } from "@/types/rrhh-sep";
import { RrhhSepDialog } from "./rrhh-sep-dialog";
import { DeleteRrhhSepDialog } from "./delete-rrhh-sep-dialog";

interface RrhhSepTableProps {
    data: RrhhSep[];
    onDataChanged: () => void;
}

export function RrhhSepTable({ data, onDataChanged }: RrhhSepTableProps) {
    const [editingRecord, setEditingRecord] = useState<RrhhSep | undefined>(undefined);
    const [deletingRecord, setDeletingRecord] = useState<RrhhSep | undefined>(undefined);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const handleEdit = (record: RrhhSep) => {
        setEditingRecord(record);
        setIsEditOpen(true);
    };

    const handleDelete = (record: RrhhSep) => {
        setDeletingRecord(record);
        setIsDeleteOpen(true);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("es-CL", {
            style: "currency",
            currency: "CLP",
        }).format(amount);
    };

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Año</TableHead>
                            <TableHead>Mes</TableHead>
                            <TableHead>Escuela</TableHead>
                            <TableHead className="text-right">Total Gasto</TableHead>
                            <TableHead className="w-[100px]">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    No hay registros disponibles.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((record) => (
                                <TableRow key={record.id}>
                                    <TableCell className="font-medium">
                                        {record.anio}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{record.mes}</Badge>
                                    </TableCell>
                                    <TableCell>{record.expand?.escuelas?.nombre || "Sin escuela"}</TableCell>
                                    <TableCell className="text-right font-mono">
                                        {formatCurrency(record.total)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(record)}
                                                className="h-8 w-8"
                                            >
                                                <Pencil className="h-4 w-4" />
                                                <span className="sr-only">Editar</span>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(record)}
                                                className="h-8 w-8 text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">Eliminar</span>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <RrhhSepDialog
                open={isEditOpen}
                onOpenChange={(open) => {
                    setIsEditOpen(open);
                    if (!open) setEditingRecord(undefined);
                }}
                record={editingRecord}
                onSuccess={onDataChanged}
            />

            {deletingRecord && (
                <DeleteRrhhSepDialog
                    open={isDeleteOpen}
                    onOpenChange={(open) => {
                        setIsDeleteOpen(open);
                        if (!open) setDeletingRecord(undefined);
                    }}
                    record={deletingRecord}
                    onSuccess={onDataChanged}
                />
            )}
        </>
    );
}
