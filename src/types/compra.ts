import type { RecordModel } from "pocketbase";
import type { Requirente } from "./requirente";
import type { Subvencion } from "./subvencion";
import type { User } from "./user";
import type { OrdenCompra } from "./orden-compra";

/**
 * Compra type based on PocketBase schema
 */
export interface Compra extends RecordModel {
    numero_ordinario: number;
    adjunta_ordinario?: string;
    unidad_requirente: string; // Relation ID
    comprador: string; // Relation ID
    descripcion: string;
    fecha_solicitud?: string;
    fecha_inicio?: string;

    subvencion: string; // Relation ID
    estado: EstadoCompra;
    usuario_modificador?: string;
    motivo_anula?: string;
    presupuesto?: number;
    es_duplicada?: boolean;
    observacion?: string;
    expand?: {
        unidad_requirente?: Requirente;
        comprador?: User;
        subvencion?: Subvencion;
        "ordenes_compra(compra)"?: OrdenCompra[];
    };
}

/**
 * Form data for creating/updating a compra
 * Los campos pueden ser opcionales dependiendo del rol del usuario
 */
export interface CompraFormData {
    numero_ordinario?: number;
    adjunta_ordinario?: File;
    unidad_requirente?: string;
    comprador?: string;
    descripcion?: string;
    fecha_solicitud?: string;
    fecha_inicio?: string;

    subvencion?: string;
    estado?: EstadoCompra;
    usuario_modificador?: string;
    motivo_anula?: string;
    presupuesto?: number;
    es_duplicada?: boolean;
    observacion?: string;
}

/**
 * Query parameters for fetching compras
 */
export interface GetComprasParams {
    page?: number;
    perPage?: number;
    search?: string;
    sort?: string;
    // Filtros específicos por columna
    unidad_requirente_filter?: string;
    numero_ordinario?: number;
    descripcion_filter?: string;
    comprador_filter?: string;
    estado_filter?: string;
    fecha_inicio_from?: string;
    fecha_inicio_to?: string;
    created_from?: string;
    created_to?: string;
}

/**
 * Estados posibles para una compra
 */
export const ESTADOS_COMPRA = [
    "Asignado",
    "En Proceso",
    "Comprado",
    "Devuelto",
    "En Bodega",
    "Entregado",
    "Anulado",
] as const;

export type EstadoCompra = typeof ESTADOS_COMPRA[number];
