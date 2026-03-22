"use client";

import { useCallback, useEffect, useState } from "react";

import { Loader2, Plus, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getIngresosMensualesSep } from "@/services/ingresos-mensuales-sep.service";
import type { IngresoMensualSep, Mes } from "@/types/ingreso-mensual-sep";

import { IngresoMensualSepDialog } from "./components/ingreso-mensual-sep-dialog";
import { IngresosMensualesSepTable } from "./components/ingresos-mensuales-sep-table";

const MESES: Mes[] = [
  "Saldo Inicial",
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export default function IngresosSepPage() {
  const [data, setData] = useState<{
    items: IngresoMensualSep[];
    totalItems: number;
    totalPages: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedIngreso, setSelectedIngreso] = useState<IngresoMensualSep | null>(null);
  const [sort, setSort] = useState("requirente.nombre");

  // Filters state
  const currentMonthIndex = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const [selectedMes, setSelectedMes] = useState<Mes | "all">(MESES[currentMonthIndex + 1]);
  const [selectedAnio, setSelectedAnio] = useState<number>(currentYear);

  const loadIngresos = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getIngresosMensualesSep({
        page,
        perPage: 20,
        sort,
        mes: selectedMes === "all" ? undefined : selectedMes,
        anio: selectedAnio,
      });
      setData({
        items: result.items,
        totalItems: result.totalItems,
        totalPages: result.totalPages,
      });
    } catch (err) {
      const error = err as Error;
      console.error("Error loading ingresos:", error);
    } finally {
      setLoading(false);
    }
  }, [page, selectedMes, selectedAnio, sort]);

  useEffect(() => {
    loadIngresos();
  }, [loadIngresos]);

  const handleSort = (field: string) => {
    if (sort === field) {
      setSort(`-${field}`);
    } else {
      setSort(field);
    }
  };

  const handleEdit = (ingreso: IngresoMensualSep) => {
    setSelectedIngreso(ingreso);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedIngreso(null);
    setIsDialogOpen(true);
  };

  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-emerald-100 p-2">
            <Wallet className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="font-bold text-2xl text-gray-900 tracking-tight">Ingresos Mensuales SEP</h1>
            <p className="text-gray-500 text-sm">Gestión de ingresos por establecimiento y mes</p>
          </div>
        </div>
        <Button onClick={handleCreate} className="bg-emerald-600 text-white shadow-sm hover:bg-emerald-700">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Ingreso
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex min-w-[150px] flex-col gap-1.5">
          <span className="font-semibold text-gray-500 text-xs uppercase tracking-wider">Mes</span>
          <Select
            value={selectedMes}
            onValueChange={(val) => {
              setSelectedMes(val as Mes | "all");
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Filtrar por mes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los meses</SelectItem>
              {MESES.map((mes) => (
                <SelectItem key={mes} value={mes}>
                  {mes}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex min-w-[120px] flex-col gap-1.5">
          <span className="font-semibold text-gray-500 text-xs uppercase tracking-wider">Año</span>
          <Select
            value={selectedAnio.toString()}
            onValueChange={(val) => {
              setSelectedAnio(Number(val));
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Filtrar por año" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <div className="space-y-4">
          <IngresosMensualesSepTable
            data={data?.items || []}
            onEdit={handleEdit}
            onRefresh={loadIngresos}
            sort={sort}
            onSort={handleSort}
          />

          {data && data.totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink isActive className="border-emerald-200 bg-emerald-50 text-emerald-700">
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                      className={page === data.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      )}

      <IngresoMensualSepDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        ingreso={selectedIngreso}
        onSuccess={loadIngresos}
      />
    </div>
  );
}
