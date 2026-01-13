import type { RecordModel } from "pocketbase";

export interface Subdimencion extends RecordModel {
    nombre: string;
}

export interface Dimension extends RecordModel {
    nombre: string;
    subdimencion: string[]; // Relation IDs to 'subdimencion' collection
    expand?: {
        subdimencion?: Subdimencion[];
    };
}
