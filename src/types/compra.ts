import type { RecordModel } from "pocketbase";
import type { Requirente } from "./requirente";
import type { Subvencion } from "./subvencion";
import type { User } from "./user";

/**
 * Compra type based on PocketBase schema
 */
export interface Compra extends RecordModel {
    numero_ordinario: number;
    adjunta_ordinario?: string;
    unidad_requirente: string; // Relation ID
    comprador: string; // Relation ID
    descripcion: string;
    odd: string;
    fecha_odd: string;
    adjunta_odd?: string;
    plazo_de_entrega: number;
    subvencion: string; // Relation ID
    estado: EstadoCompra;
    valor: number;
    usuario_modificador?: string;
    expand?: {
        unidad_requirente?: Requirente;
        comprador?: User;
        subvencion?: Subvencion;
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
    odd?: string;
    fecha_odd?: string;
    adjunta_odd?: File;
    plazo_de_entrega?: number;
    subvencion?: string;
    estado?: EstadoCompra;
    valor?: number;
    usuario_modificador?: string;
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
    odd_filter?: string;
    estado_filter?: EstadoCompra;
    fecha_odd_from?: string;
    fecha_odd_to?: string;
    valor_min?: number;
    valor_max?: number;
}

/**
 * Estados posibles para una compra
 */
export const ESTADOS_COMPRA = [
    "Asignado",
    "Comprado",
    "En Bodega",
    "Entregado",
] as const;

export type EstadoCompra = typeof ESTADOS_COMPRA[number];
