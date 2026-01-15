import { RecordModel } from "pocketbase";
import { User } from "./user";
import { Compra } from "./compra";

export type AccionHistorial = "creacion" | "modificacion" | "eliminacion" | "anulacion";

export interface CambioDetalle {
    anterior: any;
    nuevo: any;
}

export interface CambiosObj {
    [key: string]: CambioDetalle;
}

export interface HistorialCompra extends RecordModel {
    compra: string; // ID de la compra
    usuario: string; // ID del usuario
    accion: AccionHistorial;
    cambios: CambiosObj;
    resumen: string;
    expand?: {
        compra?: Compra;
        usuario?: User;
    };
}
