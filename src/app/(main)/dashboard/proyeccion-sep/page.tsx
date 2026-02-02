"use client";

import { useEffect, useState, useMemo } from "react";
import type { ListResult } from "pocketbase";
import { getProyeccionSepList, createProyeccionSep, updateProyeccionSep } from "@/services/proyeccion-sep.service";
import { getRrhhSepList } from "@/services/rrhh-sep.service";
import { getRequirentes } from "@/services/requirentes.service";
import type { ProyeccionSep, ProyeccionSepFormData } from "@/types/proyeccion-sep";
import type { Requirente } from "@/types/requirente";
import { ProyeccionSepTable } from "./components/proyeccion-sep-table";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

export default function ProyeccionSepPage() {
    const searchParams = useSearchParams();
    const search = searchParams.get("search") || "";

    // We will hold both raw lists and merge them for the view
    const [schools, setSchools] = useState<Requirente[]>([]);
    const [projections, setProjections] = useState<ProyeccionSep[]>([]);

    // Auxiliary data
    const [rrhhSums, setRrhhSums] = useState<Record<string, number>>({});
    const [rrhhProjectedSums, setRrhhProjectedSums] = useState<Record<string, number>>({});

    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

    const loadData = async () => {
        setLoading(true);
        try {
            // 1. Fetch ALL SEP establishments
            const schoolsResult = await getRequirentes({
                perPage: 500,
                sep_filter: true,
                active_filter: true,
                sort: "nombre"
            });
            setSchools(schoolsResult.items);

            // 2. Fetch existing projections
            const projectionResult = await getProyeccionSepList({ perPage: 500 });
            setProjections(projectionResult.items);

            // 3. Fetch RRHH data for calculation (Filtered by Selected Year)
            const rrhhResult = await getRrhhSepList({
                perPage: 500,
                anio_filter: selectedYear
            });

            const sums: Record<string, number> = {};

            // Logic for RRHH Projected: Fill forward 0 values
            const schoolMonthlyData: Record<string, Record<string, number>> = {};
            const projectedSums: Record<string, number> = {};

            // First pass: Organize real data by school and month
            rrhhResult.items.forEach(item => {
                const schoolId = item.escuelas;
                if (!sums[schoolId]) sums[schoolId] = 0;
                sums[schoolId] += item.total;

                if (!schoolMonthlyData[schoolId]) schoolMonthlyData[schoolId] = {};
                schoolMonthlyData[schoolId][item.mes] = item.total;
            });
            setRrhhSums(sums);

            // Second pass: Calculate projected sums
            const MONTHS = [
                "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
            ];

            schoolsResult.items.forEach(school => {
                const schoolId = school.id;
                const monthlyData = schoolMonthlyData[schoolId] || {};

                let projectedSum = 0;
                let lastNonZero = 0;

                MONTHS.forEach(month => {
                    const val = monthlyData[month] || 0;
                    if (val > 0) {
                        lastNonZero = val;
                    }
                    // If current is 0, use lastNonZero (projected), otherwise use actual
                    const effectiveVal = val > 0 ? val : lastNonZero;
                    projectedSum += effectiveVal;
                });

                projectedSums[schoolId] = projectedSum;
            });
            setRrhhProjectedSums(projectedSums);

        } catch (error) {
            console.error("Error loading Proyeccion SEP data:", error);
            toast.error("Error al cargar datos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [selectedYear]);

    const handleUpdate = async (schoolId: string, field: keyof ProyeccionSep, value: number) => {
        try {
            // Find if record exists
            const existing = projections.find(p => p.establecimiento === schoolId);

            if (existing) {
                // Update
                const updated = await updateProyeccionSep(existing.id, { [field]: value });

                // Update state locally to reflect immediate change (optimistic or just sync)
                setProjections(prev => prev.map(p => p.id === updated.id ? updated : p));
                toast.success("Actualizado correctamente");
            } else {
                // Create new
                // Need to initialize other fields to 0 or valid defaults if required
                // Assuming schema fields allow default 0 or we explicitly set them
                const payload: ProyeccionSepFormData = {
                    establecimiento: schoolId,
                    presupuesto: 0,
                    total_utilizado: 0,
                    compras_facturadas: 0,
                    compras_obligadas: 0,
                    rrhh: "", // Relation to RRHH record? Or is this unused/optional?
                    // The schema has 'rrhh' as a string relation. 
                    // Based on separate 'sep_rrhh' collection, this field might be:
                    // 1. A link to a *summary* object?
                    // 2. Or maybe unused if we calculate from `sep_rrhh`?
                    // I'll send empty string if allowed, or if it fails I need to know what it expects.
                    // Given the user schema, it is `rrhh: "RELATION_RECORD_ID"`.
                    // If it's required, we might have an issue. If optional, "" is fine.
                    // I'll update the value for the specific field we are editing.
                    [field]: value
                } as ProyeccionSepFormData; // casting to bypass strict checks just for this partial fill

                // Safe construction
                const newItem = await createProyeccionSep(payload);
                setProjections(prev => [...prev, newItem]);
                toast.success("Registro creado correctamente");
            }
        } catch (error) {
            console.error("Error updating projection:", error);
            toast.error("Error al guardar cambios");
        }
    };

    const filteredSchools = useMemo(() => {
        if (!search) return schools;
        const lowerSearch = search.toLowerCase();
        return schools.filter(s => s.nombre.toLowerCase().includes(lowerSearch));
    }, [schools, search]);

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Proyección SEP</h1>
                    <p className="text-muted-foreground">
                        Gestión de presupuesto y gastos SEP por establecimiento.
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="w-[120px]">
                    <Input
                        type="number"
                        placeholder="Año"
                        value={selectedYear}
                        onChange={(e) => {
                            const val = Number(e.target.value);
                            if (val > 2000 && val < 2100) {
                                setSelectedYear(val);
                            }
                        }}
                    />
                </div>
                <div className="text-sm text-muted-foreground">
                    Calculando acciones y RRHH para: <span className="font-semibold">{selectedYear}</span>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-8">
                    <div className="text-muted-foreground">Cargando registros...</div>
                </div>
            ) : (
                <ProyeccionSepTable
                    schools={filteredSchools}
                    projections={projections}
                    rrhhSums={rrhhSums}
                    rrhhProjectedSums={rrhhProjectedSums}
                    year={selectedYear}
                    onUpdate={handleUpdate}
                />
            )}
        </div>
    );
}
