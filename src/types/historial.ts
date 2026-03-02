import type { RecordModel } from "pocketbase";

import type { Compra } from "./compra";
import type { User } from "./user";

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
