import type { ListResult } from "pocketbase";

import pb from "@/lib/pocketbase";
import type { Compra, CompraFormData, GetComprasParams } from "@/types/compra";
import { createHistorialLog } from "./historial.service";
import { detectarCambios, generarResumenCambios } from "@/utils/change-logger";

const COMPRAS_COLLECTION = "compras";

/**
 * Get paginated list of compras
 */
export async function getCompras(params: GetComprasParams = {}): Promise<ListResult<Compra>> {
    const {
        page = 1,
        perPage = 30,
        search = "",
        sort = "-created",
        unidad_requirente_filter,
        numero_ordinario,
        descripcion_filter,
        comprador_filter,
        estado_filter,
        created_from,
        created_to,
        fecha_inicio_from,
        fecha_inicio_to
    } = params;

    try {
        const filters: string[] = [];

        // Búsqueda general (busca en múltiples campos)
        if (search) {
            const searchFilters = [`descripcion ~ "${search}"`];
            // Si el término de búsqueda es un número, buscamos también por número ordinario
            if (!isNaN(Number(search))) {
                searchFilters.push(`numero_ordinario = ${search}`);
            }
            filters.push(`(${searchFilters.join(" || ")})`);
        }

        // Filtros específicos por columna
        if (unidad_requirente_filter) {
            filters.push(`unidad_requirente.nombre ~ "${unidad_requirente_filter}"`);
        }

        if (numero_ordinario !== undefined) {
            filters.push(`numero_ordinario = ${numero_ordinario}`);
        }

        if (descripcion_filter) {
            filters.push(`descripcion ~ "${descripcion_filter}"`);
        }

        if (comprador_filter) {
            filters.push(`comprador = "${comprador_filter}"`);
        }

        if (estado_filter) {
            filters.push(`estado = "${estado_filter}"`);
        }

        // Legacy created filters (optional, kept if needed but UI will use fecha_inicio)
        if (created_from) {
            filters.push(`created >= "${created_from}"`);
        }

        if (created_to) {
            filters.push(`created <= "${created_to}"`);
        }

        if (fecha_inicio_from) {
            filters.push(`fecha_inicio >= "${fecha_inicio_from}"`);
        }

        if (fecha_inicio_to) {
            filters.push(`fecha_inicio <= "${fecha_inicio_to}"`);
        }

        // Combinar todos los filtros con AND
        const filter = filters.length > 0 ? filters.join(" && ") : "";

        return await pb.collection(COMPRAS_COLLECTION).getList<Compra>(page, perPage, {
            filter,
            sort,
            expand: "unidad_requirente,comprador,subvencion,ordenes_compra(compra)",
        });
    } catch (error) {
        console.error("Error fetching compras:", error);
        throw error;
    }
}

/**
 * Get a single compra by ID
 */
export async function getCompraById(id: string): Promise<Compra> {
    try {
        return await pb.collection(COMPRAS_COLLECTION).getOne<Compra>(id, {
            expand: "unidad_requirente,comprador,subvencion,ordenes_compra(compra)",
        });
    } catch (error) {
        console.error(`Error fetching compra ${id}:`, error);
        throw error;
    }
}

/**
 * Create a new compra
 */
export async function createCompra(data: CompraFormData): Promise<Compra> {
    try {
        const formData = new FormData();

        // Usar valores por defecto si los campos son undefined
        formData.append("numero_ordinario", String(data.numero_ordinario ?? 0));
        formData.append("unidad_requirente", data.unidad_requirente ?? "");
        formData.append("comprador", data.comprador ?? "");
        formData.append("descripcion", data.descripcion ?? "");
        formData.append("observacion", data.observacion ?? "");
        formData.append("fecha_solicitud", data.fecha_solicitud ?? "");
        formData.append("fecha_inicio", data.fecha_inicio ?? "");

        formData.append("subvencion", data.subvencion ?? "");
        formData.append("presupuesto", String(data.presupuesto ?? 0));
        formData.append("estado", data.estado ?? "Asignado");
        if (data.usuario_modificador) formData.append("usuario_modificador", data.usuario_modificador);

        if (data.adjunta_ordinario) {
            formData.append("adjunta_ordinario", data.adjunta_ordinario);
        }

        if (data.es_duplicada) {
            formData.append("es_duplicada", String(data.es_duplicada));
        }

        const record = await pb.collection(COMPRAS_COLLECTION).create<Compra>(formData, {
            expand: "comprador,unidad_requirente",
        });

        // Registrar en historial
        await createHistorialLog(
            record.id,
            "creacion",
            {},
            generarResumenCambios({}, "creacion")
        );

        return record;
    } catch (error) {
        console.error("Error creating compra:", error);
        throw error;
    }
}

/**
 * Update an existing compra
 */
export async function updateCompra(id: string, data: Partial<CompraFormData>): Promise<Compra> {
    try {
        // 1. Obtener datos actuales para comparar
        const oldData = await getCompraById(id);

        const formData = new FormData();


        if (data.numero_ordinario !== undefined) {
            formData.append("numero_ordinario", String(data.numero_ordinario));
        }
        if (data.unidad_requirente) formData.append("unidad_requirente", data.unidad_requirente);
        if (data.comprador) formData.append("comprador", data.comprador);
        if (data.descripcion) formData.append("descripcion", data.descripcion);
        if (data.observacion) formData.append("observacion", data.observacion);
        if (data.fecha_solicitud) formData.append("fecha_solicitud", data.fecha_solicitud);
        if (data.fecha_inicio) formData.append("fecha_inicio", data.fecha_inicio);

        if (data.presupuesto !== undefined) {
            formData.append("presupuesto", String(data.presupuesto));
        }
        if (data.subvencion) formData.append("subvencion", data.subvencion);
        if (data.estado) formData.append("estado", data.estado);
        if (data.usuario_modificador) formData.append("usuario_modificador", data.usuario_modificador);
        if (data.motivo_anula) formData.append("motivo_anula", data.motivo_anula);

        if (data.adjunta_ordinario) {
            formData.append("adjunta_ordinario", data.adjunta_ordinario);
        }

        const record = await pb.collection(COMPRAS_COLLECTION).update<Compra>(id, formData, {
            expand: "comprador,unidad_requirente",
        });

        // 2. Detectar cambios y registrar
        const cambios = detectarCambios(oldData, data);
        const resumen = generarResumenCambios(cambios, "modificacion");

        if (Object.keys(cambios).length > 0) {
            await createHistorialLog(
                id,
                "modificacion",
                cambios,
                resumen
            );
        }

        return record;
    } catch (error) {
        console.error(`Error updating compra ${id}:`, error);
        throw error;
    }
}

/**
 * Delete a compra
 */
export async function deleteCompra(id: string): Promise<boolean> {
    try {
        await pb.collection(COMPRAS_COLLECTION).delete(id);
        return true;
    } catch (error) {
        console.error(`Error deleting compra ${id}:`, error);
        throw error;
    }
}

/**
 * Get file URL for compra attachments
 */
export function getCompraFileUrl(compra: Compra, field: "adjunta_ordinario" | "adjunta_odd"): string | undefined {
    const fileName = compra[field];
    if (!fileName) return undefined;

    return pb.files.getURL(compra, fileName);
}
