import type { RecordModel } from "pocketbase";

export interface OrdenCompra extends RecordModel {
    compra: string; // Relation ID to Compra
    oc: string; // Número/Identificador de la OC
    oc_fecha: string;
    oc_valor: number;
    plazo_entrega?: string;
    oc_adjunto?: string;
}

export interface OrdenCompraFormData {
    compra: string;
    oc: string;
    oc_fecha: string;
    oc_valor: number;
    plazo_entrega?: string;
    oc_adjunto?: File;
}
