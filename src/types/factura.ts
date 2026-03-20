import type { RecordModel } from "pocketbase";

export interface Factura extends RecordModel {
  compra: string; // Relation ID to Compra
  factura: string; // Número de factura
  monto: number;
  fecha: string;
  documento?: string;
}

export interface FacturaFormData {
  compra: string;
  factura: string;
  monto: number;
  fecha: string;
  documento?: File;
}
