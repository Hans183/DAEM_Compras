"use client";

import { ChevronDown, ChevronsUpDown, ChevronUp, Edit, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { deleteIngresoMensualSep } from "@/services/ingresos-mensuales-sep.service";
import type { IngresoMensualSep } from "@/types/ingreso-mensual-sep";

interface IngresosMensualesSepTableProps {
  data: IngresoMensualSep[];
  onEdit: (ingreso: IngresoMensualSep) => void;
  onRefresh: () => void;
  sort: string;
  onSort: (field: string) => void;
  isReadOnly?: boolean;
}

export function IngresosMensualesSepTable({
  data,
  onEdit,
  onRefresh,
  sort,
  onSort,
  isReadOnly,
}: IngresosMensualesSepTableProps) {
  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este registro?")) return;

    try {
      await deleteIngresoMensualSep(id);
      toast.success("Ingreso eliminado correctamente");
      onRefresh();
    } catch (error) {
      console.error("Error deleting registro:", error);
      toast.error("Error al eliminar el ingreso");
    }
  };

  const totals = data.reduce(
    (acc, item) => {
      acc.prio10 += item.prio_10 || 0;
      acc.pref10 += item.pref_10 || 0;
      acc.prioReflejar += item.prio_reflejar || 0;
      acc.prefReflejar += item.pref_reflejar || 0;
      return acc;
    },
    { prio10: 0, pref10: 0, prioReflejar: 0, prefReflejar: 0 },
  );

  const grandTotal = totals.prioReflejar + totals.prefReflejar;

  const SortIcon = ({ field }: { field: string }) => {
    if (sort === field) return <ChevronUp className="ml-1 h-3 w-3" />;
    if (sort === `-${field}`) return <ChevronDown className="ml-1 h-3 w-3" />;
    return <ChevronsUpDown className="ml-1 h-3 w-3 opacity-50" />;
  };

  return (
    <div className="overflow-hidden rounded-md border bg-white shadow-sm">
      <Table>
        <TableHeader className="bg-gray-50/50">
          <TableRow>
            <TableHead
              className="max-w-[220px] cursor-pointer hover:bg-gray-100/50"
              onClick={() => onSort("requirente.nombre")}
            >
              <div className="flex items-center">
                Establecimiento
                <SortIcon field="requirente.nombre" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer text-right hover:bg-gray-100/50"
              onClick={() => onSort("prioritarios")}
            >
              <div className="flex items-center justify-end">
                Prioritarios
                <SortIcon field="prioritarios" />
              </div>
            </TableHead>
            <TableHead className="cursor-pointer text-right hover:bg-gray-100/50" onClick={() => onSort("preferentes")}>
              <div className="flex items-center justify-end">
                Preferentes
                <SortIcon field="preferentes" />
              </div>
            </TableHead>
            <TableHead className="cursor-pointer text-right hover:bg-gray-100/50" onClick={() => onSort("prio_10")}>
              <div className="flex items-center justify-end">
                10% Prio.
                <SortIcon field="prio_10" />
              </div>
            </TableHead>
            <TableHead className="cursor-pointer text-right hover:bg-gray-100/50" onClick={() => onSort("pref_10")}>
              <div className="flex items-center justify-end">
                10% Pref.
                <SortIcon field="pref_10" />
              </div>
            </TableHead>
            <TableHead
              className="min-w-[120px] cursor-pointer text-center leading-tight hover:bg-gray-100/50"
              onClick={() => onSort("prio_reflejar")}
            >
              <div className="flex items-center justify-center">
                Total a Reflejar
                <br />
                Mensual prioritarios
                <SortIcon field="prio_reflejar" />
              </div>
            </TableHead>
            <TableHead
              className="min-w-[120px] cursor-pointer text-center leading-tight hover:bg-gray-100/50"
              onClick={() => onSort("pref_reflejar")}
            >
              <div className="flex items-center justify-center">
                Total a Reflejar
                <br />
                Mensual Preferentes
                <SortIcon field="pref_reflejar" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer text-right font-bold hover:bg-gray-100/50"
              onClick={() => onSort("total_reflejar")}
            >
              <div className="flex items-center justify-end">
                Total a Reflejar
                <SortIcon field="total_reflejar" />
              </div>
            </TableHead>
            {!isReadOnly && <TableHead className="w-[100px] text-right">Acciones</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                No se encontraron registros de ingresos mensuales.
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => {
              const isRedTrumao = item.expand?.requirente?.red_trumao;
              const isSaldoInicial = item.mes === "Saldo Inicial";
              const isExento = isRedTrumao || isSaldoInicial;
              const nombreEstablecimiento = item.expand?.requirente?.nombre || "N/A";
              const nombreTruncado =
                nombreEstablecimiento.length > 40
                  ? `${nombreEstablecimiento.substring(0, 40)}...`
                  : nombreEstablecimiento;
              return (
                <TableRow key={item.id}>
                  <TableCell className="max-w-[220px] font-medium" title={nombreEstablecimiento}>
                    <div className="flex flex-col gap-1">
                      <span className="truncate">{nombreTruncado}</span>
                      {isRedTrumao && (
                        <Badge
                          variant="secondary"
                          className="h-4 w-fit border-emerald-200 bg-emerald-100 px-1.5 py-0 font-medium text-[10px] text-emerald-800 hover:bg-emerald-100"
                        >
                          Red Trumao
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.prioritarios, { currency: "CLP", locale: "es-CL", noDecimals: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.preferentes, { currency: "CLP", locale: "es-CL", noDecimals: true })}
                  </TableCell>
                  <TableCell className="text-right text-emerald-700">
                    {isExento ? (
                      <span className="text-muted-foreground text-xs italic">{isSaldoInicial ? "S.I." : "Exento"}</span>
                    ) : (
                      formatCurrency(item.prio_10 || 0, { currency: "CLP", locale: "es-CL", noDecimals: true })
                    )}
                  </TableCell>
                  <TableCell className="text-right text-emerald-700">
                    {isExento ? (
                      <span className="text-muted-foreground text-xs italic">{isSaldoInicial ? "S.I." : "Exento"}</span>
                    ) : (
                      formatCurrency(item.pref_10 || 0, { currency: "CLP", locale: "es-CL", noDecimals: true })
                    )}
                  </TableCell>
                  <TableCell className="text-right font-bold text-blue-800">
                    {formatCurrency(item.prio_reflejar || 0, { currency: "CLP", locale: "es-CL", noDecimals: true })}
                  </TableCell>
                  <TableCell className="text-right font-bold text-blue-800">
                    {formatCurrency(item.pref_reflejar || 0, { currency: "CLP", locale: "es-CL", noDecimals: true })}
                  </TableCell>
                  <TableCell className="bg-blue-50/50 text-right font-bold">
                    {formatCurrency(item.total_reflejar || 0, { currency: "CLP", locale: "es-CL", noDecimals: true })}
                  </TableCell>
                  {!isReadOnly && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => onEdit(item)} className="h-8 w-8 p-0">
                          <span className="sr-only">{item.id.startsWith("new-") ? "Agregar" : "Editar"}</span>
                          {item.id.startsWith("new-") ? (
                            <Plus className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Edit className="h-4 w-4" />
                          )}
                        </Button>
                        {!item.id.startsWith("new-") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <span className="sr-only">Eliminar</span>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
        {data.length > 0 && (
          <TableFooter className="bg-emerald-50/50">
            <TableRow className="bg-transparent hover:bg-transparent">
              <TableCell colSpan={3} className="h-12 border-emerald-100 border-t-2 font-bold text-emerald-900">
                TOTAL GENERAL A REFLEJAR
              </TableCell>
              <TableCell className="h-12 border-emerald-100 border-t-2 bg-emerald-50/20 text-right font-bold text-emerald-700">
                {formatCurrency(totals.prio10, { currency: "CLP", locale: "es-CL", noDecimals: true })}
              </TableCell>
              <TableCell className="h-12 border-emerald-100 border-t-2 bg-emerald-50/20 text-right font-bold text-emerald-700">
                {formatCurrency(totals.pref10, { currency: "CLP", locale: "es-CL", noDecimals: true })}
              </TableCell>
              <TableCell className="h-12 border-emerald-100 border-t-2 bg-blue-50/20 text-right font-bold text-blue-900">
                {formatCurrency(totals.prioReflejar, { currency: "CLP", locale: "es-CL", noDecimals: true })}
              </TableCell>
              <TableCell className="h-12 border-emerald-100 border-t-2 bg-blue-50/20 text-right font-bold text-blue-900">
                {formatCurrency(totals.prefReflejar, { currency: "CLP", locale: "es-CL", noDecimals: true })}
              </TableCell>
              <TableCell className="h-12 border-emerald-200 border-t-2 bg-emerald-100/40 text-right font-extrabold text-emerald-900">
                {formatCurrency(grandTotal, { currency: "CLP", locale: "es-CL", noDecimals: true })}
              </TableCell>
              {!isReadOnly && <TableCell className="h-12 border-emerald-100 border-t-2" />}
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}
