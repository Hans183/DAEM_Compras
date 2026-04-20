import type { RecordModel } from "pocketbase";

import type { Factura } from "./factura";
import type { OrdenCompra } from "./orden-compra";
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
  fecha_solicitud?: string;
  fecha_inicio?: string;

  subvencion: string; // Relation ID
  estado: EstadoCompra;
  usuario_modificador?: string;
  motivo_anula?: string;
  presupuesto?: number;
  es_duplicada?: boolean;
  observacion?: string;
  accion?: string; // Relation ID to acciones
  decreto_pago?: string;
  fecha_pago?: string;
  busqueda_index?: string;
  expand?: {
    unidad_requirente?: Requirente;
    comprador?: User;
    subvencion?: Subvencion;
    "ordenes_compra(compra)"?: OrdenCompra[];
    "facturas(compra)"?: Factura[];
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
  accion?: string;
  decreto_pago?: string;
  fecha_pago?: string;
  busqueda_index?: string;
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
  numero_ordinario?: string | number;
  descripcion_filter?: string;
  comprador_filter?: string;
  estado_filter?: string;
  fecha_inicio_from?: string;
  fecha_inicio_to?: string;
  created_from?: string;
  created_to?: string;
  accion_filter?: string;
  subvencion_filter?: string;
  unidad_requirente_id?: string;
  search_fields?: ("descripcion" | "oc" | "factura" | "numero_ordinario")[];
}

/**
 * Estados posibles para una compra
 */
export const ESTADOS_COMPRA = [
  "Iniciado",
  "Asignado",
  "En Proceso",
  "Comprado",
  "Facturado",
  "Devuelto",
  "En Bodega",
  "Entregado",
  "Anulado",
] as const;

export type EstadoCompra = (typeof ESTADOS_COMPRA)[number];
