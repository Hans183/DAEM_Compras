"use client";

import { useCallback, useEffect, useState } from "react";

import { Loader2, Plus, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getIngresosMensualesSep } from "@/services/ingresos-mensuales-sep.service";
import { getRequirentes } from "@/services/requirentes.service";
import type { IngresoMensualSep, Mes } from "@/types/ingreso-mensual-sep";
import type { Requirente } from "@/types/requirente";

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
const CUSTOM_ORDER = [
  "Colegio de Cultura y Difusión Artistica",
  "Liceo RAAC",
  "Escuela La Unión",
  "Escuela J.A.R.",
  "Escuela Radimadi",
  "Colegio Técnico Profesional H.O.V.",
  "Escuela Rural Catamutún",
  "Escuela Rural Choroico",
  "Escuela Rural Puerto Nuevo",
  "Escuela Rural Los Esteros",
  "Escuela Rural Folleco",
  "Escuela Rural Cuinco",
  "Escuela Rural Huillinco",
  "Escuela Rural Traiguén",
  "Escuela Rural Carimanca",
  "Escuela Rural Flor María Luisa M.",
  "Escuela Aldea Campesina",
  "Escuela Rural Llancacura",
  "Escuela Rural Mashue",
  "Escuela Rural Pilpilcahuin",
  "Escuela Rural El Huape",
  "Escuela Rural Los Chilcos",
  "Escuela Rural Huacahue",
  "Escuela El Maitén",
];

export default function IngresosSepPage() {
  const [data, setData] = useState<{
    items: IngresoMensualSep[];
    totalItems: number;
    totalPages: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedIngreso, setSelectedIngreso] = useState<IngresoMensualSep | null>(null);
  const [sort, setSort] = useState("requirente.nombre");
  const [allRequirentes, setAllRequirentes] = useState<Requirente[]>([]);

  // Filters state
  const currentMonthIndex = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const [selectedMes, setSelectedMes] = useState<Mes | "all">(MESES[currentMonthIndex + 1]);
  const [selectedAnio, setSelectedAnio] = useState<number>(currentYear);

  useEffect(() => {
    const fetchRequirentes = async () => {
      try {
        const result = await getRequirentes({ perPage: 200, sort: "nombre", sep_filter: true });

        // Sort by custom order
        const getOrderIndex = (name: string) => {
          const lowerName = name.toLowerCase();
          const targetIndex = CUSTOM_ORDER.findIndex((ordered) => {
            const lowerOrdered = ordered.toLowerCase().replace(/\./g, ""); // Remove dots for better acronym matching
            const cleanName = lowerName.replace(/\./g, "");

            if (cleanName.includes(lowerOrdered) || lowerOrdered.includes(cleanName)) return true;

            // Handle common acronyms like RAAC or JAR
            const acronym = lowerOrdered.split(" ").pop() || "";
            if (acronym.length >= 3 && cleanName.includes(acronym)) return true;

            return false;
          });
          return targetIndex === -1 ? 999 : targetIndex;
        };

        const sortedItems = [...result.items].sort((a, b) => {
          return getOrderIndex(a.nombre) - getOrderIndex(b.nombre);
        });

        setAllRequirentes(sortedItems);
      } catch (error) {
        console.error("Error fetching requirentes:", error);
      }
    };
    fetchRequirentes();
  }, []);

  const loadIngresos = useCallback(async () => {
    if (allRequirentes.length === 0) return;
    setLoading(true);
    try {
      const result = await getIngresosMensualesSep({
        page: 1,
        perPage: 500, // Fetch all to merge
        sort,
        mes: selectedMes === "all" ? undefined : selectedMes,
        anio: selectedAnio,
      });

      // Merge allRequirentes with result.items
      const mergedItems: IngresoMensualSep[] = allRequirentes.map((req) => {
        const existing = result.items.find((item) => item.requirente === req.id);
        if (existing) return existing;

        // Return a placeholder for missing ones
        return {
          id: `new-${req.id}`,
          requirente: req.id,
          mes: selectedMes === "all" ? "Enero" : selectedMes,
          anio: selectedAnio,
          prioritarios: 0,
          preferentes: 0,
          prio_10: 0,
          pref_10: 0,
          prio_reflejar: 0,
          pref_reflejar: 0,
          total_reflejar: 0,
          expand: { requirente: req },
          created: "",
          updated: "",
          collectionId: "",
          collectionName: "",
        } as IngresoMensualSep;
      });

      setData({
        items: mergedItems,
        totalItems: mergedItems.length,
        totalPages: 1,
      });
    } catch (err) {
      const error = err as Error;
      console.error("Error loading ingresos:", error);
    } finally {
      setLoading(false);
    }
  }, [allRequirentes, selectedMes, selectedAnio, sort]);

  useEffect(() => {
    if (allRequirentes.length > 0) {
      loadIngresos();
    }
  }, [loadIngresos, allRequirentes]);

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
