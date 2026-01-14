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
    | "fecha_solicitud"
    | "plazo_de_entrega"
    | "subvencion"
    | "estado"
    | "adjunta_ordinario"
    | "presupuesto"
    | "observacion";

/**
 * Determina si un campo es requerido para un rol específico
 */
export function isFieldRequired(
    fieldName: CompraField,
    role: UserRole | UserRole[]
): boolean {
    const roles = Array.isArray(role) ? role : [role];
    const editableFields = getEditableFields(roles);
    return editableFields.includes(fieldName);
}
