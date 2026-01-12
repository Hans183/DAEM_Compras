import type { ListResult } from "pocketbase";

import pb from "@/lib/pocketbase";
import type { Requirente, RequirenteFormData, GetRequirentesParams } from "@/types/requirente";

const REQUIRENTES_COLLECTION = "requirente";

/**
 * Get paginated list of requirentes
 */
export async function getRequirentes(params: GetRequirentesParams = {}): Promise<ListResult<Requirente>> {
    const { page = 1, perPage = 30, search = "", sort = "-created" } = params;

    try {
        const filter = search ? `nombre ~ "${search}"` : "";

        return await pb.collection(REQUIRENTES_COLLECTION).getList<Requirente>(page, perPage, {
            filter,
            sort,
        });
    } catch (error) {
        console.error("Error fetching requirentes:", error);
        throw error;
    }
}

/**
 * Get a single requirente by ID
 */
export async function getRequirenteById(id: string): Promise<Requirente> {
    try {
        return await pb.collection(REQUIRENTES_COLLECTION).getOne<Requirente>(id);
    } catch (error) {
        console.error(`Error fetching requirente ${id}:`, error);
        throw error;
    }
}

/**
 * Create a new requirente
 */
export async function createRequirente(data: RequirenteFormData): Promise<Requirente> {
    try {
        return await pb.collection(REQUIRENTES_COLLECTION).create<Requirente>(data);
    } catch (error) {
        console.error("Error creating requirente:", error);
        throw error;
    }
}

/**
 * Update an existing requirente
 */
export async function updateRequirente(id: string, data: Partial<RequirenteFormData>): Promise<Requirente> {
    try {
        return await pb.collection(REQUIRENTES_COLLECTION).update<Requirente>(id, data);
    } catch (error) {
        console.error(`Error updating requirente ${id}:`, error);
        throw error;
    }
}

/**
 * Delete a requirente
 */
export async function deleteRequirente(id: string): Promise<boolean> {
    try {
        await pb.collection(REQUIRENTES_COLLECTION).delete(id);
        return true;
    } catch (error) {
        console.error(`Error deleting requirente ${id}:`, error);
        throw error;
    }
}
