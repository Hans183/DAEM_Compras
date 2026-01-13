import type { RecordModel } from "pocketbase";
import type { Requirente } from "./requirente";

export const MONTHS = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre"
] as const;

export type Month = typeof MONTHS[number];

/**
 * RrhhSep type based on PocketBase schema
 */
export interface RrhhSep extends RecordModel {
    escuelas: string; // Relation ID to unidad_requirente (or equivalent for schools)
    mes: string;
    anio: number;
    total: number;
    expand?: {
        escuelas?: Requirente;
    };
}

/**
 * Form data for creating/updating
 */
export interface RrhhSepFormData {
    escuelas: string;
    mes: string;
    anio: number;
    total: number;
}

/**
 * Query parameters
 */
export interface GetRrhhSepParams {
    page?: number;
    perPage?: number;
    search?: string;
    sort?: string;
    escuelas_filter?: string;
    mes_filter?: string;
    anio_filter?: number;
}
