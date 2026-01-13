import pb from "@/lib/pocketbase";
import type { Dimension, Subdimencion } from "@/types/dimension";

export async function getDimensiones(): Promise<Dimension[]> {
    return await pb.collection("dimension").getFullList<Dimension>({
        sort: "nombre",
    });
}

export async function getSubdimenciones(dimensionId?: string): Promise<Subdimencion[]> {
    if (!dimensionId) return [];

    try {
        // Since the relation is on the 'dimension' collection (field 'subdimencion'),
        // we fetch the specific dimension and expand that field.
        const record = await pb.collection("dimension").getOne<Dimension>(dimensionId, {
            expand: "subdimencion",
        });

        return record.expand?.subdimencion || [];
    } catch (error) {
        console.error("Error fetching subdimensions:", error);
        return [];
    }
}
