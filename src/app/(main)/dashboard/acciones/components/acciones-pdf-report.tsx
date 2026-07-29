"use client";

import { useMemo } from "react";

import { AlertCircle, FileText, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Accion } from "@/types/accion";

interface AccionesPdfReportProps {
  data: Accion[];
  usageMap: Record<string, number>;
  selectedYear: number;
  selectedEstablecimientoId?: string;
  selectedEstablecimientoName?: string;
  trigger?: React.ReactNode;
}

interface SchoolSummary {
  id: string;
  nombre: string;
  totalAcciones: number;
  montoSepTotal: number;
  montoEjecutadoTotal: number;
  saldoDisponible: number;
  porcentajeAvance: number;
  acciones: Accion[];
}

export function AccionesPdfReport({
  data,
  usageMap,
  selectedYear,
  selectedEstablecimientoId,
  selectedEstablecimientoName,
  trigger,
}: AccionesPdfReportProps) {
  // Filter actions strictly for the selected establishment if one is specified
  const filteredData = useMemo(() => {
    if (!selectedEstablecimientoId || selectedEstablecimientoId === "all") {
      return data;
    }
    return data.filter((accion) => accion.establecimiento === selectedEstablecimientoId);
  }, [data, selectedEstablecimientoId]);

  const hasSpecificSchoolFilter = Boolean(selectedEstablecimientoId && selectedEstablecimientoId !== "all");

  // Group actions by establishment
  const schoolSummaries = useMemo(() => {
    const map = new Map<string, SchoolSummary>();

    filteredData.forEach((accion) => {
      const schoolId = accion.establecimiento || "sin-establecimiento";
      const schoolName =
        accion.expand?.establecimiento?.nombre || selectedEstablecimientoName || "Establecimiento no asignado";

      if (!map.has(schoolId)) {
        map.set(schoolId, {
          id: schoolId,
          nombre: schoolName,
          totalAcciones: 0,
          montoSepTotal: 0,
          montoEjecutadoTotal: 0,
          saldoDisponible: 0,
          porcentajeAvance: 0,
          acciones: [],
        });
      }

      const summary = map.get(schoolId)!;
      const usado = usageMap[accion.id] || 0;
      const sep = accion.monto_sep || 0;

      summary.totalAcciones += 1;
      summary.montoSepTotal += sep;
      summary.montoEjecutadoTotal += usado;
      summary.acciones.push(accion);
    });

    const result: SchoolSummary[] = Array.from(map.values()).map((summary) => {
      const disponible = summary.montoSepTotal - summary.montoEjecutadoTotal;
      const porcentaje = summary.montoSepTotal > 0 ? (summary.montoEjecutadoTotal / summary.montoSepTotal) * 100 : 0;

      return {
        ...summary,
        saldoDisponible: disponible,
        porcentajeAvance: porcentaje,
      };
    });

    return result.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [filteredData, usageMap, selectedEstablecimientoName]);

  // Overall totals
  const totalGlobals = useMemo(() => {
    const totalAcciones = filteredData.length;
    const totalSep = filteredData.reduce((acc, curr) => acc + (curr.monto_sep || 0), 0);
    const totalEjecutado = filteredData.reduce((acc, curr) => acc + (usageMap[curr.id] || 0), 0);
    const totalDisponible = totalSep - totalEjecutado;
    const porcentajeGlobal = totalSep > 0 ? (totalEjecutado / totalSep) * 100 : 0;

    return {
      totalAcciones,
      totalSep,
      totalEjecutado,
      totalDisponible,
      porcentajeGlobal,
    };
  }, [filteredData, usageMap]);

  const currentDateStr = new Date().toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // Dedicated print window method with strict column widths in CSS and inline styles
  const handlePrint = () => {
    const reportEl = document.getElementById("printable-acciones-report");
    if (!reportEl) {
      window.print();
      return;
    }

    const printWindow = window.open("", "_blank", "width=1000,height=900");
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>Informe de Acciones SEP - ${selectedEstablecimientoName || "DAEM"}</title>
          <style>
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              margin: 0;
              padding: 24px;
              color: #0f172a;
              background-color: #ffffff;
              font-size: 15px;
              line-height: 1.5;
            }
            .no-print {
              display: none !important;
            }
            #printable-acciones-report {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
            }
            /* Table formatting with explicit column percentages */
            table {
              width: 100% !important;
              border-collapse: collapse;
              margin-top: 10px;
              margin-bottom: 20px;
              table-layout: fixed !important;
              page-break-inside: auto;
            }
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            th, td {
              border: 1px solid #94a3b8;
              padding: 10px 12px;
              text-align: left;
              word-wrap: break-word;
              font-size: 15px !important;
            }
            th {
              background-color: #f1f5f9 !important;
              font-weight: 700;
              color: #0f172a;
              font-size: 15px !important;
            }
            /* Explicit column widths for print window */
            th:nth-child(1), td:nth-child(1) { width: 48% !important; }
            th:nth-child(2), td:nth-child(2) { width: 16% !important; }
            th:nth-child(3), td:nth-child(3) { width: 12% !important; }
            th:nth-child(4), td:nth-child(4) { width: 12% !important; }
            th:nth-child(5), td:nth-child(5) { width: 12% !important; }

            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-bold { font-weight: 700; }
            .font-semibold { font-weight: 600; }
            .font-medium { font-weight: 500; }
            .uppercase { text-transform: uppercase; }
            .border-b { border-bottom: 1px solid #cbd5e1; }
            .border-b-2 { border-bottom: 2px solid #0f172a; }
            .border-t { border-top: 1px solid #cbd5e1; }
            .pb-5 { padding-bottom: 20px; }
            .mb-2 { margin-bottom: 8px; }
            .mt-1 { margin-top: 4px; }
            .mt-8 { margin-top: 32px; }
            .pt-12 { padding-top: 48px; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .justify-center { justify-content: center; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
            .gap-4 { gap: 16px; }
            .rounded-xl { border-radius: 12px; }
            .rounded-lg { border-radius: 8px; }
            .bg-slate-50 { background-color: #f8fafc !important; }
            .bg-slate-100 { background-color: #f1f5f9 !important; }
            .bg-slate-200 { background-color: #e2e8f0 !important; }
            .border { border: 1px solid #cbd5e1; }
            .p-3 { padding: 14px; }
            .p-5 { padding: 22px; }
            .py-2 { padding-top: 10px; padding-bottom: 10px; }
            .px-3 { padding-left: 14px; padding-right: 14px; }
            .text-xs { font-size: 13px !important; }
            .text-sm { font-size: 15px !important; }
            .text-base { font-size: 16px !important; }
            .text-lg { font-size: 18px !important; }
            .text-xl { font-size: 21px !important; }
            .text-2xl { font-size: 24px !important; }
            .text-slate-500 { color: #64748b; }
            .text-slate-600 { color: #475569; }
            .text-slate-700 { color: #334155; }
            .text-slate-900 { color: #0f172a; }
            .text-blue-700 { color: #1d4ed8; }
            .text-emerald-700 { color: #047857; }
            .space-y-1 > * + * { margin-top: 6px; }
            .space-y-2 > * + * { margin-top: 10px; }
            .space-y-3 > * + * { margin-top: 14px; }
            .space-y-4 > * + * { margin-top: 18px; }
            .space-y-6 > * + * { margin-top: 26px; }
            .space-y-8 > * + * { margin-top: 34px; }
            .w-64 { width: 256px; }
            .w-48 { width: 192px; }
            .mx-auto { margin-left: auto; margin-right: auto; }
            .text-center { text-align: center; }
            @page {
              size: letter portrait;
              margin: 12mm 10mm;
            }
          </style>
        </head>
        <body>
          ${reportEl.innerHTML}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 250);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2 font-semibold">
            <FileText className="h-4 w-4 text-primary" />
            EXPORTAR INFORME PDF
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[95vw] w-[95vw] max-w-[1300px] h-[90vh] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Action Header for Screen */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-background px-6 py-4 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <FileText className="h-6 w-6 text-primary" />
            Informe de Acciones y Avance Financiero
          </DialogTitle>
          {hasSpecificSchoolFilter && (
            <Button onClick={handlePrint} size="lg" className="gap-2 font-semibold px-6">
              <Printer className="h-5 w-5" />
              IMPRIMIR / GUARDAR EN PDF
            </Button>
          )}
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-50/50">
          {!hasSpecificSchoolFilter ? (
            /* Warning if no specific establishment is selected */
            <div className="mx-auto max-w-xl bg-white p-8 rounded-xl border border-amber-200 shadow-sm text-center space-y-4 my-12">
              <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Seleccione un Establecimiento</h3>
              <p className="text-sm text-slate-600">
                Para generar y exportar el informe detallado de acciones y avance en PDF, debe seleccionar previamente
                un colegio específico en el buscador.
              </p>
            </div>
          ) : (
            /* Main Printable Report for the Selected Establishment */
            <div
              id="printable-acciones-report"
              className="mx-auto max-w-[1100px] bg-white p-8 md:p-12 border rounded-xl shadow-sm space-y-8"
            >
              {/* Header Documento DAEM */}
              <div className="border-b-2 border-slate-900 pb-5 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 uppercase">
                    DEPARTAMENTO DE ADMINISTRACIÓN DE EDUCACIÓN MUNICIPAL (DAEM)
                  </h1>
                  <h2 className="text-base md:text-lg font-bold text-slate-700 mt-1">
                    Informe de Ejecución de Acciones SEP y Avance Financiero
                  </h2>
                  <h3 className="text-base font-bold text-primary mt-1">
                    ESTABLECIMIENTO: {selectedEstablecimientoName || "N/A"}
                  </h3>
                </div>
                <div className="text-left md:text-right text-sm text-slate-600 space-y-1 bg-slate-50 p-3 rounded-lg border md:border-none md:bg-transparent">
                  <p>
                    <strong className="text-slate-900">Período:</strong> {selectedYear}
                  </p>
                  <p>
                    <strong className="text-slate-900">Fecha de Emisión:</strong> {currentDateStr}
                  </p>
                </div>
              </div>

              {/* Detalle de Acciones del Establecimiento */}
              <div className="space-y-6 pt-2">
                <h3 className="font-bold text-base md:text-lg text-slate-900 border-b pb-2">
                  Detalle de Acciones y Avance Financiero
                </h3>

                {schoolSummaries.map((school) => (
                  <div key={school.id} className="space-y-3">
                    <table className="w-full text-sm md:text-base text-left border-collapse border border-slate-400 table-fixed">
                      <thead>
                        <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
                          <th style={{ width: "48%" }} className="p-3 border border-slate-400 font-bold text-slate-900">
                            Nombre de la Acción
                          </th>
                          <th style={{ width: "16%" }} className="p-3 border border-slate-400 font-bold text-slate-900">
                            Dimensión
                          </th>
                          <th
                            style={{ width: "12%" }}
                            className="p-3 border border-slate-400 text-right font-bold text-slate-900"
                          >
                            Monto SEP
                          </th>
                          <th
                            style={{ width: "12%" }}
                            className="p-3 border border-slate-400 text-right font-bold text-slate-900"
                          >
                            Ejecutado OC
                          </th>
                          <th
                            style={{ width: "12%" }}
                            className="p-3 border border-slate-400 text-center font-bold text-slate-900"
                          >
                            % Avance
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {school.acciones.map((accion) => {
                          const usado = usageMap[accion.id] || 0;
                          const pct = accion.monto_sep > 0 ? (usado / accion.monto_sep) * 100 : 0;

                          return (
                            <tr key={accion.id} className="border-b border-slate-300">
                              <td
                                style={{ width: "48%" }}
                                className="p-3 border border-slate-300 font-semibold text-slate-900"
                              >
                                {accion.nombre}
                              </td>
                              <td
                                style={{ width: "16%" }}
                                className="p-3 border border-slate-300 text-slate-800 font-medium"
                              >
                                {accion.expand?.dimension?.nombre || accion.dimension || "N/A"}
                              </td>
                              <td
                                style={{ width: "12%" }}
                                className="p-3 border border-slate-300 text-right font-bold text-slate-900"
                              >
                                ${accion.monto_sep?.toLocaleString("es-CL")}
                              </td>
                              <td
                                style={{ width: "12%" }}
                                className="p-3 border border-slate-300 text-right font-semibold text-slate-900"
                              >
                                ${usado.toLocaleString("es-CL")}
                              </td>
                              <td
                                style={{ width: "12%" }}
                                className="p-3 border border-slate-300 text-center font-bold text-slate-900"
                              >
                                {pct.toFixed(1)}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>

              {/* Firmas / Pie de página */}
              <div className="pt-12 mt-8 border-t border-slate-400 flex justify-center text-center text-sm md:text-base">
                <div className="w-64">
                  <div className="border-t border-slate-500 w-48 md:w-56 mx-auto mb-2" />
                  <p className="font-bold text-slate-900">Coordinación Comunal S.E.P.</p>
                  <p className="text-slate-600">DAEM La Unión</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
