import pb from "@/lib/pocketbase";
import type { Compra } from "@/types/compra";
import { parseISO, getMonth } from "date-fns";

export interface SepReportStats {
    totalInvestment: number;
    totalOrders: number;
    monthlyEvolution: { month: number; amount: number; count: number }[];
    bySchool: { name: string; amount: number; count: number }[];
}

export async function getSepReport(year: number, schoolId?: string, month?: number): Promise<SepReportStats> {
    // 1. Fetch all purchases for the year
    // We filter by creation date to limit the dataset
    const startYear = `${year}-01-01 00:00:00`;
    const endYear = `${year}-12-31 23:59:59`;

    // Fetching large dataset to aggregate in memory
    // In a production app with huge data, this should be done via backend views or separate API endpoints
    const records = await pb.collection("compras").getFullList<Compra>({
        filter: `created >= "${startYear}" && created <= "${endYear}"`,
        expand: "subvencion,unidad_requirente,ordenes_compra(compra)",
        sort: "created",
    });

    // 2. Filter by "SEP" subvention and optional filters
    const validItems = records.filter((item) => {
        // Filter by SEP Subvention name
        const subName = item.expand?.subvencion?.nombre?.toUpperCase() || "";
        if (!subName.includes("SEP")) return false;

        // Filter by School if provided
        if (schoolId && item.unidad_requirente !== schoolId) return false;

        // Filter by Month if provided (based on created date or oc_fecha? Usually created date of request or OC date)
        // User asked for "filtros por... meses".
        // Let's use the creation date for consistency with the Year filter.
        if (month !== undefined) {
            const itemsMonth = getMonth(parseISO(item.created)); // 0-11
            if (itemsMonth !== month) return false;
        }

        return true;
    });

    // 3. Aggregate Data
    let totalInvestment = 0;
    let totalOrders = 0; // Requests count? Or OC count? "Sumar compras". Let's count Requests that have SEP.
    const monthlyMap = new Map<number, { amount: number; count: number }>();
    const schoolMap = new Map<string, { amount: number; count: number }>();

    // Initialize months 0-11
    for (let i = 0; i < 12; i++) {
        monthlyMap.set(i, { amount: 0, count: 0 });
    }

    validItems.forEach((item) => {
        // Calculate Amount: Sum of related OCs
        let itemAmount = 0;
        const ocs = item.expand?.["ordenes_compra(compra)"] || [];

        if (ocs.length > 0) {
            itemAmount = ocs.reduce((sum, oc) => sum + (oc.oc_valor || 0), 0);
        } else {
            // If user wants ONLY real purchases (generated OCs), we should maybe skip items with 0 OCs?
            // "Sumar solo las compras... subencion Ley SEP"
            // If there is no OC, amount is 0. That's fine.
        }

        // If amount is 0, do we count it? Maybe it's pending.
        // Let's count it in "totalOrders" (Requests) but amount contributes 0.

        totalInvestment += itemAmount;
        totalOrders++;

        // Monthly Aggregation
        const itemMonth = getMonth(parseISO(item.created));
        const mStats = monthlyMap.get(itemMonth)!;
        mStats.amount += itemAmount;
        mStats.count += 1;

        // School Aggregation
        const schoolName = item.expand?.unidad_requirente?.nombre || "Sin Asignar";
        const sStats = schoolMap.get(schoolName) || { amount: 0, count: 0 };
        sStats.amount += itemAmount;
        sStats.count += 1;
        schoolMap.set(schoolName, sStats);
    });

    const monthlyEvolution = Array.from(monthlyMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([m, stats]) => ({ month: m, ...stats }));

    const bySchool = Array.from(schoolMap.entries())
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.amount - a.amount);

    return {
        totalInvestment,
        totalOrders,
        monthlyEvolution,
        bySchool,
    };
}
