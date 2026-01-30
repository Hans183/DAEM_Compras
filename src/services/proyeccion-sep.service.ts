import type { ListResult } from "pocketbase";
import pb from "@/lib/pocketbase";
import type { ProyeccionSep, ProyeccionSepFormData, GetProyeccionSepParams } from "@/types/proyeccion-sep";

const COLLECTION_NAME = "proyeccion_sep";

export async function getProyeccionSepList(params: GetProyeccionSepParams = {}): Promise<ListResult<ProyeccionSep>> {
    const { page = 1, perPage = 30, sort = "-created", filter } = params;

    return await pb.collection(COLLECTION_NAME).getList<ProyeccionSep>(page, perPage, {
        sort,
        filter: filter || "",
        expand: "establecimiento",
    });
}

export async function createProyeccionSep(data: ProyeccionSepFormData): Promise<ProyeccionSep> {
    return await pb.collection(COLLECTION_NAME).create<ProyeccionSep>(data);
}

export async function updateProyeccionSep(id: string, data: Partial<ProyeccionSepFormData>): Promise<ProyeccionSep> {
    return await pb.collection(COLLECTION_NAME).update<ProyeccionSep>(id, data);
}

export async function deleteProyeccionSep(id: string): Promise<boolean> {
    await pb.collection(COLLECTION_NAME).delete(id);
    return true;
}
