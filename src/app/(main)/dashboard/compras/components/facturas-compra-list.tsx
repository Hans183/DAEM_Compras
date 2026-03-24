"use client";

import { useCallback, useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
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

const facturaSchema = z.object({
  factura: z.string().min(1, "El número de factura es requerido"),
  monto: z.number().min(0, "El monto debe ser positivo"),
  fecha: z.string().min(1, "La fecha es requerida"),
  documento: z.instanceof(File).optional(),
});

type FacturaFormValues = z.infer<typeof facturaSchema>;

interface FacturasCompraListProps {
  compraId: string;
  onUpdate: () => void;
  canEdit: boolean;
}

export function FacturasCompraList({ compraId, onUpdate, canEdit }: FacturasCompraListProps) {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [editingFactura, setEditingFactura] = useState<Factura | null>(null);

  const form = useForm<FacturaFormValues>({
    resolver: zodResolver(facturaSchema),
    defaultValues: {
      factura: "",
      monto: 0,
      fecha: new Date().toISOString().split("T")[0],
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
    if (compraId) loadFacturas();
  }, [compraId, loadFacturas]);

  const onSubmit = async (data: FacturaFormValues) => {
    setIsSaving(true);
    try {
      if (editingFactura) {
        await updateFactura(editingFactura.id, data);
        toast.success("Factura actualizada");
        setEditingFactura(null);
      } else {
        await createFactura({ compra: compraId, ...data });
        toast.success("Factura agregada");
      }
      form.reset({ factura: "", monto: 0, fecha: new Date().toISOString().split("T")[0] });
      await loadFacturas();
      onUpdate();
    } catch (error) {
      console.error("Error saving factura:", error);
      toast.error("Error al guardar factura");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (f: Factura) => {
    setEditingFactura(f);
    form.reset({
      factura: f.factura,
      monto: f.monto,
      fecha: f.fecha ? f.fecha.substring(0, 10) : new Date().toISOString().split("T")[0],
    });
  };

  const handleCancelEdit = () => {
    setEditingFactura(null);
    form.reset({ factura: "", monto: 0, fecha: new Date().toISOString().split("T")[0] });
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      await deleteFactura(id);
      toast.success("Factura eliminada");
      await loadFacturas();
      onUpdate();
    } catch (error) {
      console.error("Error deleting factura:", error);
      toast.error("Error al eliminar factura");
    } finally {
      setIsDeleting(null);
    }
  };

  const totalMonto = facturas.reduce((sum, f) => sum + f.monto, 0);

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
          Total: $ {new Intl.NumberFormat("es-CL").format(totalMonto)}
        </Badge>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° Factura</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead className="w-[80px]">Adjunto</TableHead>
              {canEdit && <TableHead className="w-[100px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {facturas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canEdit ? 5 : 4} className="h-20 text-center text-muted-foreground text-sm">
                  No hay facturas registradas.
                </TableCell>
              </TableRow>
            ) : (
              facturas.map((f) => (
                <TableRow key={f.id} className={editingFactura?.id === f.id ? "bg-muted/50" : ""}>
                  <TableCell className="font-medium">{f.factura}</TableCell>
                  <TableCell>{f.fecha ? f.fecha.substring(0, 10).split("-").reverse().join("/") : "-"}</TableCell>
                  <TableCell>$ {new Intl.NumberFormat("es-CL").format(f.monto)}</TableCell>
                  <TableCell>
                    {f.documento ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const url = getFacturaFileUrl(f, f.documento as string);
                          if (url) window.open(url, "_blank");
                        }}
                        title="Ver Adjunto"
                      >
                        <ExternalLink className="h-4 w-4 text-blue-500" />
                      </Button>
                    ) : (
                      <span className="block text-center text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(f)}
                        className="mr-1"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={isDeleting === f.id}
                        onClick={() => handleDelete(f.id)}
                        title="Eliminar"
                      >
                        {isDeleting === f.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
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
            <h5 className="font-semibold text-muted-foreground text-xs uppercase">
              {editingFactura ? "Editar Factura" : "Agregar Nueva Factura"}
            </h5>
            {editingFactura && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancelEdit}
                className="h-6 text-muted-foreground text-xs hover:text-foreground"
              >
                Cancelar Edición
              </Button>
            )}
          </div>
          <Form {...form}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="factura"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">N° Factura</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="FAC-123" className="h-9 text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fecha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Fecha</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" className="h-9 text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="monto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Monto</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          className="h-9 text-xs"
                          placeholder="0"
                          value={field.value ? new Intl.NumberFormat("es-CL").format(field.value) : ""}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\./g, "");
                            if (raw === "" || /^\d+$/.test(raw)) {
                              field.onChange(raw === "" ? 0 : Number(raw));
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="documento"
                render={({ field: { value: _v, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel className="text-xs">
                      {editingFactura?.documento ? "Cambiar Adjunto" : "Adjunto"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="file"
                        accept=".pdf,.jpg,.png"
                        className="h-9 text-xs"
                        onChange={(e) => onChange(e.target.files?.[0])}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={isSaving}
                  className="h-9 px-8"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit(onSubmit)(e);
                  }}
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : editingFactura ? (
                    <Pencil className="mr-2 h-4 w-4" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  {editingFactura ? "Actualizar Factura" : "Agregar Factura"}
                </Button>
              </div>
            </div>
          </Form>
        </div>
      )}
    </div>
  );
}
