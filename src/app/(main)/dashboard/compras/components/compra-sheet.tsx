
import { Compra } from "@/types/compra";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FileText, AlertCircle, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RecepcionesList } from "./recepciones-list";
import { RecepcionDialog } from "./recepcion-dialog";
import { canCreateRecepcion } from "@/utils/permissions";
import { HistorialTimeline } from "./historial-timeline";
import { parseToLocalDate } from "@/utils/date-utils";
import type { User } from "@/types/user";



interface CompraSheetProps {
    compra: Compra;
    currentUser: User | null;
    linkedOcId?: string;
}


// Helper to safely format dates
const safeFormat = (date: string | Date | undefined, formatStr: string, options?: any) => {
    if (!date) return "";
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return "";
        return format(d, formatStr, options);
    } catch {
        return "";
    }
};

export function CompraSheet({ compra, currentUser, linkedOcId }: CompraSheetProps) {
    const [isRecepcionDialogOpen, setIsRecepcionDialogOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    return (

        <div className="bg-background text-foreground p-8 w-full mx-auto print:p-0 print:max-w-none print:bg-white print:text-black" id="printable-sheet">
            {/* Header */}
            <div className="mb-6 text-center border-b pb-4">
                <h1 className="text-2xl font-bold uppercase tracking-tight">Ficha de Compra</h1>
                <p className="text-sm text-muted-foreground mt-1">Departamento de Administración de Educación Municipal</p>
                <div className="mt-4 flex justify-between items-end px-4">
                    <div className="text-left">
                        <span className="block text-xs font-semibold text-muted-foreground uppercase">N° Ordinario</span>
                        <span className="text-xl font-mono">{compra.numero_ordinario}</span>
                    </div>
                    <div className="text-right">
                        <span className="block text-xs font-semibold text-muted-foreground uppercase">Fecha de Solicitud</span>
                        <span className="text-lg">{safeFormat(compra.created, "dd 'de' MMMM, yyyy", { locale: es })}</span>
                    </div>
                </div>
            </div>

            {/* Datos de Solicitud */}
            <div className="mb-8">
                {compra.estado === "Anulado" && (
                    <div className="mb-6 p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive">
                        <div className="flex items-center gap-2 font-bold mb-2">
                            <AlertCircle className="h-5 w-5" />
                            <span>COMPRA ANULADA</span>
                        </div>
                        <p className="text-sm">
                            <span className="font-semibold">Motivo:</span> {compra.motivo_anula || "No especificado"}
                        </p>
                    </div>
                )}
                <h3 className="text-sm font-bold uppercase text-muted-foreground border-b mb-4 pb-1">Datos de Solicitud</h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground font-semibold uppercase">Estado Actual</span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground w-fit mt-1">
                            {compra.estado}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground font-semibold uppercase">Unidad Requirente</span>
                        <span className="text-sm mt-1">{compra.expand?.unidad_requirente?.nombre || "No especificada"}</span>
                    </div>
                    <div className="col-span-2 flex flex-col mt-2">
                        <span className="text-xs text-muted-foreground font-semibold uppercase mb-1">Descripción del Requerimiento</span>
                        <div className="bg-muted p-4 rounded-md border text-sm whitespace-pre-wrap min-h-[100px]">
                            {compra.descripcion}
                        </div>
                    </div>
                    {compra.adjunta_ordinario && (
                        <div className="col-span-2 flex items-center gap-2 mt-2 text-sm text-blue-600">
                            <FileText className="h-4 w-4" />
                            <span>Documento Ordinario Adjunto</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Datos de Gestión */}
            <div className="mb-8">
                <h3 className="text-sm font-bold uppercase text-muted-foreground border-b mb-4 pb-1">Datos de Gestión y Adjudicación</h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground font-semibold uppercase">Comprador Asignado</span>
                        <span className="text-sm mt-1">{compra.expand?.comprador?.name || "Sin asignar"}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground font-semibold uppercase">Subvención</span>
                        <span className="text-sm mt-1">{compra.expand?.subvencion?.nombre || "No definida"}</span>
                    </div>

                    <div className="col-span-2">
                        <h4 className="text-xs text-muted-foreground font-semibold uppercase mb-2">Órdenes de Compra</h4>
                        <div className="border rounded-md overflow-hidden">
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
                                                        <span className="ml-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80">
                                                            Vinculada
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2">{oc.oc_fecha ? oc.oc_fecha.substring(0, 10).split('-').reverse().join('/') : "-"}</td>
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
                                            <td colSpan={4} className="px-3 py-2 text-center text-muted-foreground">No hay órdenes de compra asociadas</td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot className="bg-muted/50 font-medium">
                                    <tr>
                                        <td colSpan={3} className="px-3 py-2 text-right">Total</td>
                                        <td className="px-3 py-2 text-right">
                                            $ {(compra.expand?.["ordenes_compra(compra)"]?.reduce((acc, oc) => acc + oc.oc_valor, 0) || 0).toLocaleString("es-CL")}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                    {compra.observacion && (
                        <div className="col-span-2 flex flex-col mt-4 border-t pt-4">
                            <span className="text-xs text-muted-foreground font-semibold uppercase mb-1">Observación Comprador</span>
                            <div className="bg-muted p-4 rounded-md border text-sm whitespace-pre-wrap">
                                {compra.observacion}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Recepciones Bodega */}
            <div className="mb-8">
                <div className="flex justify-between items-center border-b mb-4 pb-1">
                    <h3 className="text-sm font-bold uppercase text-muted-foreground">Recepciones de Bodega</h3>
                    {currentUser && canCreateRecepcion(currentUser.role) && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setIsRecepcionDialogOpen(true)}
                        >
                            <Plus className="mr-2 h-3 w-3" />
                            Nueva Recepción
                        </Button>
                    )}
                </div>
                <div className="bg-background rounded-md">
                    <RecepcionesList compraId={compra.id} refreshTrigger={refreshTrigger} />
                </div>
            </div>

            {/* Historial de Cambios */}

            <div className="mb-8">
                <h3 className="text-sm font-bold uppercase text-muted-foreground border-b mb-4 pb-1">Historial de Cambios</h3>
                <div className="bg-muted/10 rounded-md border p-4">
                    <HistorialTimeline compraId={compra.id} />
                </div>
            </div>

            {/* Firmas removed as per user request */}


            <div className="mt-8 pt-4 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
                <div className="flex flex-col">
                    <span>Última actualización: {safeFormat(compra.updated, "dd 'de' MMMM, yyyy HH:mm", { locale: es })}</span>
                    {compra.usuario_modificador && (
                        <span className="font-medium mt-1">Por: {compra.usuario_modificador}</span>
                    )}
                </div>
            </div>
            {currentUser && (
                <RecepcionDialog
                    compra={compra}
                    open={isRecepcionDialogOpen}
                    onOpenChange={setIsRecepcionDialogOpen}
                    currentUser={currentUser}
                    onSuccess={() => setRefreshTrigger(prev => prev + 1)}
                />
            )}
        </div>
    );
}

