"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { updateCompra } from "@/services/compras.service";
import { getAcciones } from "@/services/acciones.service";
import type { Compra } from "@/types/compra";
import type { Accion } from "@/types/accion";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface ComprasSepTableProps {
    data: Compra[];
    onDataChanged: () => void;
}

export function ComprasSepTable({ data, onDataChanged }: ComprasSepTableProps) {
    const [acciones, setAcciones] = useState<Accion[]>([]);
    const [loadingAcciones, setLoadingAcciones] = useState(false);

    // Initial load of actions
    useEffect(() => {
        const loadAcciones = async () => {
            setLoadingAcciones(true);
            try {
                // Fetch all actions for selection. 
                // Optimization: In the future, we might want to filter this per row dynamically
                // based on the purchase's establishment, or just load ALL actions (could be heavy).
                // For now, let's load a good chunk.
                const result = await getAcciones({ perPage: 1000, sort: "nombre" });
                setAcciones(result.items);
            } catch (error) {
                console.error("Error loading acciones:", error);
            } finally {
                setLoadingAcciones(false);
            }
        };
        loadAcciones();
    }, []);

    const handleActionChange = async (compraId: string, actionId: string) => {
        try {
            await updateCompra(compraId, { accion: actionId });
            toast.success("Acción asignada correctamente");
            onDataChanged();
        } catch (error) {
            console.error("Error updating compra:", error);
            toast.error("Error al asignar la acción");
        }
    };

    const getEstadoColor = (estado: string) => {
        switch (estado) {
            case "Anulado":
            case "Devuelto":
                return "bg-red-100 text-red-800 border-red-200 hover:bg-red-100";
            case "En Proceso":
            case "Asignado":
                return "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100";
            case "Comprado":
            case "En Bodega":
            case "Entregado":
                return "bg-green-100 text-green-800 border-green-200 hover:bg-green-100";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100";
        }
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>N° Ord.</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Establecimiento</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Monto (Presupuesto)</TableHead>
                        <TableHead className="w-[300px]">Acción SEP</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                No se encontraron compras SEP.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.numero_ordinario}</TableCell>
                                <TableCell className="max-w-[250px] truncate" title={item.descripcion}>
                                    {item.descripcion}
                                </TableCell>
                                <TableCell>{item.expand?.unidad_requirente?.nombre || "N/A"}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={getEstadoColor(item.estado)}>
                                        {item.estado}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-medium">${item.presupuesto?.toLocaleString("es-CL") || 0}</TableCell>
                                <TableCell>
                                    <ActionSelector
                                        compra={item}
                                        acciones={acciones}
                                        onSelect={(actionId) => handleActionChange(item.id, actionId)}
                                    />
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

// Separate component for the selector to verify establishment matching logic cleanly if needed
// and manage popover state individually
function ActionSelector({
    compra,
    acciones,
    onSelect
}: {
    compra: Compra;
    acciones: Accion[];
    onSelect: (id: string) => void;
}) {
    const [open, setOpen] = useState(false);

    // Filter actions to only show those belonging to the same establishment as the purchase
    const relevantActions = acciones.filter(a =>
        a.establecimiento === compra.unidad_requirente
        // Also allow actions that might not have an establishment defined? Usually they should.
        // Or if the purchase doesn't have an establishment?
    );

    const orderedActions = relevantActions.sort((a, b) => a.nombre.localeCompare(b.nombre));
    const isMissingAction = !compra.accion;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between font-normal",
                        isMissingAction && "border-amber-500 bg-amber-50 text-amber-900 hover:bg-amber-100 hover:text-amber-900"
                    )}
                >
                    {compra.accion ? (
                        acciones.find((a) => a.id === compra.accion)?.nombre || "Acción desconocida"
                    ) : (
                        <span className="flex items-center gap-2 font-semibold">
                            {/*AlertCircle className="h-4 w-4" /*/}
                            Seleccionar acción...
                        </span>
                    )
                    }
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Buscar acción..." />
                    <CommandList>
                        <CommandEmpty>No se encontraron acciones para este establecimiento.</CommandEmpty>
                        <CommandGroup>
                            {orderedActions.map((accion) => (
                                <CommandItem
                                    key={accion.id}
                                    value={accion.nombre}
                                    onSelect={() => {
                                        onSelect(accion.id);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            compra.accion === accion.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col">
                                        <span>{accion.nombre}</span>
                                        {accion.dimension && (
                                            <span className="text-xs text-muted-foreground">{accion.dimension}</span>
                                        )}
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
