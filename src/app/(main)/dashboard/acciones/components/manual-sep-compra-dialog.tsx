"use client";

import { useContext, useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Loader2, Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { AuthContext } from "@/contexts/auth-context";
import pb from "@/lib/pocketbase";
import { cn } from "@/lib/utils";
import { createCompra } from "@/services/compras.service";
import { createOrdenCompra } from "@/services/ordenes-compra.service";
import { getRequirentes } from "@/services/requirentes.service";
import { getSubvenciones } from "@/services/subvenciones.service";
import type { Accion } from "@/types/accion";
import type { Requirente } from "@/types/requirente";

const formSchema = z.object({
  descripcion: z.string().min(1, "La descripción es requerida"),
  numero_ordinario: z.coerce.number().min(1, "El número ordinario es requerido"),
  adjunta_ordinario: z.any().optional(),
  unidad_requirente: z.string().min(1, "La unidad requirente es requerida"),
  estado: z.enum(["Entregado", "Comprado", "Facturado"]),
  decreto_pago: z.string().optional(),
  fecha_pago: z.string().optional(),
  ordenes: z
    .array(
      z.object({
        oc: z.string().min(1, "El número de OC es requerido"),
        oc_fecha: z.string().min(1, "La fecha de OC es requerida"),
        oc_valor: z.coerce.number().min(0, "El valor debe ser positivo"),
        plazo_entrega: z.date().optional(),
        oc_adjunto: z.any().optional(),
      }),
    )
    .min(1, "Debe agregar al menos una Orden de Compra"),
});

interface ManualSepCompraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  accion: Accion;
}

export function ManualSepCompraDialog({ open, onOpenChange, onSuccess, accion }: ManualSepCompraDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [requirentes, setRequirentes] = useState<Requirente[]>([]);
  const [sepSubvencionId, setSepSubvencionId] = useState<string | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const isSep = user?.role.includes("SEP");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      descripcion: "",
      numero_ordinario: 0,
      unidad_requirente: accion.establecimiento || "",
      estado: "Comprado",
      decreto_pago: "",
      fecha_pago: "",
      ordenes: [
        {
          oc: "",
          oc_fecha: new Date().toISOString().split("T")[0],
          oc_valor: 0,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "ordenes",
  });

  useEffect(() => {
    const loadInitialData = async () => {
      setLoadingInitial(true);
      try {
        const [reqsResult, subsResult] = await Promise.all([
          getRequirentes({ perPage: 500, sort: "nombre", sep_filter: true }),
          getSubvenciones({ search: "SEP", perPage: 50 }),
        ]);

        setRequirentes(reqsResult.items);

        const foundSep = subsResult.items.find(
          (s) => s.nombre.toLowerCase().includes("sep") || s.descripcion?.toLowerCase().includes("sep"),
        );

        if (foundSep) {
          setSepSubvencionId(foundSep.id);
        } else {
          toast.error("No se encontró la subvención 'Ley SEP'");
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
        toast.error("Error al cargar datos iniciales");
      } finally {
        setLoadingInitial(false);
      }
    };

    if (open) {
      loadInitialData();
      form.reset({
        descripcion: "",
        numero_ordinario: 0,
        unidad_requirente: accion.establecimiento || "",
        estado: "Comprado",
        decreto_pago: "",
        fecha_pago: "",
        ordenes: [
          {
            oc: "",
            oc_fecha: new Date().toISOString().split("T")[0],
            oc_valor: 0,
          },
        ],
      });
    }
  }, [open, accion, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!sepSubvencionId) {
      toast.error("ID de subvención SEP no encontrado");
      return;
    }

    setIsSaving(true);
    try {
      const currentUserId = pb.authStore.model?.id;

      // 1. Calculate total values for budget (optional but good practice)
      const totalOcValor = values.ordenes.reduce((acc, current) => acc + current.oc_valor, 0);

      // 2. Create Compra
      const compraRecord = await createCompra({
        descripcion: values.descripcion,
        numero_ordinario: values.numero_ordinario,
        adjunta_ordinario: values.adjunta_ordinario?.[0],
        unidad_requirente: values.unidad_requirente,
        estado: values.estado,
        subvencion: sepSubvencionId,
        accion: accion.id,
        comprador: currentUserId,
        presupuesto: totalOcValor,
        fecha_inicio: values.ordenes[0]?.oc_fecha || new Date().toISOString().split("T")[0],
        decreto_pago: values.decreto_pago,
        fecha_pago: values.fecha_pago,
      });

      // 3. Create Ordenes de Compra
      await Promise.all(
        values.ordenes.map((oc) =>
          createOrdenCompra({
            compra: compraRecord.id,
            oc: oc.oc,
            oc_fecha: oc.oc_fecha,
            oc_valor: oc.oc_valor,
            oc_adjunto: oc.oc_adjunto?.[0],
            plazo_entrega: oc.plazo_entrega ? format(oc.plazo_entrega, "yyyy-MM-dd") : undefined,
          }),
        ),
      );

      toast.success("Compra SEP y OCs agregadas correctamente");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding manual SEP compra:", error);
      toast.error("Error al guardar la compra");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-7xl">
        <DialogHeader>
          <DialogTitle>Agregar Compra SEP Manual</DialogTitle>
        </DialogHeader>

        {loadingInitial ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="col-span-2 space-y-4 border-b pb-4">
                  <h3 className="font-semibold text-sm">Información de la Compra</h3>

                  <FormItem>
                    <FormLabel>Subvención</FormLabel>
                    <FormControl>
                      <Input value="Ley SEP" disabled className="bg-muted" />
                    </FormControl>
                  </FormItem>

                  <FormField
                    control={form.control}
                    name="descripcion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Descripción de la compra" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="numero_ordinario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número Ordinario</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="adjunta_ordinario"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem>
                      <FormLabel>Adjuntar Ordinario</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept=".pdf,.doc,.docx,image/*"
                          onChange={(e) => onChange(e.target.files)}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unidad_requirente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidad Requirente</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione unidad" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {requirentes.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.nombre}
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
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isSep ? (
                            <>
                              <SelectItem value="Comprado">Comprado</SelectItem>
                              <SelectItem value="Facturado">Facturado</SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="Comprado">Comprado</SelectItem>
                              <SelectItem value="Entregado">Entregado</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="col-span-2 py-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-semibold text-sm">Órdenes de Compra</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        append({
                          oc: "",
                          oc_fecha: new Date().toISOString().split("T")[0],
                          oc_valor: 0,
                        })
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar OC
                    </Button>
                  </div>

                  <div className="mt-4 space-y-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="relative rounded-md border bg-muted/30 p-4 pt-8">
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8 text-destructive"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                          <FormField
                            control={form.control}
                            name={`ordenes.${index}.oc`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Identificador OC</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ej: 1234-56-CM23" className="h-9 text-xs" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`ordenes.${index}.oc_valor`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Monto</FormLabel>
                                <FormControl>
                                  <Input
                                    type="text"
                                    className="h-9 text-xs"
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
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`ordenes.${index}.oc_fecha`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Fecha OC</FormLabel>
                                <FormControl>
                                  <Input type="date" className="h-9 text-xs" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`ordenes.${index}.plazo_entrega`}
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel className="text-xs">Plazo Entrega</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant={"outline"}
                                        className={cn(
                                          "h-9 w-full pl-3 text-left font-normal text-xs",
                                          !field.value && "text-muted-foreground",
                                        )}
                                      >
                                        {field.value ? (
                                          format(field.value, "PPP", { locale: es })
                                        ) : (
                                          <span>Seleccionar fecha</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={field.value}
                                      onSelect={field.onChange}
                                      disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`ordenes.${index}.oc_adjunto`}
                            render={({ field: { onChange, value, ...field } }) => (
                              <FormItem className="md:col-span-2 lg:col-span-4">
                                <FormLabel className="text-xs">Documento OC (Adjunto)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="file"
                                    accept=".pdf,.doc,.docx,image/*"
                                    className="h-9 text-xs"
                                    onChange={(e) => onChange(e.target.files)}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-span-2">
                  <Separator className="my-2" />
                </div>

                <div className="col-span-2 space-y-4 pt-2">
                  <h3 className="font-semibold text-sm">Información de Pago</h3>
                </div>

                <FormField
                  control={form.control}
                  name="decreto_pago"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Decreto de Pago</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 1234" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fecha_pago"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Pago</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving || !sepSubvencionId}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar Compra SEP
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
