import type { ListResult } from "pocketbase";
import pb from "@/lib/pocketbase";
import type { Requirente, GetRequirentesParams } from "@/types/requirente";

const REQUIRENTE_COLLECTION = "requirente";

/**
 * Get paginated list of requirentes
 */
export async function getRequirentes(params: GetRequirentesParams = {}): Promise<ListResult<Requirente>> {
    const { page = 1, perPage = 30, search = "", sort = "+nombre" } = params;

    try {
        const filter = search ? `nombre ~ "${search}"` : "";

        return await pb.collection(REQUIRENTE_COLLECTION).getList<Requirente>(page, perPage, {
            filter,
            sort,
        });
    } catch (error) {
        console.error("Error fetching requirentes:", error);
        throw error;
    }
}
