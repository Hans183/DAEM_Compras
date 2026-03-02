"use client";

import { useCallback, useEffect, useState } from "react";

import { format, parseISO } from "date-fns";
import { Calendar, ChevronDown, ChevronRight, FileText, Loader2, Package, User as UserIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getRecepcionesByCompra, getRecepcionFileUrl } from "@/services/recepciones.service";
import type { Recepcion } from "@/types/recepcion";

interface RecepcionesListProps {
  compraId: string;
  refreshTrigger?: number; // Prop to trigger refresh from parent
}

export function RecepcionesList({ compraId }: RecepcionesListProps) {
  const [recepciones, setRecepciones] = useState<Recepcion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const fetchRecepciones = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getRecepcionesByCompra(compraId);
      setRecepciones(data);
      // Auto expand if there's only one? No, let's keep it collapsed by default or expand recent.
      if (data.length > 0) {
        setExpandedIds([data[0].id]); // Expand latest by default
      }
    } catch (error) {
      console.error("Error fetching recepciones:", error);
    } finally {
      setIsLoading(false);
    }
  }, [compraId]);

  useEffect(() => {
    if (compraId) {
      fetchRecepciones();
    }
  }, [compraId, fetchRecepciones]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (recepciones.length === 0) {
    return (
      <div className="rounded-md border border-dashed bg-muted/30 p-8 text-center">
        <Package className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-muted-foreground text-sm">No hay recepciones registradas para esta compra.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recepciones.map((recepcion) => (
        <Card key={recepcion.id} className="overflow-hidden">
          <CardHeader className="bg-muted/10 p-4 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-background font-mono text-sm">
                  {recepcion.folio}
                </Badge>
                <span className="flex items-center gap-1 text-muted-foreground text-xs">
                  <Calendar className="h-3 w-3" />
                  {format(parseISO(recepcion.fecha_recepcion), "dd/MM/yyyy")}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => toggleExpand(recepcion.id)} className="h-8 w-8 p-0">
                {expandedIds.includes(recepcion.id) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-muted-foreground text-sm">
              <div className="flex items-center gap-1">
                <span className="font-medium text-foreground">{recepcion.documento_tipo}</span>
                {recepcion.documento_numero && <span>#{recepcion.documento_numero}</span>}
              </div>
              {recepcion.expand?.recepcionado_por && (
                <div className="flex items-center gap-1">
                  <UserIcon className="h-3 w-3" />
                  <span>{recepcion.expand.recepcionado_por.name}</span>
                </div>
              )}
            </div>
          </CardHeader>

          <Collapsible open={expandedIds.includes(recepcion.id)}>
            <CollapsibleContent>
              <CardContent className="p-0">
                {recepcion.observaciones && (
                  <div className="border-b bg-yellow-50/50 px-4 py-2 text-sm">
                    <span className="font-semibold text-yellow-700">Obs:</span> {recepcion.observaciones}
                  </div>
                )}

                <div className="px-4 py-2">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="h-8 w-[80px]">Cant.</TableHead>
                        <TableHead className="h-8">Detalle</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="text-sm">
                      {recepcion.expand?.["recepcion_detalles(recepcion)"]?.map((detalle) => (
                        <TableRow key={detalle.id} className="hover:bg-transparent">
                          <TableCell className="py-2 font-medium">{detalle.cantidad}</TableCell>
                          <TableCell className="py-2">{detalle.detalle}</TableCell>
                        </TableRow>
                      ))}
                      {(!recepcion.expand?.["recepcion_detalles(recepcion)"] ||
                        recepcion.expand?.["recepcion_detalles(recepcion)"].length === 0) && (
                        <TableRow>
                          <TableCell colSpan={2} className="py-4 text-center text-muted-foreground">
                            Sin detalles
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {recepcion.adjuntos && recepcion.adjuntos.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto border-t bg-muted/10 px-4 py-2">
                    {recepcion.adjuntos.map((adjunto) => (
                      <Button
                        key={`${recepcion.id}-${adjunto}`}
                        variant="outline"
                        size="sm"
                        className="flex h-7 items-center gap-1 text-xs"
                        onClick={() => {
                          const url = getRecepcionFileUrl(recepcion, adjunto);
                          if (url) window.open(url, "_blank");
                        }}
                      >
                        <FileText className="h-3 w-3 text-blue-500" />
                        {adjunto}
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}
    </div>
  );
}
