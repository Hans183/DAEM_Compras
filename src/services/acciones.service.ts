import type { ListResult } from "pocketbase";
import pb from "@/lib/pocketbase";
import type { Accion, AccionFormData, GetAccionesParams } from "@/types/accion";

const COLLECTION_NAME = "acciones";

export async function getAcciones(params: GetAccionesParams = {}): Promise<ListResult<Accion>> {
    const { page = 1, perPage = 30, search = "", sort = "-created", establecimiento_filter, dimension_filter, subdimencion_filter } = params;

    const filterParts = [];
    if (search) {
        filterParts.push(`nombre ~ "${search}"`);
    }
    if (establecimiento_filter) {
        filterParts.push(`establecimiento = "${establecimiento_filter}"`);
    }
    if (dimension_filter) {
        filterParts.push(`dimension = "${dimension_filter}"`);
    }
    if (subdimencion_filter) {
        filterParts.push(`subdimencion = "${subdimencion_filter}"`);
    }

    const filter = filterParts.join(" && ");

    return await pb.collection(COLLECTION_NAME).getList<Accion>(page, perPage, {
        filter,
        sort,
        expand: "establecimiento,dimension",
    });
}

export async function createAccion(data: AccionFormData): Promise<Accion> {
    return await pb.collection(COLLECTION_NAME).create<Accion>(data);
}

export async function updateAccion(id: string, data: Partial<AccionFormData>): Promise<Accion> {
    return await pb.collection(COLLECTION_NAME).update<Accion>(id, data);
}

export async function deleteAccion(id: string): Promise<boolean> {
    await pb.collection(COLLECTION_NAME).delete(id);
    return true;
}
