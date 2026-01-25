import { RecordModel } from "pocketbase";
import { User } from "./user";

export interface Recepcion extends RecordModel {
    compra: string; // Relation to Compra
    folio: string; // visible code: REC-LU26-001
    correlativo?: number; // internal sequential number - optional/legacy
    fecha_recepcion: string; // ISO date
    documento_tipo: "Guía de Despacho" | "Factura" | "Boleta" | "Otro";
    documento_numero?: string;
    adjuntos?: string[]; // array of filenames
    observaciones?: string;
    estado: "Conforme" | "Anulado"; // Default: Conforme
    motivo_anulacion?: string;

    recepcionado_por: string | User; // Relation to User
    orden_compra?: string; // Relation to OrdenCompra

    // Expand fields
    expand?: {
        recepcionado_por?: User;
        "recepcion_detalles(recepcion)"?: RecepcionDetalle[];
        orden_compra?: any; // Avoiding circular dependency for now, or use generic
        compra?: any; // Often expanded
        [key: string]: any;
    };
}

export interface RecepcionDetalle extends RecordModel {
    recepcion: string; // Relation to Recepcion
    cantidad: number;
    detalle: string;
}

export interface CreateRecepcionDTO {
    compra: string;
    orden_compra?: string;
    fecha_recepcion: Date;
    documento_tipo: string;
    documento_numero: string;
    observaciones: string;
    recepcionado_por: string;
    adjuntos?: File[];
    detalles: {
        cantidad: number;
        detalle: string;
    }[];
}
