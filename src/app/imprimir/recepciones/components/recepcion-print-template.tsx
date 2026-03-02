"use client";

import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

import type { Recepcion } from "@/types/recepcion";

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
    <div className="relative mx-auto h-[279mm] w-[210mm] border-b-2 border-dashed bg-white p-8 text-sm last:border-0 print:h-screen print:w-screen print:border-none">
      {/* Header */}
      <div className="mb-2 flex items-start gap-6 border-b pb-2">
        <div className="max-w-[70%]">
          <h1 className="font-bold text-2xl uppercase tracking-wide">
            Recepción de bienes - servicios y despacho de materiales
          </h1>
          <div className="mt-2">
            <p className="font-bold text-gray-500 text-xs uppercase">
              Departamento Administrativo de Educación Municipal
            </p>
            <p className="text-gray-500 text-xs">Unidad de Contabilidad y Finanazas</p>
          </div>
        </div>
        <div className="text-center">
          <div className="rounded border border-black">
            <p className="font-bold text-xs uppercase">Folio Recepción</p>
            <p className="font-bold font-mono text-red-600 text-xl">{recepcion.folio}</p>
          </div>
          <div className="mt-2 inline-block rounded border-2 border-red-500 px-3 py-1">
            <p className="whitespace-nowrap font-bold text-red-600 text-sm uppercase tracking-wider">{label}</p>
          </div>
          <p className="whitespace-nowrap font-medium">
            Fecha: {format(parseISO(recepcion.fecha_recepcion), "dd 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>
      </div>

      {/* Info quien envia */}
      <div className="grid grid-cols-1 gap-x-8 gap-y-4 rounded-sm border bg-gray-50/30 p-4">
        <div>
          <p className="font-bold uppercase">De: Cristian Oyarzo Ulloa</p>
          <p className="uppercase"> A: Jefe de Departamento Contabilidad y Finanzas DAEM.</p>
          <p className="font-bold uppercase">Mauricio Soto Herrera </p>
        </div>

        {/* Info compra */}
        <div className="mb-0 grid grid-cols-4 gap-x-8 gap-y-2 rounded-sm border bg-gray-50/30 p-2">
          <div>
            <p className="font-bold text-gray-500 text-xs uppercase">Orden de Compra</p>
            <p className="font-medium">{recepcion.expand?.orden_compra?.oc || "No Asociada"}</p>
            {recepcion.expand?.orden_compra?.oc_fecha && (
              <p className="font-bold text-gray-500 text-xs uppercase">
                {format(parseISO(recepcion.expand.orden_compra.oc_fecha), "dd/MM/yyyy")}
              </p>
            )}
          </div>
          <div>
            <p className="font-bold text-gray-500 text-xs uppercase">Unidad Requirente</p>
            <p className="font-medium">{unidad}</p>
            <p className="font-bold text-gray-500 text-xs uppercase">Ordinario N° {ordinario}</p>
          </div>
          <div>
            <p className="font-bold text-gray-500 text-xs uppercase">Subvención</p>
            <p className="font-medium">{subvencion}</p>
          </div>
          <div>
            <p className="whitespace-nowrap font-bold text-gray-500 text-xs uppercase">Documento Respaldo</p>
            <p className="font-medium text-xs uppercase">{recepcion.documento_tipo} </p>
            <p className="font-bold text-gray-500 text-xs uppercase">N° {recepcion.documento_numero || "Sin Numero"}</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="min-h-[300px]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-gray-300 border-b bg-gray-100">
                <th className="w-20 px-3 py-1 text-left font-bold text-gray-600 text-xs uppercase">Cantidad</th>
                <th className="px-3 py-1 text-left font-bold text-gray-600 text-xs uppercase">
                  Descripción del Artículo / Servicio
                </th>
              </tr>
            </thead>
            <tbody>
              {detalles.length > 0 ? (
                detalles.map((detalle, index) => (
                  <tr key={detalle.id || index} className="border-gray-200 border-b">
                    <td className="px-3 py-1 text-center align-top font-mono">{detalle.cantidad}</td>
                    <td className="whitespace-nowrap px-3 py-1 align-top">{detalle.detalle}</td>
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
          <p className="font-bold text-gray-500 text-xs uppercase">Observaciones</p>
          <div className="min-h-[40px] rounded border bg-gray-50 p-2 text-gray-700">
            {recepcion.observaciones || "Sin observaciones."}
          </div>
        </div>

        {/* Conformidad */}
        <div className="mb-4 border-gray-200 border-y-2 py-1">
          <p className="mb-1 text-center font-bold text-xs uppercase">Declaración de Conformidad</p>
          <div className="flex justify-center gap-20">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 border-2 border-black bg-white" />
              <span className="font-bold text-xs uppercase">Se da conformidad</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 border-2 border-black bg-white" />
              <span className="font-bold text-xs uppercase">No se da conformidad</span>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-12">
          <div className="text-center">
            <div className="h-6 border-black border-b" />
            <p className="font-bold text-sm uppercase">Nombre, Firma y Timbre</p>
            <p className="text-gray-500 text-xs">Director del Establecimiento</p>
          </div>
          <div className="text-center">
            <div className="h-6 border-black border-b" />
            <p className="font-bold text-sm uppercase">Revisión Bodega</p>
            <p className="text-gray-500 text-xs">DAEM</p>
          </div>
          <div className="text-center">
            <div className="h-6 border-black border-b" />
            <p className="font-bold text-sm uppercase">Encargado Bodega</p>
            <p className="text-gray-500 text-xs">DAEM</p>
          </div>
        </div>
      </div>
    </div>
  );
}
