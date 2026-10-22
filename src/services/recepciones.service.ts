import { format } from "date-fns";

import pb from "@/lib/pocketbase";
import type { CreateRecepcionDTO, GetRecepcionesParams, Recepcion, RecepcionDetalle } from "@/types/recepcion";

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
        if (!Number.isNaN(lastNum)) {
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

  const recepcion = await pb
    .collection(RECEPCIONES_COLLECTION)
    .create<Recepcion>(formData, {
      expand: "recepcionado_por,orden_compra",
    })
    .catch((error: unknown) => {
      const err = error as { response?: { data?: unknown } };
      console.error("Validation errors:", JSON.stringify(err.response?.data, null, 2));
      throw error;
    });

  // 3. Create Details (RecepcionDetalle)
  // This could be done in parallel for speed
  const detailPromises = data.detalles.map((detalle) => {
    return pb.collection(DETALLES_COLLECTION).create<RecepcionDetalle>({
      recepcion: recepcion.id,
      cantidad: detalle.cantidad,
      detalle: detalle.detalle,
    });
  });

  const createdDetalles = await Promise.all(detailPromises);

  return {
    ...recepcion,
    expand: {
      ...recepcion.expand,
      "recepcion_detalles(recepcion)": createdDetalles,
    },
  } as Recepcion;
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

  const recepcion = await pb.collection(RECEPCIONES_COLLECTION).update<Recepcion>(id, formData, {
    expand: "recepcionado_por,orden_compra",
  });

  // 2. Update Details: simplistic approach - delete all and recreate
  // Ideally we should diff, but for now this ensures consistency

  // First, find existing details
  const existingDetails = await pb.collection(DETALLES_COLLECTION).getFullList({
    filter: `recepcion = "${id}"`,
  });

  // Delete them
  const deletePromises = existingDetails.map((d) => pb.collection(DETALLES_COLLECTION).delete(d.id));
  await Promise.all(deletePromises);

  // Recreate them from data
  let createdDetalles: RecepcionDetalle[] = [];
  if (data.detalles && data.detalles.length > 0) {
    const detailPromises = data.detalles.map((detalle) => {
      return pb.collection(DETALLES_COLLECTION).create<RecepcionDetalle>({
        recepcion: id,
        cantidad: detalle.cantidad,
        detalle: detalle.detalle,
      });
    });
    createdDetalles = await Promise.all(detailPromises);
  }

  return {
    ...recepcion,
    expand: {
      ...recepcion.expand,
      "recepcion_detalles(recepcion)": createdDetalles,
    },
  } as Recepcion;
}

export async function getRecepcionesByCompra(compraId: string) {
  return await pb.collection(RECEPCIONES_COLLECTION).getFullList<Recepcion>({
    filter: `compra = "${compraId}"`,
    sort: "-created",
    expand: "recepcionado_por,orden_compra,recepcion_detalles(recepcion)",
  });
}

export async function getAllRecepciones(params: GetRecepcionesParams = {}) {
  const {
    page = 1,
    perPage = 20,
    numero_ordinario,
    oc,
    folio,
    unidad_requirente_id,
    documento_numero,
    estado,
    fecha_recepcion,
  } = params;

  const filterParts: string[] = [];

  // 1. Filtro exacto por N° de Oficio (numero_ordinario)
  const activeOficio = numero_ordinario?.trim();
  if (activeOficio) {
    const cleanNum = activeOficio.replace(/^(?:oficio|ord(?:inario)?|n[°º]?)\.?\s*#?\s*/i, "").trim();
    if (/^\d+$/.test(cleanNum)) {
      const numOrdinario = Number(cleanNum);
      const oficioParts: string[] = [`compra.numero_ordinario = ${numOrdinario}`];
      try {
        const compraResult = await pb.collection("compras").getList(1, 50, {
          filter: `numero_ordinario = ${numOrdinario}`,
          fields: "id",
          sort: "-created",
        });
        compraResult.items.forEach((item) => {
          if (item.id) oficioParts.push(`compra = "${item.id}"`);
        });
      } catch (error) {
        console.error("Error filtering compras by numero_ordinario:", error);
      }
      filterParts.push(`(${oficioParts.join(" || ")})`);
    } else {
      filterParts.push(`id = "none"`);
    }
  }

  // 2. Filtro por N° de Orden de Compra (OC)
  const activeOc = oc?.trim();
  if (activeOc) {
    const escapedOc = activeOc.replace(/"/g, '\\"');
    const cleanOc = activeOc
      .replace(/^oc[:.\s-]*/i, "")
      .trim()
      .replace(/"/g, '\\"');
    const ocFilter =
      cleanOc && cleanOc !== escapedOc ? `(oc ~ "${escapedOc}" || oc ~ "${cleanOc}")` : `oc ~ "${escapedOc}"`;

    try {
      const ocResult = await pb.collection("ordenes_compra").getList(1, 50, {
        filter: ocFilter,
        fields: "id,compra",
        sort: "-created",
      });

      const ocParts: string[] = [];
      ocResult.items.forEach((item) => {
        if (item.id) ocParts.push(`orden_compra = "${item.id}"`);
        if (item.compra) ocParts.push(`(orden_compra = "" && compra = "${item.compra}")`);
      });

      if (ocParts.length > 0) {
        filterParts.push(`(${ocParts.join(" || ")})`);
      } else {
        filterParts.push(`id = "none"`);
      }
    } catch (error) {
      console.error("Error filtering ordenes_compra by oc:", error);
      filterParts.push(`id = "none"`);
    }
  }

  // 3. Filtro por Folio de Recepción
  const activeFolio = folio?.trim();
  if (activeFolio) {
    const escapedFolio = activeFolio.replace(/"/g, '\\"');
    if (/^\d+$/.test(activeFolio)) {
      const padded = activeFolio.padStart(3, "0");
      filterParts.push(`(folio ~ "-${padded}" || folio ~ "${escapedFolio}")`);
    } else {
      filterParts.push(`folio ~ "${escapedFolio}"`);
    }
  }

  // 4. Filtro por Unidad Requirente / Establecimiento
  if (unidad_requirente_id) {
    filterParts.push(`compra.unidad_requirente = "${unidad_requirente_id}"`);
  }

  // 5. Filtro por N° de Documento de respaldo
  const activeDoc = documento_numero?.trim();
  if (activeDoc) {
    const escapedDoc = activeDoc.replace(/"/g, '\\"');
    filterParts.push(`documento_numero ~ "${escapedDoc}"`);
  }

  // 6. Filtro por Estado de la Recepción
  if (estado && estado !== "all") {
    if (estado === "Conforme") {
      filterParts.push(`(estado = "Conforme" || estado = "")`);
    } else {
      const escapedEstado = estado.replace(/"/g, '\\"');
      filterParts.push(`estado = "${escapedEstado}"`);
    }
  }

  // 7. Filtro por Fecha de Recepción
  if (fecha_recepcion) {
    filterParts.push(`fecha_recepcion ~ "${fecha_recepcion}"`);
  }

  return await pb.collection(RECEPCIONES_COLLECTION).getList<Recepcion>(page, perPage, {
    sort: "-created",
    filter: filterParts.join(" && "),
    expand: "recepcionado_por,compra,compra.unidad_requirente,orden_compra",
    fields:
      "id,collectionId,collectionName,folio,fecha_recepcion,documento_tipo,documento_numero,estado,adjuntos,observaciones,compra,orden_compra,recepcionado_por,expand.recepcionado_por.id,expand.recepcionado_por.name,expand.orden_compra.id,expand.orden_compra.oc,expand.compra.id,expand.compra.numero_ordinario,expand.compra.descripcion,expand.compra.unidad_requirente,expand.compra.expand.unidad_requirente.id,expand.compra.expand.unidad_requirente.nombre",
  });
}

export async function getRecepcionById(id: string) {
  const expand =
    "recepcionado_por,recepcion_detalles(recepcion),compra,compra.unidad_requirente,compra.comprador,orden_compra,compra.ordenes_compra(compra),compra.subvencion";
  try {
    return await pb.collection(RECEPCIONES_COLLECTION).getOne<Recepcion>(id, {
      expand,
    });
  } catch {
    return await pb.collection(RECEPCIONES_COLLECTION).getFirstListItem<Recepcion>(`id = "${id}"`, {
      expand,
    });
  }
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
