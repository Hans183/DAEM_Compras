import type { UserRole } from "@/types/user";
import { getEditableFields } from "./permissions";

/**
 * Campos de compra disponibles
 */
export type CompraField =
    | "numero_ordinario"
    | "descripcion"
    | "unidad_requirente"
    | "comprador"
    | "odd"
    | "fecha_odd"
    | "plazo_de_entrega"
    | "valor"
    | "subvencion"
    | "estado"
    | "adjunta_ordinario"
    | "adjunta_odd";

/**
 * Determina si un campo es requerido para un rol específico
 */
export function isFieldRequired(
    fieldName: CompraField,
    role: UserRole
): boolean {
    const editableFields = getEditableFields(role);
    return editableFields.includes(fieldName);
}
