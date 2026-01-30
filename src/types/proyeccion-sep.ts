import type { RecordModel } from "pocketbase";

export interface ProyeccionSep extends RecordModel {
    establecimiento: string;
    presupuesto: number;
    total_utilizado: number;
    compras_facturadas: number;
    compras_obligadas: number;
    rrhh: string;
    expand?: {
        establecimiento?: Requirente;
    };
}

import { Requirente } from "./requirente";

export interface ProyeccionSepFormData {
    establecimiento: string;
    presupuesto: number;
    total_utilizado: number;
    compras_facturadas: number;
    compras_obligadas: number;
    rrhh: string;
}

export interface GetProyeccionSepParams {
    page?: number;
    perPage?: number;
    sort?: string;
    filter?: string;
}
