"use client";

import { Fragment, useState } from "react";

import { ChevronDown, ChevronRight, Edit, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Accion } from "@/types/accion";
import type { Compra } from "@/types/compra";

import { AccionDialog } from "./accion-dialog";
import { DeleteAccionDialog } from "./delete-accion-dialog";

interface AccionesTableProps {
  data: Accion[];
  usageMap: Record<string, number>;
  allCompras: Compra[];
  onDataChanged: () => void;
}

export function AccionesTable({ data, usageMap, allCompras, onDataChanged }: AccionesTableProps) {
  const [editingAccion, setEditingAccion] = useState<Accion | null>(null);
  const [deletingAccion, setDeletingAccion] = useState<Accion | null>(null);
  const [expandedActionId, setExpandedActionId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedActionId(expandedActionId === id ? null : id);
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]" />
              <TableHead>Nombre</TableHead>
              <TableHead>Establecimiento</TableHead>
              <TableHead>Dimensión</TableHead>
              <TableHead>Monto SEP</TableHead>
              <TableHead>Valor Acción</TableHead>
              <TableHead className="w-[150px]">% Uso</TableHead>
              <TableHead className="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No se encontraron acciones.
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => {
                const valorAccion = item.valor_accion || 0;
                const used = usageMap[item.id] || 0;
                const percentage = valorAccion > 0 ? (used / valorAccion) * 100 : 0;
                const isExpanded = expandedActionId === item.id;

                // Filter compras related to this action
                const relatedCompras = allCompras.filter((c) => c.accion === item.id);

                // Color logic
                let progressColor = "bg-green-500";
                if (percentage >= 100) progressColor = "bg-red-500";
                else if (percentage >= 80) progressColor = "bg-yellow-500";
                else if (percentage >= 50) progressColor = "bg-blue-500";

                return (
                  <Fragment key={item.id}>
                    <TableRow
                      className={cn("cursor-pointer hover:bg-muted/50 transition-colors", isExpanded && "bg-muted/30")}
                      onClick={() => toggleExpand(item.id)}
                    >
                      <TableCell
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(item.id);
                        }}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate" title={item.nombre}>
                        {item.nombre}
                      </TableCell>
                      <TableCell>{item.expand?.establecimiento?.nombre || "N/A"}</TableCell>
                      <TableCell>{item.expand?.dimension?.nombre || item.dimension || "N/A"}</TableCell>
                      <TableCell>${item.monto_sep?.toLocaleString("es-CL")}</TableCell>
                      <TableCell>${valorAccion.toLocaleString("es-CL")}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 w-full">
                          <span className="text-xs text-muted-foreground text-right">{percentage.toFixed(1)}%</span>
                          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                            <div
                              className={`h-full ${progressColor} transition-all duration-300`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setEditingAccion(item)}>
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
                    {isExpanded && (
                      <TableRow className="bg-muted/20 hover:bg-muted/20">
                        <TableCell colSpan={8} className="p-0">
                          <div className="p-4 border-t animate-in fade-in slide-in-from-top-1 duration-200">
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                              Compras Relacionadas ({relatedCompras.length})
                            </h4>
                            {relatedCompras.length === 0 ? (
                              <div className="text-sm text-muted-foreground italic py-2">
                                No hay compras vinculadas a esta acción.
                              </div>
                            ) : (
                              <div className="rounded-md border bg-background">
                                <Table>
                                  <TableHeader className="bg-muted/50">
                                    <TableRow>
                                      <TableHead className="text-xs">Descripción</TableHead>
                                      <TableHead className="text-xs">N° Oficio</TableHead>
                                      <TableHead className="text-xs">OC</TableHead>
                                      <TableHead className="text-xs">Comprador</TableHead>
                                      <TableHead className="text-xs text-right">Monto</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {relatedCompras.map((compra) => (
                                      <TableRow key={compra.id} className="hover:bg-muted/30">
                                        <TableCell
                                          className="text-xs max-w-[300px] truncate"
                                          title={compra.descripcion}
                                        >
                                          {compra.descripcion}
                                        </TableCell>
                                        <TableCell className="text-xs">{compra.numero_ordinario || "---"}</TableCell>
                                        <TableCell className="text-xs">
                                          {compra.expand?.["ordenes_compra(compra)"]?.map((oc) => oc.oc).join(", ") ||
                                            "---"}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                          {compra.expand?.comprador?.name || "---"}
                                        </TableCell>
                                        <TableCell className="text-xs text-right font-medium">
                                          ${compra.presupuesto?.toLocaleString("es-CL")}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
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
