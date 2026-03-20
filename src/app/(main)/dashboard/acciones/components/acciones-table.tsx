"use client";

import { Fragment, useContext, useState } from "react";

import { ChevronDown, ChevronRight, Edit, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AuthContext } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import type { Accion } from "@/types/accion";
import type { Compra } from "@/types/compra";

import { CompraDialog } from "../../compras/components/compra-dialog";
import { AccionDialog } from "./accion-dialog";
import { DeleteAccionDialog } from "./delete-accion-dialog";
import { ManualSepCompraDialog } from "./manual-sep-compra-dialog";

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
  const [addingSepTo, setAddingSepTo] = useState<Accion | null>(null);
  const [editingCompra, setEditingCompra] = useState<Compra | null>(null);

  const authContext = useContext(AuthContext);
  const currentUser = authContext?.user || null;

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
                      className={cn("cursor-pointer transition-colors hover:bg-muted/50", isExpanded && "bg-muted/30")}
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
                      <TableCell className="max-w-[200px] truncate font-medium" title={item.nombre}>
                        {item.nombre}
                      </TableCell>
                      <TableCell>{item.expand?.establecimiento?.nombre || "N/A"}</TableCell>
                      <TableCell>{item.expand?.dimension?.nombre || item.dimension || "N/A"}</TableCell>
                      <TableCell>${item.monto_sep?.toLocaleString("es-CL")}</TableCell>
                      <TableCell>${valorAccion.toLocaleString("es-CL")}</TableCell>
                      <TableCell>
                        <div className="flex w-full flex-col gap-1">
                          <span className="text-right text-muted-foreground text-xs">{percentage.toFixed(1)}%</span>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
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
                          <div className="fade-in slide-in-from-top-1 animate-in border-t p-4 duration-200">
                            <div className="mb-3 flex items-center justify-between">
                              <h4 className="flex items-center gap-2 font-semibold text-sm">
                                Compras Relacionadas ({relatedCompras.length})
                              </h4>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 border-primary border-dashed text-primary hover:bg-primary/5"
                                onClick={() => setAddingSepTo(item)}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                AGREGAR COMPRA SEP
                              </Button>
                            </div>
                            {relatedCompras.length === 0 ? (
                              <div className="py-2 text-muted-foreground text-sm italic">
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
                                      <TableHead className="text-right text-xs">Monto</TableHead>
                                      <TableHead className="w-[50px] text-xs">Acción</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {relatedCompras.map((compra) => (
                                      <TableRow key={compra.id} className="hover:bg-muted/30">
                                        <TableCell
                                          className="max-w-[300px] truncate text-xs"
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
                                        <TableCell className="text-right font-medium text-xs">
                                          ${compra.presupuesto?.toLocaleString("es-CL")}
                                        </TableCell>
                                        <TableCell>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => setEditingCompra(compra)}
                                          >
                                            <Edit className="h-3.5 w-3.5" />
                                          </Button>
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

      {addingSepTo && (
        <ManualSepCompraDialog
          open={!!addingSepTo}
          onOpenChange={(open) => !open && setAddingSepTo(null)}
          accion={addingSepTo}
          onSuccess={() => {
            setAddingSepTo(null);
            onDataChanged();
          }}
        />
      )}

      {editingCompra && (
        <CompraDialog
          open={!!editingCompra}
          onOpenChange={(open) => !open && setEditingCompra(null)}
          compra={editingCompra}
          currentUser={currentUser}
          onSuccess={() => {
            setEditingCompra(null);
            onDataChanged();
          }}
        />
      )}
    </>
  );
}
