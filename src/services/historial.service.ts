import pb from "@/lib/pocketbase";
import { HistorialCompra, AccionHistorial, CambiosObj } from "@/types/historial";

export async function createHistorialLog(
    compraId: string,
    accion: AccionHistorial,
    cambios: CambiosObj,
    resumen: string
): Promise<HistorialCompra | null> {
    try {
        const user = pb.authStore.model;
        if (!user) return null;

        const data = {
            compra: compraId,
            usuario: user.id,
            accion,
            cambios,
            resumen,
        };

        return await pb.collection("historial_compras").create<HistorialCompra>(data);
    } catch (error) {
        console.error("Error creating historial log:", error);
        // No lanzamos error para no interrumpir el flujo principal si falla el log
        return null;
    }
}

export async function getHistorialByCompra(compraId: string): Promise<HistorialCompra[]> {
    try {
        const records = await pb.collection("historial_compras").getList<HistorialCompra>(1, 50, {
            filter: `compra = "${compraId}"`,
            sort: "-created",
            expand: "usuario",
        });
        return records.items;
    } catch (error) {
        console.error("Error fetching historial:", error);
        return [];
    }
}
