import { useMemo, useState } from "react";

import { ArrowDown, ArrowUp, ArrowUpDown, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Requirente } from "@/types/requirente";

interface PorcentajeGastoRrhhTableProps {
  schools: Requirente[];
  rrhhData: Record<string, number>;
  ingresosData: Record<string, number>;
  year: number;
  month: string;
}

export function PorcentajeGastoRrhhTable({
  schools,
  rrhhData,
  ingresosData,
  year,
  month,
}: PorcentajeGastoRrhhTableProps) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"nombre" | "rrhh" | "ingreso" | "porcentaje">("nombre");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const tableData = useMemo(() => {
    const data = schools.map((school) => {
      const rrhh = rrhhData[school.id] || 0;
      const ingreso = ingresosData[school.id] || 0;
      const porcentaje = ingreso > 0 ? (rrhh / ingreso) * 100 : 0;

      return {
        id: school.id,
        nombre: school.nombre,
        rrhh,
        ingreso,
        porcentaje,
      };
    });

    // Apply sorting
    return [...data].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [schools, rrhhData, ingresosData, sortField, sortDirection]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-2 h-4 w-4" />;
    return sortDirection === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const filteredData = useMemo(() => {
    if (!search) return tableData;
    const lowerSearch = search.toLowerCase();
    return tableData.filter((item) => item.nombre.toLowerCase().includes(lowerSearch));
  }, [tableData, search]);

  const handleExportExcel = () => {
    const exportData = filteredData.map((row) => ({
      Establecimiento: row.nombre,
      "Gasto RRHH": row.rrhh,
      "Ingreso Mensual SEP": row.ingreso,
      "% Uso": `${row.porcentaje.toFixed(1)}%`,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Porcentaje RRHH");

    // Adjust column widths
    const maxWidths = [
      { wch: 35 }, // Establecimiento
      { wch: 20 }, // Gasto RRHH
      { wch: 20 }, // Ingreso Mensual SEP
      { wch: 15 }, // % Uso
    ];
    worksheet["!cols"] = maxWidths;

    XLSX.writeFile(workbook, `Porcentaje_Gasto_RRHH_${month}_${year}_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return (
      value.toLocaleString("es-CL", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }) + "%"
    );
  };

  const getPorcentajeColor = (porcentaje: number) => {
    if (porcentaje > 70) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-bold";
    if (porcentaje > 50) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 font-bold";
    return "";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Buscar establecimiento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" size="sm" onClick={handleExportExcel} className="h-9">
          <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
          Descargar Excel
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => toggleSort("nombre")}
                  className="hover:bg-transparent p-0 font-bold h-auto"
                >
                  Establecimiento
                  <SortIcon field="nombre" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  onClick={() => toggleSort("rrhh")}
                  className="hover:bg-transparent p-0 font-bold h-auto ml-auto"
                >
                  Gasto RRHH
                  <SortIcon field="rrhh" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  onClick={() => toggleSort("ingreso")}
                  className="hover:bg-transparent p-0 font-bold h-auto ml-auto"
                >
                  Ingreso Mensual SEP
                  <SortIcon field="ingreso" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  onClick={() => toggleSort("porcentaje")}
                  className="hover:bg-transparent p-0 font-bold h-auto ml-auto"
                >
                  % Uso
                  <SortIcon field="porcentaje" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No se encontraron resultados.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.nombre}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.rrhh)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.ingreso)}</TableCell>
                  <TableCell className="text-right">
                    <span className={cn("px-2 py-1 rounded-full", getPorcentajeColor(item.porcentaje))}>
                      {formatPercent(item.porcentaje)}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
