import type { RecordModel } from "pocketbase";

/**
 * Requirente type based on PocketBase schema
 */
export interface Requirente extends RecordModel {
    nombre: string;
    active: boolean;
    sep: boolean;
}

/**
 * Form data for creating/updating a requirente
 */
export interface RequirenteFormData {
    nombre: string;
    active: boolean;
    sep: boolean;
}

/**
 * Query parameters for fetching requirentes
 */
export interface GetRequirentesParams {
    page?: number;
    perPage?: number;
    search?: string;
    sort?: string;
    sep_filter?: boolean;
    active_filter?: boolean;
}
