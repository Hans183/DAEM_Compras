import type { RecordModel } from "pocketbase";

/**
 * Subvencion type based on PocketBase schema
 */
export interface Subvencion extends RecordModel {
    nombre: string;
    descripcion: string;
}

/**
 * Form data for creating/updating a subvencion
 */
export interface SubvencionFormData {
    nombre: string;
    descripcion: string;
}

/**
 * Query parameters for fetching subvenciones
 */
export interface GetSubvencionesParams {
    page?: number;
    perPage?: number;
    search?: string;
    sort?: string;
}
