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
    const subvencion = compra?.expand?.subvencion?.nombre || "N/A";
    const ordinario = compra?.numero_ordinario || "N/A";

    return (
        <div className="w-[210mm] h-[279mm] bg-white p-8 mx-auto relative text-sm border-b-2 border-dashed last:border-0 print:border-none print:h-screen print:w-screen">
            {/* Header */}
            <div className="flex gap-6 items-start mb-2 border-b pb-2">
                <div className="max-w-[70%]">
                    <h1 className="text-2xl font-bold uppercase tracking-wide">Recepción de bienes - servicios y despacho de materiales</h1>
                    <div className="mt-2">
                        <p className="text-xs text-gray-500 font-bold uppercase">Departamento Administrativo de Educación Municipal</p>
                        <p className="text-xs text-gray-500">Unidad de Contabilidad y Finanazas</p>
                    </div>
                </div>
                <div className="text-center">
                    <div className="border border-black rounded">
                        <p className="text-xs font-bold uppercase">Folio Recepción</p>
                        <p className="text-xl font-mono font-bold text-red-600">{recepcion.folio}</p>
                    </div>
                    <div className="mt-2 inline-block border-2 border-red-500 px-3 py-1 rounded">
                        <p className="text-red-600 font-bold uppercase text-sm tracking-wider whitespace-nowrap">{label}</p>
                    </div>
                    <p className="font-medium whitespace-nowrap">Fecha: {format(parseISO(recepcion.fecha_recepcion), "dd 'de' MMMM 'de' yyyy", { locale: es })}</p>
                </div>
            </div>

            {/* Info quien envia */}
            <div className="grid grid-cols-1 gap-x-8 gap-y-4 border p-4 rounded-sm bg-gray-50/30">
                <div>
                    <p className="font-bold uppercase">De: Cristian Oyarzo Ulloa</p>
                    <p className="uppercase"> A: Jefe de Departamento Contabilidad y Finanzas DAEM.</p>
                    <p className="font-bold uppercase">Mauricio Soto Herrera </p>
                </div>

                {/* Info compra */}
                <div className="grid grid-cols-4 gap-x-8 gap-y-2 mb-0 border p-2 rounded-sm bg-gray-50/30">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">Orden de Compra</p>
                        <p className="font-medium">
                            {recepcion.expand?.orden_compra?.oc || "No Asociada"}
                        </p>
                        {recepcion.expand?.orden_compra?.oc_fecha && (
                            <p className="text-xs font-bold text-gray-500 uppercase">
                                {format(parseISO(recepcion.expand.orden_compra.oc_fecha), "dd/MM/yyyy")}
                            </p>
                        )}
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">Unidad Requirente</p>
                        <p className="font-medium">{unidad}</p>
                        <p className="text-xs font-bold text-gray-500 uppercase">Ordinario N° {ordinario}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">Subvención</p>
                        <p className="font-medium">{subvencion}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Documento Respaldo</p>
                        <p className="text-xs font-medium uppercase">{recepcion.documento_tipo} </p>
                        <p className="text-xs font-bold text-gray-500 uppercase">N° {recepcion.documento_numero || "Sin Numero"}</p>
                    </div>
                </div>

                {/* Items Table */}
                <div className="min-h-[300px]">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100 border-b border-gray-300">
                                <th className="py-1 px-3 text-left w-20 text-xs font-bold uppercase text-gray-600">Cantidad</th>
                                <th className="py-1 px-3 text-left text-xs font-bold uppercase text-gray-600">Descripción del Artículo / Servicio</th>
                            </tr>
                        </thead>
                        <tbody>
                            {detalles.length > 0 ? (
                                detalles.map((detalle, index) => (
                                    <tr key={detalle.id || index} className="border-b border-gray-200">
                                        <td className="py-1 px-3 align-top text-center font-mono">{detalle.cantidad}</td>
                                        <td className="py-1 px-3 align-top whitespace-nowrap">{detalle.detalle}</td>
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
                <div className="py-1">
                    <p className="text-xs font-bold text-gray-500 uppercase">Observaciones</p>
                    <div className="border rounded p-2 min-h-[40px] text-gray-700 bg-gray-50">
                        {recepcion.observaciones || "Sin observaciones."}
                    </div>
                </div>

                {/* Conformidad */}
                <div className="mb-4 border-y-2 border-gray-200 py-1">
                    <p className="text-xs font-bold uppercase text-center mb-1">Declaración de Conformidad</p>
                    <div className="flex justify-center gap-20">
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-black bg-white"></div>
                            <span className="text-xs font-bold uppercase">Se da conformidad</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-black bg-white"></div>
                            <span className="text-xs font-bold uppercase">No se da conformidad</span>
                        </div>
                    </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-3 gap-12">
                    <div className="text-center">
                        <div className="border-b border-black h-6"></div>
                        <p className="font-bold text-sm uppercase">Nombre, Firma y Timbre</p>
                        <p className="text-xs text-gray-500">Director del Establecimiento</p>
                    </div>
                    <div className="text-center">
                        <div className="border-b border-black h-6"></div>
                        <p className="font-bold text-sm uppercase">Revisión Bodega</p>
                        <p className="text-xs text-gray-500">DAEM</p>
                    </div>
                    <div className="text-center">
                        <div className="border-b border-black h-6"></div>
                        <p className="font-bold text-sm uppercase">Encargado Bodega</p>
                        <p className="text-xs text-gray-500">DAEM</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
