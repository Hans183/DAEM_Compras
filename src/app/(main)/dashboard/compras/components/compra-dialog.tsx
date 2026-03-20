"use client";

import { useEffect, useMemo, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { notifyBuyer } from "@/actions/send-email";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createCompra, updateCompra } from "@/services/compras.service";
import { getRequirentes } from "@/services/requirente.service";
import { getSubvenciones } from "@/services/subvenciones.service";
import { getUsers } from "@/services/users.service";
import type { Compra, EstadoCompra } from "@/types/compra";
import type { Requirente } from "@/types/requirente";
import type { Subvencion } from "@/types/subvencion";
import type { User } from "@/types/user";
import { getAvailableEstados, getEditableFields, isFieldEditable } from "@/utils/permissions";

import { type CompraFormValues, createCompraFormSchema } from "../schemas/compra-form.schema";
import { OrdenesCompraList } from "./ordenes-compra-list";

interface CompraDialogProps {
  compra?: Compra;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  currentUser: User | null;
  initialData?: Partial<Compra>;
  isDuplicate?: boolean;
}

export function CompraDialog({
  compra,
  open,
  onOpenChange,
  onSuccess,
  currentUser,
  initialData,
  isDuplicate,
}: CompraDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subvenciones, setSubvenciones] = useState<Subvencion[]>([]);
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [requirentes, setRequirentes] = useState<Requirente[]>([]);
  const [openRequirente, setOpenRequirente] = useState(false);
  const [_loadingData, setLoadingData] = useState(true);
  const isEditing = !!compra;

  // Determine available estados based on user role and current estado
  const availableEstados = currentUser
    ? getAvailableEstados(currentUser.role, compra?.estado as EstadoCompra | undefined)
    : [];

  // Create dynamic schema based on user role and context
  const formSchema = useMemo(
    () => createCompraFormSchema(currentUser?.role || ["Observador"], { isCreating: !isEditing }),
    [currentUser?.role, isEditing],
  );

  // Get editable fields for current user
  const editableFields = useMemo(() => getEditableFields(currentUser?.role || ["Observador"]), [currentUser?.role]);

  const form = useForm<CompraFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numero_ordinario: compra?.numero_ordinario || 0,
      unidad_requirente: compra?.unidad_requirente || "",
      comprador: compra?.comprador || "",
      descripcion: compra?.descripcion || "",
      //fecha_solicitud: compra?.fecha_solicitud ? new Date(compra.fecha_solicitud).toISOString().split('T')[0] : new Date().toLocaleDateString('en-CA'),
      fecha_inicio: compra?.fecha_inicio
        ? new Date(compra.fecha_inicio).toISOString().split("T")[0]
        : new Date().toLocaleDateString("en-CA"),

      subvencion: compra?.subvencion || "",
      estado: compra?.estado || (currentUser?.role.includes("SEP") ? "Iniciado" : "Asignado"),
      observacion: compra?.observacion || "",
      decreto_pago: compra?.decreto_pago || "",
      fecha_pago: compra?.fecha_pago ? new Date(compra.fecha_pago).toISOString().split("T")[0] : "",
    },
  });

  // Helper to check if field is required
  const isRequired = (fieldName: string) => {
    // En creación, solo los campos básicos son requeridos visualmente
    if (!isEditing) {
      return [
        "numero_ordinario",
        "unidad_requirente",
        "descripcion",
        "estado",
        "comprador",
        "fecha_solicitud",
        "fecha_inicio",
      ].includes(fieldName);
    }
    return editableFields.includes(fieldName as keyof CompraFormValues);
  };

  // ... useEffect loadData ...

  useEffect(() => {
    const loadData = async () => {
      // ... existing loadData logic ...
      try {
        const [subvencionesData, usuariosData, requirentesData] = await Promise.all([
          getSubvenciones({ perPage: 100 }),
          getUsers({ perPage: 100 }),
          getRequirentes({ perPage: 100, sort: "+nombre" }),
        ]);
        setSubvenciones(subvencionesData.items);
        setUsuarios(usuariosData.items);
        setRequirentes(requirentesData.items);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Error al cargar datos");
      } finally {
        setLoadingData(false);
      }
    };

    if (open) {
      loadData();
      form.reset({
        numero_ordinario: compra?.numero_ordinario || initialData?.numero_ordinario || 0,
        unidad_requirente: compra?.unidad_requirente || initialData?.unidad_requirente || "",
        comprador: compra?.comprador || "",
        descripcion: compra?.descripcion || "",
        fecha_inicio: compra?.fecha_inicio
          ? new Date(compra.fecha_inicio).toISOString().split("T")[0]
          : new Date().toLocaleDateString("en-CA"),

        presupuesto: compra?.presupuesto || 0,
        subvencion: compra?.subvencion || initialData?.subvencion || "",
        estado: compra?.estado || (currentUser?.role.includes("SEP") ? "Iniciado" : "Asignado"),
        adjunta_ordinario: undefined,
        observacion: compra?.observacion || "",
        decreto_pago: compra?.decreto_pago || "",
        fecha_pago: compra?.fecha_pago ? new Date(compra.fecha_pago).toISOString().split("T")[0] : "",
      });
    }
  }, [open, compra, form, initialData, currentUser?.role.includes]);

  const onSubmit = async (data: CompraFormValues) => {
    setIsSubmitting(true);

    try {
      let result: Compra;
      if (isEditing) {
        result = await updateCompra(compra.id, {
          numero_ordinario: data.numero_ordinario,
          unidad_requirente: data.unidad_requirente,
          comprador: data.comprador,
          descripcion: data.descripcion,
          fecha_inicio: data.fecha_inicio,

          presupuesto: data.presupuesto,
          subvencion: data.subvencion,
          estado: data.estado,
          adjunta_ordinario: data.adjunta_ordinario,
          observacion: data.observacion,
          decreto_pago: data.decreto_pago,
          fecha_pago: data.fecha_pago,
          usuario_modificador: currentUser?.name || currentUser?.email || "Usuario desconocido",
        });
        toast.success("Compra actualizada exitosamente");

        if (data.comprador && data.comprador !== compra.comprador) {
          const buyerEmail = result?.expand?.comprador?.email;
          const buyerName = result?.expand?.comprador?.name || "Usuario";
          const unitName = result?.expand?.unidad_requirente?.nombre || "Unidad Desconocida";

          if (buyerEmail) {
            await notifyBuyer({
              email: buyerEmail,
              buyerName: buyerName,
              numeroOrdinario: data.numero_ordinario || 0,
              unidadRequirente: unitName,
              description: data.descripcion || "",
            });
          }
        }
      } else {
        result = await createCompra({
          numero_ordinario: data.numero_ordinario,
          unidad_requirente: data.unidad_requirente,
          comprador: data.comprador,
          descripcion: data.descripcion,
          fecha_inicio: data.fecha_inicio,

          presupuesto: data.presupuesto,
          subvencion: data.subvencion,
          es_duplicada: isDuplicate,
          estado: data.estado,
          adjunta_ordinario: data.adjunta_ordinario,
          observacion: data.observacion,
          decreto_pago: data.decreto_pago,
          fecha_pago: data.fecha_pago,
          usuario_modificador: currentUser?.name || currentUser?.email || "Usuario desconocido",
        });
        toast.success("Compra creada exitosamente");

        if (data.comprador) {
          const selectedBuyer = usuarios.find((u) => u.id === data.comprador);
          const buyerEmail = selectedBuyer?.email;
          const buyerName = selectedBuyer?.name || result?.expand?.comprador?.name || "Usuario";
          const unitName = result?.expand?.unidad_requirente?.nombre || "Unidad Desconocida";

          if (buyerEmail) {
            await notifyBuyer({
              email: buyerEmail,
              buyerName: buyerName,
              numeroOrdinario: data.numero_ordinario || 0,
              unidadRequirente: unitName,
              description: data.descripcion || "",
            });
          }
        }
      }

      form.reset();
      onSuccess();
    } catch (error) {
      const err = error as { message?: string };
      console.error("Error saving compra:", err);
      toast.error(err.message || "Error al guardar compra");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* ... Content ... */}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          {/* ... Header ... */}
          <DialogTitle>{isEditing ? "Editar Compra" : "Crear Nueva Compra"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los datos de la compra."
              : "Complete los datos básicos para iniciar una solicitud de compra."}
          </DialogDescription>
        </DialogHeader>

        {currentUser && editableFields.length < 5 && (
          <Alert>
            <AlertDescription>
              Solo necesitas completar los campos marcados con <span className="text-red-500">*</span> según tus
              permisos.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* SECCIÓN: DATOS DE SOLICITUD */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Datos de Solicitud</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="numero_ordinario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Número Ordinario
                        {isRequired("numero_ordinario") && <span className="ml-1 text-red-500">*</span>}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="123"
                          disabled={!isFieldEditable("numero_ordinario", currentUser?.role || ["Observador"])}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fecha_inicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Fecha de Inicio
                        {isRequired("fecha_inicio") && <span className="ml-1 text-red-500">*</span>}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          disabled={!isFieldEditable("fecha_inicio", currentUser?.role || ["Observador"])}
                          {...field}
                          value={field.value ? new Date(field.value as string).toISOString().split("T")[0] : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Estado
                        {isRequired("estado") && <span className="ml-1 text-red-500">*</span>}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={
                          !currentUser ||
                          !isFieldEditable("estado", currentUser.role, compra?.estado as EstadoCompra | undefined)
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableEstados.map((estado) => (
                            <SelectItem key={estado} value={estado}>
                              {estado}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="descripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Descripción
                      {isRequired("descripcion") && <span className="ml-1 text-red-500">*</span>}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descripción detallada de la compra"
                        className="resize-none"
                        disabled={!isFieldEditable("descripcion", currentUser?.role || ["Observador"])}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="unidad_requirente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Unidad Requirente
                        {isRequired("unidad_requirente") && <span className="ml-1 text-red-500">*</span>}
                      </FormLabel>
                      <Popover open={openRequirente} onOpenChange={setOpenRequirente}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openRequirente}
                              className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                              disabled={!isFieldEditable("unidad_requirente", currentUser?.role || ["Observador"])}
                            >
                              {field.value
                                ? requirentes.find((requirente) => requirente.id === field.value)?.nombre
                                : "Selecciona unidad"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                          <Command>
                            <CommandInput placeholder="Buscar unidad..." />
                            <CommandList>
                              <CommandEmpty>No se encontró unidad.</CommandEmpty>
                              <CommandGroup>
                                {requirentes.map((requirente) => (
                                  <CommandItem
                                    value={requirente.nombre}
                                    key={requirente.id}
                                    onSelect={() => {
                                      form.setValue("unidad_requirente", requirente.id);
                                      setOpenRequirente(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        requirente.id === field.value ? "opacity-100" : "opacity-0",
                                      )}
                                    />
                                    {requirente.nombre}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="adjunta_ordinario"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel>Adjunto Ordinario</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            onChange(file);
                          }}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>PDF o imagen (máx. 10MB)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* SECCIÓN: DATOS DE GESTIÓN */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Datos de Gestión</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="comprador"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Comprador
                        {isRequired("comprador") && <span className="ml-1 text-red-500">*</span>}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={!isFieldEditable("comprador", currentUser?.role || ["Observador"])}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona comprador" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {usuarios
                            .filter((u) => u.role.includes("Comprador"))
                            .map((usuario) => (
                              <SelectItem key={usuario.id} value={usuario.id}>
                                {usuario.name}
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
                  name="subvencion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Subvención
                        {isRequired("subvencion") && <span className="ml-1 text-red-500">*</span>}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={!isFieldEditable("subvencion", currentUser?.role || ["Observador"])}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona subvención" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subvenciones
                            .filter((s) => !currentUser?.role.includes("SEP") || s.nombre.toLowerCase().includes("sep"))
                            .map((subvencion) => (
                              <SelectItem key={subvencion.id} value={subvencion.id}>
                                {subvencion.nombre}
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
                  name="presupuesto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Presupuesto
                        {isRequired("presupuesto") && <span className="ml-1 text-red-500">*</span>}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="0"
                          disabled={!isFieldEditable("presupuesto", currentUser?.role || ["Observador"])}
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
                  name="decreto_pago"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Decreto de Pago
                        {isRequired("decreto_pago") && <span className="ml-1 text-red-500">*</span>}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: 1234"
                          disabled={!isFieldEditable("decreto_pago", currentUser?.role || ["Observador"])}
                          {...field}
                        />
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
                      <FormLabel>
                        Fecha de Pago
                        {isRequired("fecha_pago") && <span className="ml-1 text-red-500">*</span>}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          disabled={!isFieldEditable("fecha_pago", currentUser?.role || ["Observador"])}
                          {...field}
                          value={field.value ? new Date(field.value as string).toISOString().split("T")[0] : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator className="my-4" />

            {/* SECCIÓN: ÓRDENES DE COMPRA */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Órdenes de Compra</h3>

              {!isEditing ? (
                <Alert className="bg-muted/50">
                  <AlertDescription>
                    Para adjuntar órdenes de compra, primero debes crear y guardar la solicitud básica.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <OrdenesCompraList
                    compraId={compra?.id}
                    canEdit={
                      currentUser?.role.includes("Encargado compras") ||
                      currentUser?.role.includes("Comprador") ||
                      false
                    }
                    onUpdate={() => {
                      // No-op for this dialog context
                    }}
                  />

                  <FormField
                    control={form.control}
                    name="observacion"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Observación Comprador</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Observaciones adicionales del proceso de compra..."
                            className="resize-none"
                            {...field}
                            disabled={!isFieldEditable("observacion", currentUser?.role || ["Observador"])}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : isEditing ? (
                  "Guardar Cambios"
                ) : (
                  "Crear Compra"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
