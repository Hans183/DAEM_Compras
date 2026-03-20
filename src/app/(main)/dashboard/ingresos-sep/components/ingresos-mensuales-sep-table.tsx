"use client";

import { Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { deleteIngresoMensualSep } from "@/services/ingresos-mensuales-sep.service";
import type { IngresoMensualSep } from "@/types/ingreso-mensual-sep";

interface IngresosMensualesSepTableProps {
  data: IngresoMensualSep[];
  onEdit: (ingreso: IngresoMensualSep) => void;
  onRefresh: () => void;
}

export function IngresosMensualesSepTable({ data, onEdit, onRefresh }: IngresosMensualesSepTableProps) {
  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este registro?")) return;

    try {
      await deleteIngresoMensualSep(id);
      toast.success("Registro eliminado correctamente");
      onRefresh();
    } catch (error) {
      console.error("Error deleting registro:", error);
      toast.error("Error al eliminar el registro");
    }
  };

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Establecimiento</TableHead>
            <TableHead className="text-right">Prioritarios</TableHead>
            <TableHead className="text-right">Preferentes</TableHead>
            <TableHead className="text-right">10% Prio.</TableHead>
            <TableHead className="text-right">10% Pref.</TableHead>
            <TableHead className="min-w-[120px] text-center leading-tight">
              Total a Reflejar
              <br />
              Mensual prioritarios
            </TableHead>
            <TableHead className="min-w-[120px] text-center leading-tight">
              Total a Reflejar
              <br />
              Mensual Preferentes
            </TableHead>
            <TableHead className="w-[100px] text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                No se encontraron registros de ingresos mensuales.
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => {
              const prioritarios10 = item.prioritarios * 0.1;
              const preferentes10 = item.preferentes * 0.1;
              const totalReflejarPrio = item.prioritarios * 0.9;
              const totalReflejarPref = item.preferentes * 0.9;
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.expand?.requirente?.nombre || "N/A"}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.prioritarios, { currency: "CLP", locale: "es-CL", noDecimals: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.preferentes, { currency: "CLP", locale: "es-CL", noDecimals: true })}
                  </TableCell>
                  <TableCell className="text-right text-emerald-700">
                    {formatCurrency(prioritarios10, { currency: "CLP", locale: "es-CL", noDecimals: true })}
                  </TableCell>
                  <TableCell className="text-right text-emerald-700">
                    {formatCurrency(preferentes10, { currency: "CLP", locale: "es-CL", noDecimals: true })}
                  </TableCell>
                  <TableCell className="text-right font-bold text-blue-800">
                    {formatCurrency(totalReflejarPrio, { currency: "CLP", locale: "es-CL", noDecimals: true })}
                  </TableCell>
                  <TableCell className="text-right font-bold text-blue-800">
                    {formatCurrency(totalReflejarPref, { currency: "CLP", locale: "es-CL", noDecimals: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onEdit(item)} className="h-8 w-8 p-0">
                        <span className="sr-only">Editar</span>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <span className="sr-only">Eliminar</span>
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
  );
}
