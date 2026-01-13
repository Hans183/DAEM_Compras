import { getCompras } from "./compras.service";
import type { Compra } from "@/types/compra";

export interface DashboardStats {
    totalSpent: number;
    totalOrders: number;
    rankingCompradores: { name: string; amount: number; count: number }[];
    rankingUnidades: { name: string; amount: number; count: number }[];
    rankingSubvenciones: { name: string; amount: number; count: number }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
    const currentYear = new Date().getFullYear();
    // Fetch a large number of records from the current year to calculate stats
    // We filter by date to ensure relevance and performance
    const records = await getCompras({
        perPage: 1000,
        sort: "-created",
        created_from: `${currentYear}-01-01 00:00:00`,
    });

    const items = records.items;

    const totalSpent = items.reduce((sum, item) => sum + (item.valor || 0), 0);
    const totalOrders = items.length;

    // Aggregations
    const compradoresMap = new Map<string, { amount: number; count: number }>();
    const unidadesMap = new Map<string, { amount: number; count: number }>();
    const subvencionesMap = new Map<string, { amount: number; count: number }>();

    items.forEach((item) => {
        // Compradores
        const compradorName = item.expand?.comprador?.name || "Sin Asignar";
        const compStats = compradoresMap.get(compradorName) || { amount: 0, count: 0 };
        compStats.amount += item.valor || 0;
        compStats.count += 1;
        compradoresMap.set(compradorName, compStats);

        // Unidades
        const unidadName = item.expand?.unidad_requirente?.nombre || "Sin Unidad";
        const uniStats = unidadesMap.get(unidadName) || { amount: 0, count: 0 };
        uniStats.amount += item.valor || 0;
        uniStats.count += 1;
        unidadesMap.set(unidadName, uniStats);

        // Subvenciones
        const subvName = item.expand?.subvencion?.nombre || "Sin Subvención";
        const subStats = subvencionesMap.get(subvName) || { amount: 0, count: 0 };
        subStats.amount += item.valor || 0;
        subStats.count += 1;
        subvencionesMap.set(subvName, subStats);
    });

    // Convert to arrays and sort
    const rankingCompradores = Array.from(compradoresMap.entries())
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10); // Top 10

    const rankingUnidades = Array.from(unidadesMap.entries())
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.count - a.count) // Maybe sort units by volume of requests? Or amount? Let's do amount for now, or request user? User said "unidad con mas compras", ambiguous. I'll do count (more purchases).
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    const rankingSubvenciones = Array.from(subvencionesMap.entries())
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.amount - a.amount);

    return {
        totalSpent,
        totalOrders,
        rankingCompradores,
        rankingUnidades,
        rankingSubvenciones,
    };
}
