import type { ListResult } from "pocketbase";

import pb from "@/lib/pocketbase";
import type { GetSubvencionesParams, Subvencion, SubvencionFormData } from "@/types/subvencion";

const SUBVENCIONES_COLLECTION = "suvenciones";

/**
 * Get paginated list of subvenciones
 */
export async function getSubvenciones(params: GetSubvencionesParams = {}): Promise<ListResult<Subvencion>> {
    const { page = 1, perPage = 30, search = "", sort = "-created" } = params;

    try {
        const filter = search ? `nombre ~ "${search}" || descripcion ~ "${search}"` : "";

        return await pb.collection(SUBVENCIONES_COLLECTION).getList<Subvencion>(page, perPage, {
            filter,
            sort,
        });
    } catch (error) {
        console.error("Error fetching subvenciones:", error);
        throw error;
    }
}

/**
 * Get a single subvencion by ID
 */
export async function getSubvencionById(id: string): Promise<Subvencion> {
    try {
        return await pb.collection(SUBVENCIONES_COLLECTION).getOne<Subvencion>(id);
    } catch (error) {
        console.error(`Error fetching subvencion ${id}:`, error);
        throw error;
    }
}

/**
 * Create a new subvencion
 */
export async function createSubvencion(data: SubvencionFormData): Promise<Subvencion> {
    try {
        return await pb.collection(SUBVENCIONES_COLLECTION).create<Subvencion>(data);
    } catch (error) {
        console.error("Error creating subvencion:", error);
        throw error;
    }
}

/**
 * Update an existing subvencion
 */
export async function updateSubvencion(id: string, data: SubvencionFormData): Promise<Subvencion> {
    try {
        return await pb.collection(SUBVENCIONES_COLLECTION).update<Subvencion>(id, data);
    } catch (error) {
        console.error(`Error updating subvencion ${id}:`, error);
        throw error;
    }
}

/**
 * Delete a subvencion
 */
export async function deleteSubvencion(id: string): Promise<boolean> {
    try {
        await pb.collection(SUBVENCIONES_COLLECTION).delete(id);
        return true;
    } catch (error) {
        console.error(`Error deleting subvencion ${id}:`, error);
        throw error;
    }
}
