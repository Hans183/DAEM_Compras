import type { RecordModel } from "pocketbase";

import type { Requirente } from "./requirente";

export type Mes =
  | "Enero"
  | "Febrero"
  | "Marzo"
  | "Abril"
  | "Mayo"
  | "Junio"
  | "Julio"
  | "Agosto"
  | "Septiembre"
  | "Octubre"
  | "Noviembre"
  | "Diciembre";

export interface IngresoMensualSep extends RecordModel {
  requirente: string; // ID of the establishment (requirente)
  mes: Mes;
  anio: number;
  prioritarios: number;
  preferentes: number;
  prio_10: number;
  pref_10: number;
  prio_reflejar: number;
  pref_reflejar: number;
  total_reflejar: number;
  expand?: {
    requirente: Requirente;
  };
}

export interface IngresoMensualSepFormData {
  requirente: string;
  mes: Mes;
  anio: number;
  prioritarios: number;
  preferentes: number;
}
