"use client";

import { useMemo, useState } from "react";

import { ArrowDown, ArrowUp, ArrowUpDown, FileSpreadsheet, Settings2 } from "lucide-react";
import * as XLSX from "xlsx";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import type { ProyeccionSep } from "@/types/proyeccion-sep";
import type { Requirente } from "@/types/requirente";

interface ProyeccionSepTableProps {
  schools: Requirente[];
  projections: ProyeccionSep[];
  rrhhSums: Record<string, number>;
  rrhhProjectedSums: Record<string, number>;
  presupuestoProyectadoSums: Record<string, number>;
  schoolLatestMonthNames: Record<string, string>;
  schoolLatestRrhhMonthNames: Record<string, string>;
}

type SortKey =
  | "nombre"
  | "presupuesto"
  | "total_utilizado"
  | "compras_facturadas"
  | "compras_obligadas"
  | "rrhh"
  | "suma_facturado_rrhh"
  | "por_gastar"
  | "porcentaje_utilizado"
  | "porcentaje_pagado"
  | "rrhh_proyectado"
  | "presupuesto_proyectado"
  | "presupuesto_proyectado"
  | "porcentaje_factura_anual"
  | "porcentaje_aprox_utilizado";
type SortDirection = "asc" | "desc";

export function ProyeccionSepTable({
  schools,
  projections,
  rrhhSums,
  rrhhProjectedSums,
  presupuestoProyectadoSums,
  schoolLatestMonthNames,
  schoolLatestRrhhMonthNames,
}: ProyeccionSepTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("nombre");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Column width state
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    nombre: 160,
    presupuesto: 120,
    total_utilizado: 120,
    por_gastar: 120,
    porcentaje_utilizado: 90,
    porcentaje_pagado: 90,
    compras_facturadas: 120,
    compras_obligadas: 120,
    rrhh: 120,
    rrhh_proyectado: 130,
    suma_facturado_rrhh: 130,
    presupuesto_proyectado: 140,
    porcentaje_factura_anual: 110,
    porcentaje_aprox_utilizado: 110,
  });

  const [visibleColumns, setVisibleColumns] = useState<Record<SortKey, boolean>>({
    nombre: true,
    presupuesto: true,
    total_utilizado: true,
    por_gastar: true,
    porcentaje_utilizado: true,
    porcentaje_pagado: true,
    compras_facturadas: true,
    compras_obligadas: true,
    rrhh: true,
    rrhh_proyectado: true,
    suma_facturado_rrhh: true,
    presupuesto_proyectado: true,
    porcentaje_factura_anual: true,
    porcentaje_aprox_utilizado: true,
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const handleResizeStart = (e: React.MouseEvent, key: string) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = columnWidths[key];

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const currentX = moveEvent.clientX;
      const diff = currentX - startX;
      setColumnWidths((prev) => ({
        ...prev,
        [key]: Math.max(50, startWidth + diff), // Min width 50px
      }));
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const mergedData = useMemo(() => {
    return schools.map((school) => {
      const projection = projections.find((p) => p.establecimiento === school.id);
      const rrhhSum = rrhhSums[school.id] || 0;
      const rrhhProjected = rrhhProjectedSums[school.id] || 0;
      const presupuestoProyectado = presupuestoProyectadoSums[school.id] || 0;
      const mesProyectado = schoolLatestMonthNames[school.id] || "";
      const mesBaseRrhh = schoolLatestRrhhMonthNames[school.id] || "";

      const presupuesto = projection?.presupuesto || 0;
      const comprasFacturadas = projection?.compras_facturadas || 0;
      const comprasObligadas = projection?.compras_obligadas || 0;

      // New calculation per user request
      const totalUtilizado = comprasFacturadas + comprasObligadas + rrhhSum;

      const sumaFacturadoRrhh = comprasFacturadas + rrhhSum;
      const porGastar = presupuesto - totalUtilizado;
      const porcentajeUtilizado = presupuesto > 0 ? (totalUtilizado / presupuesto) * 100 : 0;
      const porcentajePagado = presupuesto > 0 ? (sumaFacturadoRrhh / presupuesto) * 100 : 0;

      const totalIngresoProyectado = presupuesto + presupuestoProyectado;
      const porcentajeFacturaAnual =
        totalIngresoProyectado > 0 ? (sumaFacturadoRrhh / totalIngresoProyectado) * 100 : 0;
      const porcentajeAproxUtilizado =
        totalIngresoProyectado > 0
          ? ((rrhhProjected + comprasObligadas + comprasFacturadas) / totalIngresoProyectado) * 100
          : 0;

      const shortName = school.nombre
        .replace(/Escuela/g, "Esc.")
        .replace(/Rural/g, "")
        .replace(/Colegio/g, "C.")
        .replace(/Tecnico/g, "Tec.")
        .replace(/Técnico/g, "Tec.")
        .replace(/Profesional/g, "Prof.")
        .trim()
        .slice(0, 20);

      return {
        id: school.id,
        nombre: shortName,
        presupuesto: presupuesto,
        total_utilizado: totalUtilizado,
        por_gastar: porGastar,
        porcentaje_utilizado: porcentajeUtilizado,
        porcentaje_pagado: porcentajePagado,
        compras_facturadas: comprasFacturadas,
        compras_obligadas: comprasObligadas,
        rrhh: rrhhSum,
        rrhh_proyectado: rrhhProjected,
        suma_facturado_rrhh: sumaFacturadoRrhh,
        presupuesto_proyectado: presupuestoProyectado,
        mes_proyectado: mesProyectado,
        mes_base_rrhh: mesBaseRrhh,
        porcentaje_factura_anual: porcentajeFacturaAnual,
        porcentaje_aprox_utilizado: porcentajeAproxUtilizado,
      };
    });
  }, [
    schools,
    projections,
    rrhhSums,
    rrhhProjectedSums,
    presupuestoProyectadoSums,
    schoolLatestMonthNames,
    schoolLatestRrhhMonthNames,
  ]);

  const sortedData = useMemo(() => {
    return [...mergedData].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [mergedData, sortKey, sortDirection]);

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ArrowUpDown className="ml-2 h-3 w-3 text-muted-foreground" />;
    return sortDirection === "asc" ? <ArrowUp className="ml-2 h-3 w-3" /> : <ArrowDown className="ml-2 h-3 w-3" />;
  };

  const handleExportExcel = () => {
    const exportData = sortedData.map((row) => ({
      Establecimiento: row.nombre,
      Presupuesto: row.presupuesto,
      "Total Utilizado": row.total_utilizado,
      "Por Gastar": row.por_gastar,
      "% Utilizado": `${row.porcentaje_utilizado.toFixed(1)}%`,
      "% Pagado": `${row.porcentaje_pagado.toFixed(1)}%`,
      "Compras Facturadas": row.compras_facturadas,
      "Compras Obligadas": row.compras_obligadas,
      RRHH: row.rrhh,
      "RRHH Proyectado": row.rrhh_proyectado,
      "Facturado + RRHH": row.suma_facturado_rrhh,
      "% Factura Anual": `${row.porcentaje_factura_anual.toFixed(1)}%`,
      "% APROX utilizado": `${row.porcentaje_aprox_utilizado.toFixed(1)}%`,
      "Presupuesto Proyectado": row.presupuesto_proyectado,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Proyección SEP");

    // Adjust column widths
    const maxWidths = [
      { wch: 30 }, // Establecimiento
      { wch: 15 }, // Presupuesto
      { wch: 15 }, // Total Utilizado
      { wch: 15 }, // Por Gastar
      { wch: 10 }, // % Utilizado
      { wch: 10 }, // % Pagado
      { wch: 15 }, // Compras Facturadas
      { wch: 15 }, // Compras Obligadas
      { wch: 15 }, // RRHH
      { wch: 15 }, // RRHH Proyectado
      { wch: 15 }, // Facturado + RRHH
      { wch: 15 }, // % Factura Anual
      { wch: 15 }, // % APROX utilizado
      { wch: 20 }, // Presupuesto Proyectado
    ];
    worksheet["!cols"] = maxWidths;

    XLSX.writeFile(workbook, `Proyeccion_SEP_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const renderHeader = (label: string | React.ReactNode, key: SortKey) => {
    if (!visibleColumns[key]) return null;

    return (
      <TableHead className="relative px-0 py-0" style={{ width: columnWidths[key] }}>
        <div className="flex h-full w-full items-center">
          <Button
            variant="ghost"
            onClick={() => handleSort(key)}
            className="h-auto min-h-8 w-full justify-center whitespace-normal px-2 py-1 text-center font-medium text-xs hover:bg-transparent"
          >
            <span className="flex-1 text-center">{label}</span>
            <SortIcon column={key} />
          </Button>
          {/* biome-ignore lint/a11y/useSemanticElements: Resizer handle is not exactly a HR */}
          <div
            onMouseDown={(e) => handleResizeStart(e, key)}
            className="absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-primary/50"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") {
                setColumnWidths((prev) => ({ ...prev, [key]: Math.max(50, prev[key] - 10) }));
              } else if (e.key === "ArrowRight") {
                setColumnWidths((prev) => ({ ...prev, [key]: prev[key] + 10 }));
              }
            }}
            role="separator"
            aria-orientation="vertical"
            aria-valuenow={columnWidths[key]}
            tabIndex={0}
            aria-label={`Redimensionar columna ${key}`}
          />
        </div>
      </TableHead>
    );
  };

  const columnLabels: Record<SortKey, string> = {
    nombre: "Establecimiento",
    presupuesto: "Presupuesto",
    total_utilizado: "Total Utilizado",
    por_gastar: "Por Gastar",
    porcentaje_utilizado: "% Utilizado",
    porcentaje_pagado: "% Pagado",
    compras_facturadas: "Compras Facturadas",
    compras_obligadas: "Compras Obligadas",
    rrhh: "RRHH",
    rrhh_proyectado: "RRHH Proyectado",
    suma_facturado_rrhh: "Facturado + RRHH",
    presupuesto_proyectado: "Presupuesto Proyectado",
    porcentaje_factura_anual: "% Factura Anual",
    porcentaje_aprox_utilizado: "% APROX utilizado",
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 70) return "bg-green-100 text-green-800 border-green-200 hover:bg-green-100";
    if (percentage >= 40) return "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100";
    return "bg-red-100 text-red-800 border-red-200 hover:bg-red-100";
  };

  const getPorGastarStyle = (amount: number) => {
    if (amount < 0) return "text-red-600 font-bold";
    return "text-emerald-700 font-medium";
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleExportExcel} className="h-8">
          <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
          Descargar Excel
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex h-8">
              <Settings2 className="mr-2 h-4 w-4" />
              Columnas
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {Object.keys(visibleColumns).map((key) => {
              if (key === "nombre") return null; // Always show name
              return (
                <DropdownMenuCheckboxItem
                  key={key}
                  className="capitalize"
                  checked={visibleColumns[key as SortKey]}
                  onCheckedChange={(checked) => setVisibleColumns((prev) => ({ ...prev, [key as SortKey]: !!checked }))}
                >
                  {columnLabels[key as SortKey]}
                </DropdownMenuCheckboxItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <Table className="w-full min-w-max">
          <TableHeader>
            <TableRow>
              <TableHead className="relative px-0 py-0" style={{ width: columnWidths.nombre }}>
                <div className="flex h-full w-full items-center">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("nombre")}
                    className="h-8 w-full justify-start truncate px-2 font-medium text-xs hover:bg-transparent"
                  >
                    Establecimiento
                    <SortIcon column="nombre" />
                  </Button>
                  {/* biome-ignore lint/a11y/useSemanticElements: Resizer handle is not exactly a HR */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, "nombre")}
                    className="absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-primary/50"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowLeft") {
                        setColumnWidths((prev) => ({ ...prev, nombre: Math.max(50, prev.nombre - 10) }));
                      } else if (e.key === "ArrowRight") {
                        setColumnWidths((prev) => ({ ...prev, nombre: prev.nombre + 10 }));
                      }
                    }}
                    role="separator"
                    aria-orientation="vertical"
                    aria-valuenow={columnWidths.nombre}
                    tabIndex={0}
                    aria-label="Redimensionar columna nombre"
                  />
                </div>
              </TableHead>
              {renderHeader("Presupuesto", "presupuesto")}
              {renderHeader("Total Utilizado", "total_utilizado")}
              {renderHeader("Por Gastar", "por_gastar")}
              {renderHeader("% Utilizado", "porcentaje_utilizado")}
              {renderHeader("% Pagado", "porcentaje_pagado")}
              {renderHeader("Compras Facturadas", "compras_facturadas")}
              {renderHeader("Compras Obligadas", "compras_obligadas")}
              {renderHeader(`RRHH Total`, "rrhh")}
              {renderHeader("RRHH Proyectado", "rrhh_proyectado")}
              {renderHeader("Facturado + RRHH", "suma_facturado_rrhh")}
              {renderHeader("% Factura Anual", "porcentaje_factura_anual")}
              {renderHeader("% APROX utilizado", "porcentaje_aprox_utilizado")}
              {renderHeader("Presupuesto Proyectado", "presupuesto_proyectado")}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={Object.values(visibleColumns).filter(Boolean).length}
                  className="h-12 text-center text-xs"
                >
                  No se encontraron establecimientos SEP activos.
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((row) => (
                <TableRow key={row.id}>
                  <TableCell
                    className="truncate border-r px-1 font-medium text-xs"
                    style={{ width: columnWidths.nombre, maxWidth: columnWidths.nombre }}
                  >
                    {row.nombre}
                  </TableCell>
                  {visibleColumns.presupuesto && (
                    <TableCell
                      className="truncate border-r px-0 py-1 text-right font-semibold text-primary text-xs"
                      style={{ width: columnWidths.presupuesto }}
                    >
                      {formatCurrency(row.presupuesto, {
                        locale: "es-CL",
                        currency: "CLP",
                        minimumFractionDigits: 0,
                      })}
                    </TableCell>
                  )}
                  {visibleColumns.total_utilizado && (
                    <TableCell
                      className="truncate border-r px-0 py-1 text-right font-semibold text-xs"
                      style={{ width: columnWidths.total_utilizado }}
                    >
                      {formatCurrency(row.total_utilizado, {
                        locale: "es-CL",
                        currency: "CLP",
                        minimumFractionDigits: 0,
                      })}
                    </TableCell>
                  )}
                  {visibleColumns.por_gastar && (
                    <TableCell
                      className={`truncate border-r px-0 py-1 text-right text-xs ${getPorGastarStyle(row.por_gastar)}`}
                      style={{ width: columnWidths.por_gastar }}
                    >
                      {formatCurrency(row.por_gastar, { locale: "es-CL", currency: "CLP", minimumFractionDigits: 0 })}
                    </TableCell>
                  )}
                  {visibleColumns.porcentaje_utilizado && (
                    <TableCell
                      className="truncate border-r px-1 py-1 text-right text-xs"
                      style={{ width: columnWidths.porcentaje_utilizado }}
                    >
                      <Badge
                        variant="outline"
                        className={`w-full justify-center ${getPercentageColor(row.porcentaje_utilizado)}`}
                      >
                        {row.porcentaje_utilizado.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  )}
                  {visibleColumns.porcentaje_pagado && (
                    <TableCell
                      className="truncate border-r px-1 py-1 text-right text-xs"
                      style={{ width: columnWidths.porcentaje_pagado }}
                    >
                      <Badge
                        variant="outline"
                        className={`w-full justify-center ${getPercentageColor(row.porcentaje_pagado)}`}
                      >
                        {row.porcentaje_pagado.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  )}
                  {visibleColumns.compras_facturadas && (
                    <TableCell
                      className="truncate border-r px-0 py-1 text-right font-medium text-muted-foreground text-xs"
                      style={{ width: columnWidths.compras_facturadas }}
                    >
                      {formatCurrency(row.compras_facturadas, {
                        locale: "es-CL",
                        currency: "CLP",
                        minimumFractionDigits: 0,
                      })}
                    </TableCell>
                  )}
                  {visibleColumns.compras_obligadas && (
                    <TableCell
                      className="truncate border-r px-0 py-1 text-right font-medium text-muted-foreground text-xs"
                      style={{ width: columnWidths.compras_obligadas }}
                    >
                      {formatCurrency(row.compras_obligadas, {
                        locale: "es-CL",
                        currency: "CLP",
                        minimumFractionDigits: 0,
                      })}
                    </TableCell>
                  )}
                  {visibleColumns.rrhh && (
                    <TableCell
                      className="truncate border-r bg-muted/20 px-0 py-1 text-right text-muted-foreground text-xs"
                      style={{ width: columnWidths.rrhh }}
                    >
                      {formatCurrency(row.rrhh, { locale: "es-CL", currency: "CLP", minimumFractionDigits: 0 })}
                    </TableCell>
                  )}
                  {visibleColumns.rrhh_proyectado && (
                    <TableCell
                      className="truncate border-r bg-amber-500/10 px-0 py-1 text-right text-muted-foreground text-xs"
                      style={{ width: columnWidths.rrhh_proyectado }}
                    >
                      <div className="flex flex-col items-end gap-0.5 px-2">
                        <span>
                          {formatCurrency(row.rrhh_proyectado, {
                            locale: "es-CL",
                            currency: "CLP",
                            minimumFractionDigits: 0,
                          })}
                        </span>
                        {row.mes_base_rrhh && (
                          <Badge
                            variant="outline"
                            className="h-4 border-amber-500/30 px-1 text-[10px] text-amber-600/70"
                          >
                            Base: {row.mes_base_rrhh}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.suma_facturado_rrhh && (
                    <TableCell
                      className="truncate bg-muted/20 px-0 py-1 text-right font-semibold text-muted-foreground text-xs"
                      style={{ width: columnWidths.suma_facturado_rrhh }}
                    >
                      {formatCurrency(row.suma_facturado_rrhh, {
                        locale: "es-CL",
                        currency: "CLP",
                        minimumFractionDigits: 0,
                      })}
                    </TableCell>
                  )}
                  {visibleColumns.porcentaje_factura_anual && (
                    <TableCell
                      className="truncate border-r px-1 py-1 text-right font-semibold text-xs"
                      style={{ width: columnWidths.porcentaje_factura_anual }}
                    >
                      <Badge
                        variant="outline"
                        className={`w-full justify-center ${getPercentageColor(row.porcentaje_factura_anual)}`}
                      >
                        {row.porcentaje_factura_anual.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  )}
                  {visibleColumns.porcentaje_aprox_utilizado && (
                    <TableCell
                      className="truncate border-r px-1 py-1 text-right font-semibold text-xs"
                      style={{ width: columnWidths.porcentaje_aprox_utilizado }}
                    >
                      <Badge
                        variant="outline"
                        className={`w-full justify-center ${getPercentageColor(row.porcentaje_aprox_utilizado)}`}
                      >
                        {row.porcentaje_aprox_utilizado.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  )}
                  {visibleColumns.presupuesto_proyectado && (
                    <TableCell
                      className="truncate bg-blue-500/10 px-0 py-1 text-right font-semibold text-primary text-xs"
                      style={{ width: columnWidths.presupuesto_proyectado }}
                    >
                      <div className="flex flex-col items-end gap-0.5 px-2">
                        <span>
                          {formatCurrency(row.presupuesto_proyectado, {
                            locale: "es-CL",
                            currency: "CLP",
                            minimumFractionDigits: 0,
                          })}
                        </span>
                        {row.mes_proyectado && (
                          <Badge variant="outline" className="h-4 border-primary/30 px-1 text-[10px] text-primary/70">
                            Base: {row.mes_proyectado}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
