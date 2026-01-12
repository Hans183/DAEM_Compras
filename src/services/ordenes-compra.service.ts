import pb from "@/lib/pocketbase";
import type { OrdenCompra, OrdenCompraFormData } from "@/types/orden-compra";
import { type RecordModel } from "pocketbase";

export const ORDENES_COMPRA_COLLECTION = "ordenes_compra";

export async function getOrdenesByCompra(compraId: string) {
    return await pb.collection(ORDENES_COMPRA_COLLECTION).getList<OrdenCompra>(1, 50, {
        filter: `compra = "${compraId}"`,
        sort: "-oc_fecha",
    });
}

export async function createOrdenCompra(data: OrdenCompraFormData) {
    const formData = new FormData();
    formData.append("compra", data.compra);
    formData.append("oc", data.oc);
    formData.append("oc_fecha", data.oc_fecha);
    formData.append("oc_valor", data.oc_valor.toString());

    if (data.oc_adjunto) {
        formData.append("oc_adjunto", data.oc_adjunto);
    }

    return await pb.collection(ORDENES_COMPRA_COLLECTION).create<OrdenCompra>(formData);
}

export async function deleteOrdenCompra(id: string) {
    return await pb.collection(ORDENES_COMPRA_COLLECTION).delete(id);
}

export function getOrdenCompraFileUrl(record: OrdenCompra, filename: string) {
    if (!filename) return null;
    return pb.files.getUrl(record, filename);
}
