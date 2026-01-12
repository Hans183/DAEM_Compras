
import { Compra } from "@/types/compra";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FileText, AlertCircle } from "lucide-react";

interface CompraSheetProps {
    compra: Compra;
}

export function CompraSheet({ compra }: CompraSheetProps) {
    return (
        <div className="bg-background text-foreground p-8 max-w-4xl mx-auto print:p-0 print:max-w-none print:bg-white print:text-black" id="printable-sheet">
            {/* Header */}
            <div className="mb-8 text-center border-b pb-4">
                <h1 className="text-2xl font-bold uppercase tracking-tight">Ficha de Requerimiento de Compra</h1>
                <p className="text-sm text-muted-foreground mt-1">Departamento de Administración de Educación Municipal</p>
                <div className="mt-4 flex justify-between items-end px-4">
                    <div className="text-left">
                        <span className="block text-xs font-semibold text-muted-foreground uppercase">N° Ordinario</span>
                        <span className="text-xl font-mono">{compra.numero_ordinario}</span>
                    </div>
                    <div className="text-right">
                        <span className="block text-xs font-semibold text-muted-foreground uppercase">Fecha de Solicitud</span>
                        <span className="text-lg">{format(new Date(compra.created), "dd 'de' MMMM, yyyy", { locale: es })}</span>
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

                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground font-semibold uppercase">Orden de Compra (OC)</span>
                        <span className="text-sm mt-1 font-mono">{compra.odd || "Pendiente"}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground font-semibold uppercase">Fecha OC</span>
                        <span className="text-sm mt-1">
                            {compra.fecha_odd ? format(new Date(compra.fecha_odd), "dd/MM/yyyy") : "Pendiente"}
                        </span>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground font-semibold uppercase">Plazo de Entrega</span>
                        <span className="text-sm mt-1">{compra.plazo_de_entrega ? `${compra.plazo_de_entrega} días` : "No definido"}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground font-semibold uppercase">Presupuesto Asignado</span>
                        <span className="text-sm mt-1">
                            {compra.presupuesto ? `$ ${compra.presupuesto.toLocaleString("es-CL")}` : "$ 0"}
                        </span>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground font-semibold uppercase">Valor Total Estimado</span>
                        <span className="text-lg font-semibold mt-1">
                            {compra.valor ? `$ ${compra.valor.toLocaleString("es-CL")}` : "$ 0"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Firmas removed as per user request */}


            <div className="mt-8 pt-4 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
                <div className="flex flex-col">
                    <span>Última actualización: {format(new Date(compra.updated), "dd 'de' MMMM, yyyy HH:mm", { locale: es })}</span>
                    {compra.usuario_modificador && (
                        <span className="font-medium mt-1">Por: {compra.usuario_modificador}</span>
                    )}
                </div>
            </div>
        </div>
    );
}
