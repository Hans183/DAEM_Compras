import type { RecordModel } from "pocketbase";

export interface Accion extends RecordModel {
    nombre: string;
    dimension: string; // RELATION_RECORD_ID
    subdimencion: string; // RELATION_RECORD_ID
    monto_subvencion_general: number;
    monto_sep: number;
    valor_accion: number;
    objetivo_estrategico: string;
    estrategia: string;
    metodo_verificacion: string;
    descripcion: string;
    recursos_necesarios: string;
    programa_asociado: string;
    ate: string;
    responsable: string;
    tic: string;
    establecimiento: string; // RELATION_RECORD_ID (requirentes)
    planes: string;
    expand?: {
        establecimiento?: import("./requirente").Requirente;
        dimension?: import("./dimension").Dimension;
    };
}

export interface AccionFormData {
    nombre: string;
    dimension?: string;
    subdimencion?: string;
    monto_subvencion_general?: number;
    monto_sep?: number;
    valor_accion?: number;
    objetivo_estrategico?: string;
    estrategia?: string;
    metodo_verificacion?: string;
    descripcion?: string;
    recursos_necesarios?: string;
    programa_asociado?: string;
    ate?: string;
    responsable?: string;
    tic?: string;
    planes?: string;
    establecimiento?: string;
}

export interface GetAccionesParams {
    page?: number;
    perPage?: number;
    search?: string;
    sort?: string;
    establecimiento_filter?: string;
    dimension_filter?: string;
    subdimencion_filter?: string;
}
