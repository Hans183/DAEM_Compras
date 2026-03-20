"use client";

import { useCallback, useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ExternalLink, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  createFactura,
  deleteFactura,
  getFacturaFileUrl,
  getFacturasByCompra,
  updateFactura,
} from "@/services/facturas.service";
import type { Factura } from "@/types/factura";
import { parseToLocalDate } from "@/utils/date-utils";

const facturaSchema = z.object({
  factura: z.string().min(1, "El número de factura es requerido"),
  fecha: z.string().min(1, "La fecha es requerida"),
  monto: z.number().min(0, "El monto debe ser positivo"),
  documento: z.instanceof(File).optional(),
});

type FacturaFormValues = z.infer<typeof facturaSchema>;

interface FacturasListProps {
  compraId: string;
  onUpdate?: () => void;
  canEdit: boolean;
}

export function FacturasList({ compraId, onUpdate, canEdit }: FacturasListProps) {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [editingFactura, setEditingFactura] = useState<Factura | null>(null);

  const form = useForm<FacturaFormValues>({
    resolver: zodResolver(facturaSchema),
    defaultValues: {
      factura: "",
      fecha: new Date().toISOString().split("T")[0],
      monto: 0,
    },
  });

  const loadFacturas = useCallback(async () => {
    try {
      const result = await getFacturasByCompra(compraId);
      setFacturas(result.items);
    } catch (error) {
      console.error("Error loading facturas:", error);
      toast.error("Error al cargar facturas");
    } finally {
      setIsLoading(false);
    }
  }, [compraId]);

  useEffect(() => {
    if (compraId) {
      loadFacturas();
    }
  }, [compraId, loadFacturas]);

  const onSubmit = async (data: FacturaFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingFactura) {
        await updateFactura(editingFactura.id, {
          ...data,
          compra: compraId,
        });
        toast.success("Factura actualizada");
        setEditingFactura(null);
      } else {
        await createFactura({
          compra: compraId,
          ...data,
        });
        toast.success("Factura agregada");
      }

      form.reset({
        factura: "",
        fecha: new Date().toISOString().split("T")[0],
        monto: 0,
      });
      await loadFacturas();
      onUpdate?.();
    } catch (error) {
      console.error("Error saving factura:", error);
      toast.error("Error al guardar factura");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (factura: Factura) => {
    setEditingFactura(factura);
    form.reset({
      factura: factura.factura,
      fecha: factura.fecha ? format(parseToLocalDate(factura.fecha) || new Date(), "yyyy-MM-dd") : "",
      monto: factura.monto,
    });
  };

  const handleCancelEdit = () => {
    setEditingFactura(null);
    form.reset({
      factura: "",
      fecha: new Date().toISOString().split("T")[0],
      monto: 0,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar esta factura?")) return;
    setIsDeleting(id);
    try {
      await deleteFactura(id);
      toast.success("Factura eliminada");
      await loadFacturas();
      onUpdate?.();
    } catch (error) {
      console.error("Error deleting factura:", error);
      toast.error("Error al eliminar factura");
    } finally {
      setIsDeleting(null);
    }
  };

  const totalMonto = facturas.reduce((sum, item) => sum + (item.monto || 0), 0);

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">Facturas Asociadas</h4>
        <Badge variant="outline" className="text-xs">
          Total Facturado: $ {new Intl.NumberFormat("es-CL").format(totalMonto)}
        </Badge>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">N° Factura</TableHead>
              <TableHead className="text-xs">Fecha</TableHead>
              <TableHead className="text-xs">Monto</TableHead>
              <TableHead className="w-[80px] text-xs text-center">Adjunto</TableHead>
              {canEdit && <TableHead className="w-[100px] text-xs text-right" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {facturas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canEdit ? 5 : 4} className="h-20 text-center text-muted-foreground text-xs">
                  No hay facturas registradas.
                </TableCell>
              </TableRow>
            ) : (
              facturas.map((f) => (
                <TableRow key={f.id} className={editingFactura?.id === f.id ? "bg-muted/50" : ""}>
                  <TableCell className="text-xs font-medium">{f.factura}</TableCell>
                  <TableCell className="text-xs">
                    {f.fecha ? format(parseToLocalDate(f.fecha) || new Date(), "dd/MM/yyyy") : "-"}
                  </TableCell>
                  <TableCell className="text-xs">$ {new Intl.NumberFormat("es-CL").format(f.monto || 0)}</TableCell>
                  <TableCell className="text-center">
                    {f.documento ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          const url = getFacturaFileUrl(f, f.documento as string);
                          if (url) window.open(url, "_blank");
                        }}
                        title="Ver Factura"
                      >
                        <ExternalLink className="h-4 w-4 text-blue-500" />
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-[10px]">-</span>
                    )}
                  </TableCell>
                  {canEdit && (
                    <TableCell className="text-right whitespace-nowrap">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 mr-1"
                        onClick={() => handleEditClick(f)}
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={isDeleting === f.id}
                        onClick={() => handleDelete(f.id)}
                        title="Eliminar"
                      >
                        {isDeleting === f.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {canEdit && (
        <div className="rounded-md border bg-muted/30 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h5 className="font-semibold text-muted-foreground text-[10px] uppercase">
              {editingFactura ? "Editar Factura" : "Agregar Nueva Factura"}
            </h5>
            {editingFactura && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancelEdit}
                className="h-6 text-muted-foreground text-[10px] hover:text-foreground"
              >
                Cancelar Edición
              </Button>
            )}
          </div>
          <Form {...form}>
            <form className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="factura"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px]">N° Factura</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="F-123" className="h-8 text-xs" />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fecha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px]">Fecha</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" className="h-8 text-xs" />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="monto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px]">Monto</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          className="h-8 text-xs"
                          placeholder="0"
                          {...field}
                          value={field.value ? new Intl.NumberFormat("es-CL").format(field.value) : ""}
                          onChange={(e) => {
                            const rawValue = e.target.value.replace(/\./g, "");
                            if (rawValue === "" || /^\d+$/.test(rawValue)) {
                              field.onChange(rawValue === "" ? 0 : Number(rawValue));
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-end gap-4 justify-between">
                <div className="flex-1">
                  <FormField
                    control={form.control}
                    name="documento"
                    render={({ field: { value, onChange, ...field } }) => (
                      <FormItem>
                        <FormLabel className="text-[10px]">Documento (Adjunto)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="file"
                            accept=".pdf,.jpg,.png"
                            className="h-8 text-xs"
                            onChange={(e) => onChange(e.target.files?.[0])}
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={isSubmitting}
                  className="h-8 px-6 text-xs"
                  onClick={form.handleSubmit(onSubmit)}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : editingFactura ? (
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                  ) : (
                    <Plus className="mr-2 h-3.5 w-3.5" />
                  )}
                  {editingFactura ? "Actualizar" : "Agregar"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}
    </div>
  );
}
