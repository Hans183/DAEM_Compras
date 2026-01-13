import type { ListResult } from "pocketbase";
import pb from "@/lib/pocketbase";
import type { RrhhSep, RrhhSepFormData, GetRrhhSepParams } from "@/types/rrhh-sep";

const COLLECTION_NAME = "sep_rrhh";

export async function getRrhhSepList(params: GetRrhhSepParams = {}): Promise<ListResult<RrhhSep>> {
    const { page = 1, perPage = 30, sort = "-created", escuelas_filter, mes_filter, anio_filter } = params;

    const filterParts = [];
    if (escuelas_filter) filterParts.push(`escuelas = "${escuelas_filter}"`);
    if (mes_filter) filterParts.push(`mes = "${mes_filter}"`);
    if (anio_filter) filterParts.push(`anio = ${anio_filter}`);

    const filter = filterParts.join(" && ");

    return await pb.collection(COLLECTION_NAME).getList<RrhhSep>(page, perPage, {
        sort,
        filter,
        expand: "escuelas",
    });
}

export async function createRrhhSep(data: RrhhSepFormData): Promise<RrhhSep> {
    return await pb.collection(COLLECTION_NAME).create<RrhhSep>(data);
}

export async function updateRrhhSep(id: string, data: Partial<RrhhSepFormData>): Promise<RrhhSep> {
    return await pb.collection(COLLECTION_NAME).update<RrhhSep>(id, data);
}

export async function deleteRrhhSep(id: string): Promise<boolean> {
    await pb.collection(COLLECTION_NAME).delete(id);
    return true;
}
