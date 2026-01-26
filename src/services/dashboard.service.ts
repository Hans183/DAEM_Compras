import { getCompras } from "./compras.service";
import type { Compra } from "@/types/compra";

import { differenceInDays, parseISO, format } from "date-fns";
import { es } from "date-fns/locale";

export interface DashboardStats {
    totalSpent: number;
    totalOrders: number;
    avgCycleTime: number; // New metric
    cycleTimeTrend: { month: string; days: number }[]; // New metric
    funnelData: { stage: string; count: number; fill: string }[]; // New metric
    stagnationCount: number; // New metric
    rankingCompradores: { name: string; amount: number; count: number }[];
    rankingUnidades: { name: string; amount: number; count: number }[];
    rankingSubvenciones: { name: string; amount: number; count: number }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
    const currentYear = new Date().getFullYear();
    const records = await getCompras({
        perPage: 1000,
        sort: "-created",
        created_from: `${currentYear}-01-01 00:00:00`,
    });

    const items = records.items;

    const totalSpent = items.reduce((sum, item) => sum + (item.presupuesto || 0), 0);
    const totalOrders = items.length;

    // Aggregations
    const compradoresMap = new Map<string, { amount: number; count: number }>();
    const unidadesMap = new Map<string, { amount: number; count: number }>();
    const subvencionesMap = new Map<string, { amount: number; count: number }>();

    // Cycle Time & Stagnation Calculation
    let totalDays = 0;
    let validCycleCount = 0;
    const monthlyCycleMap = new Map<string, { totalDays: number; count: number }>();
    let stagnationCount = 0;
    const now = new Date();

    // Funnel Counters
    let countAssigned = 0;
    let countWithOC = 0;
    let countCompleted = 0;

    items.forEach((item) => {
        // Funnel Logic
        if (item.comprador) countAssigned++;

        const hasOC = item.expand?.["ordenes_compra(compra)"] && item.expand["ordenes_compra(compra)"].length > 0;
        if (hasOC) countWithOC++;

        const isCompleted = ["Comprado", "Entregado", "En Bodega", "Recepcionado"].includes(item.estado);
        if (isCompleted) countCompleted++;

        // Stagnation Logic
        // Ignore terminal states
        if (!["Anulado", "Entregado", "Comprado", "En Bodega"].includes(item.estado)) {
            const lastUpdate = new Date(item.updated);
            const daysSinceUpdate = differenceInDays(now, lastUpdate);
            if (daysSinceUpdate > 10) {
                stagnationCount++;
            }
        }

        // Stats aggregation
        const compradorName = item.expand?.comprador?.name || "Sin Asignar";
        const compStats = compradoresMap.get(compradorName) || { amount: 0, count: 0 };
        compStats.amount += item.presupuesto || 0;
        compStats.count += 1;
        compradoresMap.set(compradorName, compStats);

        const unidadName = item.expand?.unidad_requirente?.nombre || "Sin Unidad";
        const uniStats = unidadesMap.get(unidadName) || { amount: 0, count: 0 };
        uniStats.amount += item.presupuesto || 0;
        uniStats.count += 1;
        unidadesMap.set(unidadName, uniStats);

        const subvName = item.expand?.subvencion?.nombre || "Sin Subvención";
        const subStats = subvencionesMap.get(subvName) || { amount: 0, count: 0 };
        subStats.amount += item.presupuesto || 0;
        subStats.count += 1;
        subvencionesMap.set(subvName, subStats);

        // Calculate Cycle Time
        // Logic: Date of first OC - Date of Request
        // We look for the earliest OC date for this purchase
        if (item.fecha_solicitud && item.expand?.["ordenes_compra(compra)"] && item.expand["ordenes_compra(compra)"].length > 0) {
            const ocs = item.expand["ordenes_compra(compra)"];
            // Find earliest OC date
            const dates = ocs.map(oc => oc.oc_fecha).filter(Boolean).map(d => parseISO(d).getTime());
            if (dates.length > 0) {
                const firstOcDate = new Date(Math.min(...dates));
                const requestDate = parseISO(item.fecha_solicitud);

                const days = differenceInDays(firstOcDate, requestDate);
                // Filter out weird negative days or extreme outliers (> 365 days) if necessary, 
                // but for now assume data is relatively sane or we want to see the errors.
                // Ignore negatives (data entry error)
                if (days >= 0) {
                    totalDays += days;
                    validCycleCount++;

                    // Monthly Trend (based on OC creation date)
                    const monthKey = format(firstOcDate, "yyyy-MM");
                    const monthStats = monthlyCycleMap.get(monthKey) || { totalDays: 0, count: 0 };
                    monthStats.totalDays += days;
                    monthStats.count++;
                    monthlyCycleMap.set(monthKey, monthStats);
                }
            }
        }
    });

    const avgCycleTime = validCycleCount > 0 ? Math.round(totalDays / validCycleCount) : 0;

    // Process Trend Data
    const cycleTimeTrend = Array.from(monthlyCycleMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0])) // Sort by YYYY-MM
        .map(([key, stats]) => {
            // Convert YYYY-MM to Month Name
            const [year, month] = key.split("-");
            const date = new Date(parseInt(year), parseInt(month) - 1);
            return {
                month: format(date, "MMMM", { locale: es }), // e.g. "enero"
                rawMonth: key,
                days: Math.round(stats.totalDays / stats.count)
            };
        });


    // Convert to arrays and sort rankings
    const rankingCompradores = Array.from(compradoresMap.entries())
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);

    const rankingUnidades = Array.from(unidadesMap.entries())
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    const rankingSubvenciones = Array.from(subvencionesMap.entries())
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.amount - a.amount);

    const funnelData = [
        { stage: "Solicitudes", count: totalOrders, fill: "var(--color-solicitudes)" },
        { stage: "Asignadas", count: countAssigned, fill: "var(--color-asignadas)" },
        { stage: "Con OC", count: countWithOC, fill: "var(--color-con-oc)" },
        { stage: "Terminadas", count: countCompleted, fill: "var(--color-terminadas)" },
    ];

    return {
        totalSpent,
        totalOrders,
        avgCycleTime,
        cycleTimeTrend,
        funnelData,
        stagnationCount,
        rankingCompradores,
        rankingUnidades,
        rankingSubvenciones,
    };
}
