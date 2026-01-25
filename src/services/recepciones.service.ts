import pb from "@/lib/pocketbase";
import type { Recepcion, RecepcionDetalle, CreateRecepcionDTO } from "@/types/recepcion";
import { format } from "date-fns";

export const RECEPCIONES_COLLECTION = "recepciones";
export const DETALLES_COLLECTION = "recepcion_detalles";

/**
 * Generates the next folio in format REC-LU{YY}-{XXX}
 * Example: REC-LU26-001
 */
async function generateNextFolio(): Promise<{ folio: string; correlativo: number }> {
    const today = new Date();
    const yearShort = format(today, "yy"); // "26"
    const prefix = `REC-LU${yearShort}`;

    let nextCorrelativo = 1;

    // Get the last reception of the current year (based on folio prefix)
    // We sort by folio to get the last one created (lexicographically).
    try {
        const lastItems = await pb.collection(RECEPCIONES_COLLECTION).getList<Recepcion>(1, 1, {
            sort: "-folio",
            filter: `folio ~ '${prefix}-'`,
        });

        if (lastItems.items.length > 0) {
            const lastFolio = lastItems.items[0].folio;
            // Parse correlativo from folio: REC-LU26-001 -> 001
            const parts = lastFolio.split("-");
            if (parts.length > 0) {
                const lastNum = parseInt(parts[parts.length - 1], 10);
                if (!isNaN(lastNum)) {
                    nextCorrelativo = lastNum + 1;
                }
            }
        }
    } catch (error) {
        console.warn("Could not fetch last folio, defaulting to 1", error);
    }

    const correlativoStr = nextCorrelativo.toString().padStart(3, "0");
    const folio = `${prefix}-${correlativoStr}`;

    return { folio, correlativo: nextCorrelativo };
}

export async function createRecepcion(data: CreateRecepcionDTO) {
    // 1. Generate Folio
    const { folio } = await generateNextFolio();

    // 2. Create Header (Recepcion)
    const formData = new FormData();
    formData.append("compra", data.compra);
    if (data.orden_compra) formData.append("orden_compra", data.orden_compra);
    formData.append("folio", folio);

    formData.append("estado", "Conforme");
    formData.append("fecha_recepcion", format(data.fecha_recepcion, "yyyy-MM-dd HH:mm:ss"));

    formData.append("documento_tipo", data.documento_tipo);
    formData.append("documento_numero", data.documento_numero);
    formData.append("observaciones", data.observaciones);
    formData.append("recepcionado_por", data.recepcionado_por);

    if (data.adjuntos && data.adjuntos.length > 0) {
        data.adjuntos.forEach((file) => {
            formData.append("adjuntos", file);
        });
    }



    let recepcion;
    try {
        recepcion = await pb.collection(RECEPCIONES_COLLECTION).create<Recepcion>(formData);
    } catch (error: any) {
        console.error("Validation errors:", JSON.stringify(error.response?.data, null, 2));
        throw error;
    }

    // 3. Create Details (RecepcionDetalle)
    // This could be done in parallel for speed
    const detailPromises = data.detalles.map((detalle) => {
        return pb.collection(DETALLES_COLLECTION).create<RecepcionDetalle>({
            recepcion: recepcion.id,
            cantidad: detalle.cantidad,
            detalle: detalle.detalle,
        });
    });

    await Promise.all(detailPromises);

    return recepcion;
}

export async function updateRecepcion(id: string, data: Partial<CreateRecepcionDTO>) {
    // 1. Update Header
    const formData = new FormData();
    if (data.orden_compra) formData.append("orden_compra", data.orden_compra);
    if (data.fecha_recepcion) formData.append("fecha_recepcion", format(data.fecha_recepcion, "yyyy-MM-dd HH:mm:ss"));

    if (data.documento_tipo) formData.append("documento_tipo", data.documento_tipo);
    if (data.documento_numero) formData.append("documento_numero", data.documento_numero);
    if (data.observaciones) formData.append("observaciones", data.observaciones);

    // Append new attachments if any
    if (data.adjuntos && data.adjuntos.length > 0) {
        data.adjuntos.forEach((file) => {
            formData.append("adjuntos", file);
        });
    }

    const recepcion = await pb.collection(RECEPCIONES_COLLECTION).update<Recepcion>(id, formData);

    // 2. Update Details: simplistic approach - delete all and recreate
    // Ideally we should diff, but for now this ensures consistency

    // First, find existing details
    const existingDetails = await pb.collection(DETALLES_COLLECTION).getFullList({
        filter: `recepcion = "${id}"`,
    });

    // Delete them
    const deletePromises = existingDetails.map(d => pb.collection(DETALLES_COLLECTION).delete(d.id));
    await Promise.all(deletePromises);

    // Recreate them from data
    if (data.detalles && data.detalles.length > 0) {
        const detailPromises = data.detalles.map((detalle) => {
            return pb.collection(DETALLES_COLLECTION).create<RecepcionDetalle>({
                recepcion: id,
                cantidad: detalle.cantidad,
                detalle: detalle.detalle,
            });
        });
        await Promise.all(detailPromises);
    }

    return recepcion;
}


export async function getRecepcionesByCompra(compraId: string) {
    return await pb.collection(RECEPCIONES_COLLECTION).getFullList<Recepcion>({
        filter: `compra = "${compraId}"`,
        sort: "-created",
        expand: "recepcionado_por,recepcion_detalles(recepcion)",
    });
}

export async function getAllRecepciones(page = 1, perPage = 50, filters = "") {
    return await pb.collection(RECEPCIONES_COLLECTION).getList<Recepcion>(page, perPage, {
        sort: "-created",
        filter: filters,
        expand: "recepcionado_por,recepcion_detalles(recepcion),compra,compra.unidad_requirente,compra.comprador,orden_compra,compra.ordenes_compra(compra)",
    });
}

export async function getRecepcionById(id: string) {
    return await pb.collection(RECEPCIONES_COLLECTION).getOne<Recepcion>(id, {
        expand: "recepcionado_por,recepcion_detalles(recepcion),compra,compra.unidad_requirente,compra.proveedor,compra.comprador,orden_compra,compra.ordenes_compra(compra)",
    });
}

export async function cancelRecepcion(id: string, motivo: string) {
    return await pb.collection(RECEPCIONES_COLLECTION).update(id, {
        estado: "Anulado",
        motivo_anulacion: motivo,
    });
}

export function getRecepcionFileUrl(record: Recepcion, filename: string) {
    if (!filename) return null;
    return pb.files.getUrl(record, filename);
}
