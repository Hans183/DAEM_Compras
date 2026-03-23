import type { ListResult } from "pocketbase";

import pb from "@/lib/pocketbase";
import type { GetRequirentesParams, Requirente } from "@/types/requirente";

const REQUIRENTE_COLLECTION = "requirente";

/**
 * Get paginated list of requirentes
 */
export async function getRequirentes(params: GetRequirentesParams = {}): Promise<ListResult<Requirente>> {
  const { page = 1, perPage = 30, search = "", sort = "+nombre" } = params;

  try {
    const filterParts = [`active = true`];
    if (search) filterParts.push(`nombre ~ "${search}"`);
    const filter = filterParts.join(" && ");

    return await pb.collection(REQUIRENTE_COLLECTION).getList<Requirente>(page, perPage, {
      filter,
      sort,
    });
  } catch (error) {
    console.error("Error fetching requirentes:", error);
    throw error;
  }
}
