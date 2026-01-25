"use client";

import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Recepcion } from "@/types/recepcion";

interface RecepcionPrintTemplateProps {
    recepcion: Recepcion;
    label: string;
}

export function RecepcionPrintTemplate({ recepcion, label }: RecepcionPrintTemplateProps) {
    const compra = recepcion.expand?.compra;
    const detalles = recepcion.expand?.["recepcion_detalles(recepcion)"] || [];
    const unidad = compra?.expand?.unidad_requirente?.nombre || "N/A";
    const proveedor = compra?.expand?.proveedor?.razon_social || compra?.proveedor_texto || "N/A";
    const rutProveedor = compra?.expand?.proveedor?.rut || "N/A";

    return (
        <div className="w-[210mm] h-[297mm] bg-white p-8 mx-auto relative text-sm border-b-2 border-dashed last:border-0 print:border-none print:h-screen print:w-screen">
            {/* Header */}
            <div className="flex justify-between items-start mb-6 border-b pb-4">
                <div>
                    <h1 className="text-2xl font-bold uppercase tracking-wide">Acta de Recepción</h1>
                    <div className="mt-2 inline-block border-2 border-red-500 px-3 py-1 rounded">
                        <p className="text-red-600 font-bold uppercase text-sm tracking-wider">{label}</p>
                    </div>
                    <div className="mt-4">
                        <p className="text-xs text-gray-500 font-bold uppercase">Departamento de Educación Municipal</p>
                        <p className="text-xs text-gray-500">Unidad de Adquisiciones y Bodega</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="border border-black p-2 rounded">
                        <p className="text-xs font-bold uppercase">Folio Recepción</p>
                        <p className="text-xl font-mono font-bold text-red-600">{recepcion.folio}</p>
                    </div>
                    <p className="mt-2 font-medium">Fecha: {format(parseISO(recepcion.fecha_recepcion), "dd 'de' MMMM 'de' yyyy", { locale: es })}</p>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-3 gap-x-8 gap-y-4 mb-6 border p-4 rounded-sm bg-gray-50/30">
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Orden de Compra</p>
                    <p className="font-medium">
                        {recepcion.expand?.orden_compra?.oc || "No Asociada"}
                    </p>
                    {recepcion.expand?.orden_compra?.oc_fecha && (
                        <p className="text-xs text-gray-500">
                            {format(parseISO(recepcion.expand.orden_compra.oc_fecha), "dd/MM/yyyy")}
                        </p>
                    )}
                </div>
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Unidad Requirente</p>
                    <p className="font-medium">{unidad}</p>
                </div>
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Documento Respaldo</p>
                    <p className="font-medium">{recepcion.documento_tipo} N° {recepcion.documento_numero || "S/N"}</p>
                </div>
            </div>

            {/* Items Table */}
            <div className="mb-8 min-h-[300px]">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-100 border-b border-gray-300">
                            <th className="py-2 px-3 text-left w-20 text-xs font-bold uppercase text-gray-600">Cantidad</th>
                            <th className="py-2 px-3 text-left text-xs font-bold uppercase text-gray-600">Descripción del Artículo / Servicio</th>
                        </tr>
                    </thead>
                    <tbody>
                        {detalles.length > 0 ? (
                            detalles.map((detalle, index) => (
                                <tr key={detalle.id || index} className="border-b border-gray-100">
                                    <td className="py-2 px-3 align-top font-mono">{detalle.cantidad}</td>
                                    <td className="py-2 px-3 align-top">{detalle.detalle}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={2} className="py-8 text-center text-gray-400 italic">
                                    Sin detalles registrados
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Observations */}
            <div className="mb-12">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Observaciones</p>
                <div className="border rounded p-3 min-h-[60px] text-gray-700 bg-gray-50">
                    {recepcion.observaciones || "Sin observaciones."}
                </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-12 mt-auto pt-12">
                <div className="text-center">
                    <div className="border-b border-black mb-2 h-16"></div>
                    <p className="font-bold text-sm uppercase">Firma Recepción Conforme</p>
                    <p className="text-xs text-gray-500">(Bodega / Unidad Requirente)</p>
                    <p className="mt-1 font-medium text-xs">{recepcion.expand?.recepcionado_por?.name || "Usuario de Sistema"}</p>
                </div>
                <div className="text-center">
                    <div className="border-b border-black mb-2 h-16"></div>
                    <p className="font-bold text-sm uppercase">Firma Entrega Proveedor</p>
                    <p className="text-xs text-gray-500">(Nombre y RUT)</p>
                </div>
            </div>

            <div className="absolute bottom-4 left-0 right-0 text-center text-[10px] text-gray-400">
                Generado el {format(new Date(), "dd/MM/yyyy HH:mm")}
            </div>
        </div>
    );
}
