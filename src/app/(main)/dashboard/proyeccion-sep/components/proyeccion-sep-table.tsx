"use client";

import { useMemo, useState } from "react";

import { ArrowDown, ArrowUp, ArrowUpDown, Settings2 } from "lucide-react";

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

import { EditableCell } from "./editable-cell";

interface ProyeccionSepTableProps {
  schools: Requirente[];
  projections: ProyeccionSep[];
  rrhhSums: Record<string, number>;
  rrhhProjectedSums: Record<string, number>;
  year: number;
  onUpdate: (schoolId: string, field: keyof ProyeccionSep, value: number) => void;
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
  | "rrhh_proyectado";
type SortDirection = "asc" | "desc";

export function ProyeccionSepTable({
  schools,
  projections,
  rrhhSums,
  rrhhProjectedSums,
  year,
  onUpdate,
}: ProyeccionSepTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("nombre");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Column width state
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    nombre: 80,
    presupuesto: 100,
    total_utilizado: 100,
    por_gastar: 100,
    porcentaje_utilizado: 80,
    porcentaje_pagado: 80,
    compras_facturadas: 100,
    compras_obligadas: 100,
    rrhh: 100,
    rrhh_proyectado: 110,
    suma_facturado_rrhh: 100,
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

      const presupuesto = projection?.presupuesto || 0;
      const comprasFacturadas = projection?.compras_facturadas || 0;
      const comprasObligadas = projection?.compras_obligadas || 0;

      // New calculation per user request
      const totalUtilizado = comprasFacturadas + comprasObligadas + rrhhSum;

      const sumaFacturadoRrhh = comprasFacturadas + rrhhSum;
      const porGastar = presupuesto - totalUtilizado;
      const porcentajeUtilizado = presupuesto > 0 ? (totalUtilizado / presupuesto) * 100 : 0;
      const porcentajePagado = presupuesto > 0 ? (sumaFacturadoRrhh / presupuesto) * 100 : 0;

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
      };
    });
  }, [schools, projections, rrhhSums, rrhhProjectedSums]);

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
          {/* Resizer Handle */}
          <div
            onMouseDown={(e) => handleResizeStart(e, key)}
            className="absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-primary/50"
            onClick={(e) => e.stopPropagation()}
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
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto flex h-8">
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
        <Table className="w-full table-fixed">
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
                  <div
                    onMouseDown={(e) => handleResizeStart(e, "nombre")}
                    className="absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-primary/50"
                    onClick={(e) => e.stopPropagation()}
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
                    <TableCell className="border-r p-1 px-0 text-right" style={{ width: columnWidths.presupuesto }}>
                      <EditableCell value={row.presupuesto} onSave={(val) => onUpdate(row.id, "presupuesto", val)} />
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
                      className="border-r p-1 px-0 text-right"
                      style={{ width: columnWidths.compras_facturadas }}
                    >
                      <EditableCell
                        value={row.compras_facturadas}
                        onSave={(val) => onUpdate(row.id, "compras_facturadas", val)}
                      />
                    </TableCell>
                  )}
                  {visibleColumns.compras_obligadas && (
                    <TableCell
                      className="border-r p-1 px-0 text-right"
                      style={{ width: columnWidths.compras_obligadas }}
                    >
                      <EditableCell
                        value={row.compras_obligadas}
                        onSave={(val) => onUpdate(row.id, "compras_obligadas", val)}
                      />
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
                      {formatCurrency(row.rrhh_proyectado, {
                        locale: "es-CL",
                        currency: "CLP",
                        minimumFractionDigits: 0,
                      })}
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
