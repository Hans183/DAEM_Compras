"use client";

import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createIngresoMensualSep, updateIngresoMensualSep } from "@/services/ingresos-mensuales-sep.service";
import { getRequirentes } from "@/services/requirentes.service";
import type { IngresoMensualSep, Mes } from "@/types/ingreso-mensual-sep";
import type { Requirente } from "@/types/requirente";

const MESES: Mes[] = [
  "Saldo Inicial",
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const formSchema = z.object({
  requirente: z.string().min(1, "El establecimiento es requerido"),
  mes: z.enum(
    [
      "Saldo Inicial",
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ],
    {
      required_error: "El mes es requerido",
    },
  ),
  anio: z.number().int().min(2000, "Año inválido").max(2100, "Año inválido"),
  prioritarios: z.number().min(0, "Debe ser positivo"),
  preferentes: z.number().min(0, "Debe ser positivo"),
});

type FormValues = z.infer<typeof formSchema>;

interface IngresoMensualSepDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ingreso?: IngresoMensualSep | null;
  onSuccess: () => void;
}

export function IngresoMensualSepDialog({ open, onOpenChange, ingreso, onSuccess }: IngresoMensualSepDialogProps) {
  const [loading, setLoading] = useState(false);
  const [requirentes, setRequirentes] = useState<Requirente[]>([]);

  const currentYear = new Date().getFullYear();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      requirente: "",
      mes: "Enero",
      anio: currentYear,
      prioritarios: 0,
      preferentes: 0,
    },
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await getRequirentes({ perPage: 100, sort: "nombre", sep_filter: true });
        setRequirentes(result.items);
      } catch (error) {
        console.error("Error loading failover data:", error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (open) {
      if (ingreso) {
        form.reset({
          requirente: ingreso.requirente,
          mes: ingreso.mes,
          anio: ingreso.anio || currentYear,
          prioritarios: ingreso.prioritarios,
          preferentes: ingreso.preferentes,
        });
      } else {
        form.reset({
          requirente: "",
          mes: MESES[new Date().getMonth() + 1] || "Enero",
          anio: currentYear,
          prioritarios: 0,
          preferentes: 0,
        });
      }
    }
  }, [ingreso, form, currentYear, open]);

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      if (ingreso) {
        await updateIngresoMensualSep(ingreso.id, values);
        toast.success("Ingreso actualizado correctamente");
      } else {
        await createIngresoMensualSep(values);
        toast.success("Ingreso creado correctamente");
      }
      form.reset();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving ingreso:", error);
      toast.error("Error al guardar el ingreso");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{ingreso ? "Editar Ingreso" : "Nuevo Ingreso Mensual SEP"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="requirente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Establecimiento</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar establecimiento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {requirentes.map((req) => (
                        <SelectItem key={req.id} value={req.id}>
                          {req.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="mes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mes</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar mes" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MESES.map((mes) => (
                          <SelectItem key={mes} value={mes}>
                            {mes}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="anio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Año</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="prioritarios"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioritarios</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute top-2.5 left-3 text-muted-foreground text-xs">$</span>
                        <Input
                          type="text"
                          className="pl-6"
                          {...field}
                          value={field.value !== 0 ? new Intl.NumberFormat("es-CL").format(field.value) : ""}
                          onChange={(e) => {
                            const rawValue = e.target.value.replace(/\./g, "").replace(/\$/g, "");
                            if (rawValue === "" || /^\d+$/.test(rawValue)) {
                              field.onChange(rawValue === "" ? 0 : Number(rawValue));
                            }
                          }}
                          onFocus={() => {
                            if (field.value === 0) {
                              field.onChange("");
                            }
                          }}
                          onPaste={(e) => {
                            const pasteData = e.clipboardData.getData("text/plain");
                            if (pasteData.includes("\t")) {
                              const parts = pasteData.split("\t");
                              if (parts.length >= 2) {
                                const prioVal = parts[0].replace(/\./g, "").replace(/\$/g, "").trim();
                                const prefVal = parts[1].replace(/\./g, "").replace(/\$/g, "").trim();

                                if (!Number.isNaN(Number(prioVal)) && !Number.isNaN(Number(prefVal))) {
                                  e.preventDefault();
                                  form.setValue("prioritarios", Number(prioVal));
                                  form.setValue("preferentes", Number(prefVal));
                                }
                              }
                            }
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="preferentes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferentes</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute top-2.5 left-3 text-muted-foreground text-xs">$</span>
                        <Input
                          type="text"
                          className="pl-6"
                          {...field}
                          value={field.value !== 0 ? new Intl.NumberFormat("es-CL").format(field.value) : ""}
                          onChange={(e) => {
                            const rawValue = e.target.value.replace(/\./g, "").replace(/\$/g, "");
                            if (rawValue === "" || /^\d+$/.test(rawValue)) {
                              field.onChange(rawValue === "" ? 0 : Number(rawValue));
                            }
                          }}
                          onFocus={() => {
                            if (field.value === 0) {
                              field.onChange("");
                            }
                          }}
                          onPaste={(e) => {
                            const pasteData = e.clipboardData.getData("text/plain");
                            if (pasteData.includes("\t")) {
                              const parts = pasteData.split("\t");
                              if (parts.length >= 2) {
                                const prioVal = parts[0].replace(/\./g, "").replace(/\$/g, "").trim();
                                const prefVal = parts[1].replace(/\./g, "").replace(/\$/g, "").trim();

                                if (!Number.isNaN(Number(prioVal)) && !Number.isNaN(Number(prefVal))) {
                                  e.preventDefault();
                                  form.setValue("prioritarios", Number(prioVal));
                                  form.setValue("preferentes", Number(prefVal));
                                }
                              }
                            }
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {ingreso ? "Actualizar" : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
