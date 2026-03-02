import { useState } from "react";

import { format, type Locale } from "date-fns";
import { es } from "date-fns/locale";
import { AlertCircle, FileText, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Compra } from "@/types/compra";
import type { User } from "@/types/user";
import { parseToLocalDate } from "@/utils/date-utils";
import { canCreateRecepcion } from "@/utils/permissions";

import { HistorialTimeline } from "./historial-timeline";
import { RecepcionDialog } from "./recepcion-dialog";
import { RecepcionesList } from "./recepciones-list";

interface CompraSheetProps {
  compra: Compra;
  currentUser: User | null;
  linkedOcId?: string;
}

// Helper to safely format dates
const safeFormat = (date: string | Date | undefined, formatStr: string, options?: { locale?: Locale }) => {
  if (!date) return "";
  try {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "";
    return format(d, formatStr, options);
  } catch {
    return "";
  }
};

export function CompraSheet({ compra, currentUser, linkedOcId }: CompraSheetProps) {
  const [isRecepcionDialogOpen, setIsRecepcionDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <div
      className="mx-auto w-full bg-background p-8 text-foreground print:max-w-none print:bg-white print:p-0 print:text-black"
      id="printable-sheet"
    >
      {/* Header */}
      <div className="mb-6 border-b pb-4 text-center">
        <h1 className="font-bold text-2xl uppercase tracking-tight">Ficha de Compra</h1>
        <p className="mt-1 text-muted-foreground text-sm">Departamento de Administración de Educación Municipal</p>
        <div className="mt-4 flex items-end justify-between px-4">
          <div className="text-left">
            <span className="block font-semibold text-muted-foreground text-xs uppercase">N° Ordinario</span>
            <span className="font-mono text-xl">{compra.numero_ordinario}</span>
          </div>
          <div className="text-right">
            <span className="block font-semibold text-muted-foreground text-xs uppercase">Fecha de Solicitud</span>
            <span className="text-lg">{safeFormat(compra.created, "dd 'de' MMMM, yyyy", { locale: es })}</span>
          </div>
        </div>
      </div>

      {/* Datos de Solicitud */}
      <div className="mb-8">
        {compra.estado === "Anulado" && (
          <div className="mb-6 rounded-md border border-destructive/20 bg-destructive/10 p-4 text-destructive">
            <div className="mb-2 flex items-center gap-2 font-bold">
              <AlertCircle className="h-5 w-5" />
              <span>COMPRA ANULADA</span>
            </div>
            <p className="text-sm">
              <span className="font-semibold">Motivo:</span> {compra.motivo_anula || "No especificado"}
            </p>
          </div>
        )}
        <h3 className="mb-4 border-b pb-1 font-bold text-muted-foreground text-sm uppercase">Datos de Solicitud</h3>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <div className="flex flex-col">
            <span className="font-semibold text-muted-foreground text-xs uppercase">Estado Actual</span>
            <span className="mt-1 inline-flex w-fit items-center rounded-full bg-secondary px-2.5 py-0.5 font-medium text-secondary-foreground text-xs">
              {compra.estado}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-muted-foreground text-xs uppercase">Unidad Requirente</span>
            <span className="mt-1 text-sm">{compra.expand?.unidad_requirente?.nombre || "No especificada"}</span>
          </div>
          <div className="col-span-2 mt-2 flex flex-col">
            <span className="mb-1 font-semibold text-muted-foreground text-xs uppercase">
              Descripción del Requerimiento
            </span>
            <div className="min-h-[100px] whitespace-pre-wrap rounded-md border bg-muted p-4 text-sm">
              {compra.descripcion}
            </div>
          </div>
          {compra.adjunta_ordinario && (
            <div className="col-span-2 mt-2 flex items-center gap-2 text-blue-600 text-sm">
              <FileText className="h-4 w-4" />
              <span>Documento Ordinario Adjunto</span>
            </div>
          )}
        </div>
      </div>

      {/* Datos de Gestión */}
      <div className="mb-8">
        <h3 className="mb-4 border-b pb-1 font-bold text-muted-foreground text-sm uppercase">
          Datos de Gestión y Adjudicación
        </h3>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <div className="flex flex-col">
            <span className="font-semibold text-muted-foreground text-xs uppercase">Comprador Asignado</span>
            <span className="mt-1 text-sm">{compra.expand?.comprador?.name || "Sin asignar"}</span>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-muted-foreground text-xs uppercase">Subvención</span>
            <span className="mt-1 text-sm">{compra.expand?.subvencion?.nombre || "No definida"}</span>
          </div>

          <div className="col-span-2">
            <h4 className="mb-2 font-semibold text-muted-foreground text-xs uppercase">Órdenes de Compra</h4>
            <div className="overflow-hidden rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">N° OC</th>
                    <th className="px-3 py-2 text-left font-medium">Fecha</th>
                    <th className="px-3 py-2 text-center font-medium">Plazo Entrega</th>
                    <th className="px-3 py-2 text-right font-medium">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {compra.expand?.["ordenes_compra(compra)"]?.length ? (
                    compra.expand["ordenes_compra(compra)"].map((oc) => (
                      <tr key={oc.id} className={linkedOcId === oc.id ? "bg-yellow-50" : ""}>
                        <td className="px-3 py-2 font-mono">
                          {oc.oc}
                          {linkedOcId === oc.id && (
                            <span className="ml-2 inline-flex items-center rounded-full border border-transparent bg-primary px-2.5 py-0.5 font-semibold text-primary-foreground text-xs shadow transition-colors hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                              Vinculada
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {oc.oc_fecha ? oc.oc_fecha.substring(0, 10).split("-").reverse().join("/") : "-"}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {oc.plazo_entrega
                            ? format(parseToLocalDate(oc.plazo_entrega) || new Date(), "dd/MM/yyyy")
                            : "-"}
                        </td>
                        <td className="px-3 py-2 text-right">$ {oc.oc_valor.toLocaleString("es-CL")}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-3 py-2 text-center text-muted-foreground">
                        No hay órdenes de compra asociadas
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-muted/50 font-medium">
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-right">
                      Total
                    </td>
                    <td className="px-3 py-2 text-right">
                      ${" "}
                      {(
                        compra.expand?.["ordenes_compra(compra)"]?.reduce((acc, oc) => acc + oc.oc_valor, 0) || 0
                      ).toLocaleString("es-CL")}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          {compra.observacion && (
            <div className="col-span-2 mt-4 flex flex-col border-t pt-4">
              <span className="mb-1 font-semibold text-muted-foreground text-xs uppercase">Observación Comprador</span>
              <div className="whitespace-pre-wrap rounded-md border bg-muted p-4 text-sm">{compra.observacion}</div>
            </div>
          )}
        </div>
      </div>

      {/* Recepciones Bodega */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between border-b pb-1">
          <h3 className="font-bold text-muted-foreground text-sm uppercase">Recepciones de Bodega</h3>
          {currentUser && canCreateRecepcion(currentUser.role) && (
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setIsRecepcionDialogOpen(true)}>
              <Plus className="mr-2 h-3 w-3" />
              Nueva Recepción
            </Button>
          )}
        </div>
        <div className="rounded-md bg-background">
          <RecepcionesList compraId={compra.id} refreshTrigger={refreshTrigger} />
        </div>
      </div>

      {/* Historial de Cambios */}

      <div className="mb-8">
        <h3 className="mb-4 border-b pb-1 font-bold text-muted-foreground text-sm uppercase">Historial de Cambios</h3>
        <div className="rounded-md border bg-muted/10 p-4">
          <HistorialTimeline compraId={compra.id} />
        </div>
      </div>

      {/* Firmas removed as per user request */}

      <div className="mt-8 flex items-center justify-between border-border border-t pt-4 text-muted-foreground text-xs">
        <div className="flex flex-col">
          <span>Última actualización: {safeFormat(compra.updated, "dd 'de' MMMM, yyyy HH:mm", { locale: es })}</span>
          {compra.usuario_modificador && <span className="mt-1 font-medium">Por: {compra.usuario_modificador}</span>}
        </div>
      </div>
      {currentUser && (
        <RecepcionDialog
          compra={compra}
          open={isRecepcionDialogOpen}
          onOpenChange={setIsRecepcionDialogOpen}
          currentUser={currentUser}
          onSuccess={() => setRefreshTrigger((prev) => prev + 1)}
        />
      )}
    </div>
  );
}
