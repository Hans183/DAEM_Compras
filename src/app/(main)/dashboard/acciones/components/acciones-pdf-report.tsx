"use client";

import type React from "react";
import { useMemo } from "react";

import { AlertCircle, FileText, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Accion } from "@/types/accion";
import type { Compra } from "@/types/compra";

interface AccionesPdfReportProps {
  data: Accion[];
  usageMap: Record<string, number>;
  allCompras?: Compra[];
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
  allCompras = [],
  selectedYear,
  selectedEstablecimientoId,
  selectedEstablecimientoName,
  trigger,
}: AccionesPdfReportProps) {
  // Map purchases and OCs by action ID
  const comprasByAccionMap = useMemo(() => {
    const map: Record<string, Array<{ ord: string; descripcion: string; oc: string; monto: number }>> = {};

    (allCompras || []).forEach((compra) => {
      const accionId = compra.accion;
      if (!accionId) return;

      if (!map[accionId]) {
        map[accionId] = [];
      }
      const ocs = compra.expand?.["ordenes_compra(compra)"];
      const ordStr = compra.numero_ordinario ? `Ord. N° ${compra.numero_ordinario}` : "-";
      const descStr = compra.descripcion || "-";

      if (ocs && ocs.length > 0) {
        ocs.forEach((ocItem) => {
          map[accionId].push({
            ord: ordStr,
            descripcion: descStr,
            oc: ocItem.oc || "Sin código",
            monto: ocItem.oc_valor || 0,
          });
        });
      } else {
        map[accionId].push({
          ord: ordStr,
          descripcion: descStr,
          oc: "Sin Orden de Compra asignada",
          monto: compra.presupuesto || 0,
        });
      }
    });

    return map;
  }, [allCompras]);

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
              padding: 16px;
              color: #0f172a;
              background-color: #ffffff;
              font-size: 13px;
              line-height: 1.4;
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
            table {
              width: 100% !important;
              border-collapse: collapse;
              margin-top: 6px;
              margin-bottom: 12px;
              table-layout: fixed !important;
            }
            tbody {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
            tr {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
            th, td {
              border: 1px solid #94a3b8;
              padding: 6px 8px;
              text-align: left;
              word-wrap: break-word;
              overflow-wrap: break-word;
              font-size: 12px !important;
            }
            th {
              background-color: #f1f5f9 !important;
              font-weight: 700;
              color: #0f172a;
              font-size: 12px !important;
            }
            /* Explicit column widths for main action table */
            .main-table th:nth-child(1), .main-table td:nth-child(1) { width: 40% !important; }
            .main-table th:nth-child(2), .main-table td:nth-child(2) { width: 20% !important; }
            .main-table th:nth-child(3), .main-table td:nth-child(3) { width: 14% !important; }
            .main-table th:nth-child(4), .main-table td:nth-child(4) { width: 14% !important; }
            .main-table th:nth-child(5), .main-table td:nth-child(5) { width: 12% !important; }

            .sub-table th, .sub-table td {
              padding: 3px 6px !important;
              font-size: 11px !important;
            }
            .sub-table th:nth-child(1), .sub-table td:nth-child(1) { width: 14% !important; }
            .sub-table th:nth-child(2), .sub-table td:nth-child(2) { width: 54% !important; }
            .sub-table th:nth-child(3), .sub-table td:nth-child(3) { width: 18% !important; }
            .sub-table th:nth-child(4), .sub-table td:nth-child(4) { width: 14% !important; }
            .sub-table th {
              background-color: #e2e8f0 !important;
            }

            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-bold { font-weight: 700; }
            .font-semibold { font-weight: 600; }
            .font-medium { font-weight: 500; }
            .uppercase { text-transform: uppercase; }
            .italic { font-style: italic; }
            .border-b { border-bottom: 1px solid #cbd5e1; }
            .border-b-2 { border-bottom: 2px solid #0f172a; }
            .border-t { border-top: 1px solid #cbd5e1; }
            .pb-4 { padding-bottom: 16px; }
            .mb-2 { margin-bottom: 8px; }
            .mt-1 { margin-top: 4px; }
            .mt-6 { margin-top: 24px; }
            .pt-8 { padding-top: 32px; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .justify-center { justify-content: center; }
            .rounded-xl { border-radius: 12px; }
            .rounded-lg { border-radius: 8px; }
            .bg-slate-50 { background-color: #f8fafc !important; }
            .bg-slate-100 { background-color: #f1f5f9 !important; }
            .bg-slate-200 { background-color: #e2e8f0 !important; }
            .border { border: 1px solid #cbd5e1; }
            .p-2 { padding: 8px; }
            .p-3 { padding: 12px; }
            .text-xs { font-size: 11px !important; }
            .text-sm { font-size: 13px !important; }
            .text-base { font-size: 14px !important; }
            .text-lg { font-size: 16px !important; }
            .text-xl { font-size: 18px !important; }
            .text-2xl { font-size: 22px !important; }
            .text-slate-500 { color: #64748b; }
            .text-slate-600 { color: #475569; }
            .text-slate-700 { color: #334155; }
            .text-slate-900 { color: #0f172a; }
            .space-y-1 > * + * { margin-top: 4px; }
            .space-y-3 > * + * { margin-top: 12px; }
            .space-y-6 > * + * { margin-top: 24px; }
            .w-64 { width: 256px; }
            .w-48 { width: 192px; }
            .mx-auto { margin-left: auto; margin-right: auto; }
            @page {
              size: letter portrait;
              margin: 10mm 8mm;
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
              className="mx-auto max-w-[1100px] bg-white p-6 md:p-10 border rounded-xl shadow-sm space-y-6"
            >
              {/* Header Documento DAEM */}
              <div className="border-b-2 border-slate-900 pb-4 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <h1 className="text-lg md:text-xl font-black tracking-tight text-slate-900 uppercase">
                    DEPARTAMENTO DE ADMINISTRACIÓN DE EDUCACIÓN MUNICIPAL (DAEM)
                  </h1>
                  <h2 className="text-sm md:text-base font-bold text-slate-700 mt-0.5">
                    Informe de Ejecución de Acciones SEP y Avance Financiero
                  </h2>
                  <h3 className="text-sm font-bold text-primary mt-0.5">
                    ESTABLECIMIENTO: {selectedEstablecimientoName || "N/A"}
                  </h3>
                </div>
                <div className="text-left md:text-right text-xs text-slate-600 space-y-0.5 bg-slate-50 p-2.5 rounded-lg border md:border-none md:bg-transparent">
                  <p>
                    <strong className="text-slate-900">Período:</strong> {selectedYear}
                  </p>
                  <p>
                    <strong className="text-slate-900">Fecha de Emisión:</strong> {currentDateStr}
                  </p>
                </div>
              </div>

              {/* Detalle de Acciones del Establecimiento */}
              <div className="space-y-4 pt-1">
                <h3 className="font-bold text-sm md:text-base text-slate-900 border-b pb-1.5">
                  Detalle de Acciones y Avance Financiero
                </h3>

                {schoolSummaries.map((school) => (
                  <div key={school.id} className="space-y-4">
                    <table className="main-table w-full text-xs md:text-sm border-collapse border border-slate-400 table-fixed">
                      <thead>
                        <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
                          <th style={{ width: "40%" }} className="p-2 border border-slate-400 font-bold text-slate-900">
                            Nombre de la Acción
                          </th>
                          <th style={{ width: "20%" }} className="p-2 border border-slate-400 font-bold text-slate-900">
                            Dimensión
                          </th>
                          <th
                            style={{ width: "14%" }}
                            className="p-2 border border-slate-400 text-right font-bold text-slate-900"
                          >
                            Monto SEP
                          </th>
                          <th
                            style={{ width: "14%" }}
                            className="p-2 border border-slate-400 text-right font-bold text-slate-900"
                          >
                            Ejecutado OC
                          </th>
                          <th
                            style={{ width: "12%" }}
                            className="p-2 border border-slate-400 text-center font-bold text-slate-900"
                          >
                            % Avance
                          </th>
                        </tr>
                      </thead>
                      {school.acciones.map((accion) => {
                        const usado = usageMap[accion.id] || 0;
                        const pct = accion.monto_sep > 0 ? (usado / accion.monto_sep) * 100 : 0;
                        const comprasAsociadas = comprasByAccionMap[accion.id] || [];

                        return (
                          <tbody
                            key={accion.id}
                            style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
                            className="border-b-2 border-slate-400"
                          >
                            {/* Fila principal de la acción */}
                            <tr className="bg-slate-100/70 border-t border-slate-400">
                              <td
                                style={{ width: "40%" }}
                                className="p-2 border border-slate-400 font-bold text-slate-900"
                              >
                                {accion.nombre}
                              </td>
                              <td
                                style={{ width: "20%" }}
                                className="p-2 border border-slate-400 text-slate-800 font-medium"
                              >
                                {accion.expand?.dimension?.nombre || accion.dimension || "N/A"}
                              </td>
                              <td
                                style={{ width: "14%" }}
                                className="p-2 border border-slate-400 text-right font-bold text-slate-900"
                              >
                                ${accion.monto_sep?.toLocaleString("es-CL")}
                              </td>
                              <td
                                style={{ width: "14%" }}
                                className="p-2 border border-slate-400 text-right font-semibold text-slate-900"
                              >
                                ${usado.toLocaleString("es-CL")}
                              </td>
                              <td
                                style={{ width: "12%" }}
                                className="p-2 border border-slate-400 text-center font-bold text-slate-900"
                              >
                                {pct.toFixed(1)}%
                              </td>
                            </tr>

                            {/* Fila desglosada con compras y órdenes de compra */}
                            <tr className="bg-white">
                              <td colSpan={5} className="p-2 pl-4 border border-slate-300">
                                {comprasAsociadas.length === 0 ? (
                                  <p className="text-[11px] text-slate-500 italic py-0.5">Sin compras asociadas</p>
                                ) : (
                                  <div className="space-y-1 py-0.5">
                                    <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                      Compras y Órdenes de Compra vinculadas:
                                    </p>
                                    <table className="sub-table w-full text-[11px] border-collapse border border-slate-300 bg-slate-50/50">
                                      <thead>
                                        <tr className="bg-slate-200/80 text-slate-800 font-bold border-b border-slate-300">
                                          <th
                                            style={{ width: "14%" }}
                                            className="p-1 border border-slate-300 text-left"
                                          >
                                            N° Ordinario
                                          </th>
                                          <th
                                            style={{ width: "54%" }}
                                            className="p-1 border border-slate-300 text-left"
                                          >
                                            Descripción Compra
                                          </th>
                                          <th
                                            style={{ width: "18%" }}
                                            className="p-1 border border-slate-300 text-left"
                                          >
                                            N° Orden Compra (OC)
                                          </th>
                                          <th
                                            style={{ width: "14%" }}
                                            className="p-1 border border-slate-300 text-right"
                                          >
                                            Monto ($)
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {comprasAsociadas.map((item, idx) => (
                                          <tr key={`${accion.id}-item-${idx}`} className="border-b border-slate-200">
                                            <td
                                              style={{ width: "14%" }}
                                              className="p-1 border border-slate-200 font-semibold text-slate-800"
                                            >
                                              {item.ord}
                                            </td>
                                            <td
                                              style={{ width: "54%" }}
                                              className="p-1 border border-slate-200 text-slate-700"
                                            >
                                              {item.descripcion}
                                            </td>
                                            <td
                                              style={{ width: "18%" }}
                                              className="p-1 border border-slate-200 font-medium text-slate-900"
                                            >
                                              {item.oc === "Sin Orden de Compra asignada" ? (
                                                <span className="text-slate-400 italic">{item.oc}</span>
                                              ) : (
                                                item.oc
                                              )}
                                            </td>
                                            <td
                                              style={{ width: "14%" }}
                                              className="p-1 border border-slate-200 text-right font-bold text-slate-900"
                                            >
                                              ${item.monto.toLocaleString("es-CL")}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </td>
                            </tr>
                          </tbody>
                        );
                      })}
                    </table>
                  </div>
                ))}
              </div>

              {/* Firmas / Pie de página */}
              <div className="pt-8 mt-6 border-t border-slate-400 flex justify-center text-center text-xs md:text-sm">
                <div className="w-64">
                  <div className="border-t border-slate-500 w-48 md:w-56 mx-auto mb-1.5" />
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
