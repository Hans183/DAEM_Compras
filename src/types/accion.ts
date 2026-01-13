import type { RecordModel } from "pocketbase";

export interface Accion extends RecordModel {
    nombre: string;
    dimension: string; // RELATION_RECORD_ID
    subdimencion: string; // RELATION_RECORD_ID
    monto_subvencion_general: number;
    monto_sep: number;
    objetivo_estrategico: string;
    estrategia: string;
    metodo_verificacion: string;
    descripcion: string;
    recursos_necesarios: string;
    programa_asociado: string;
    ate: string;
    responsable: string;
    tic: string;
    planes: string;
}

export interface AccionFormData {
    nombre: string;
    dimension?: string;
    subdimencion?: string;
    monto_subvencion_general?: number;
    monto_sep?: number;
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
}

export interface GetAccionesParams {
    page?: number;
    perPage?: number;
    search?: string;
    sort?: string;
}
