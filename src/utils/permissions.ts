import type { UserRole } from "@/types/user";
import type { Compra, EstadoCompra } from "@/types/compra";

/**
 * Verifica si un rol puede crear compras
 */
/**
 * Verifica si un rol puede crear compras
 */
export function canCreateCompra(roles: UserRole[]): boolean {
    return roles.includes("Admin") || roles.includes("Encargado compras");
}

/**
 * Verifica si un rol puede eliminar compras
 */
export function canDeleteCompra(roles: UserRole[]): boolean {
    return roles.includes("Admin") || roles.includes("Encargado compras");
}

/**
 * Verifica si un rol puede anular compras
 */
export function canCancelCompra(roles: UserRole[]): boolean {
    return roles.includes("Encargado compras");
}

/**
 * Verifica si un rol puede editar una compra
 */
export function canEditCompra(roles: UserRole[], compra?: Compra): boolean {
    // Si la compra está anulada, nadie puede editar
    if (compra?.estado === "Anulado") return false;

    // Admin puede editar cualquier compra
    if (roles.includes("Admin")) return true;

    // Observador no puede editar nada (explicit check not strictly needed if we check for allowing roles, but good for clarity)
    // if (roles.includes("Observador")) ... (Observador logic is passive, so no action needed unless they have another role)

    // SEP no interactúa en este módulo

    // Comprador puede editar compras en estado Asignado, En Proceso, Devuelto o Comprado
    if (roles.includes("Comprador")) {
        if (!compra) return false;
        if (["Asignado", "En Proceso", "Devuelto", "Comprado"].includes(compra.estado)) return true;
    }

    // Encargado compras puede editar compras en estado Asignado
    if (roles.includes("Encargado compras")) {
        if (!compra) return false;
        if (compra.estado === "Asignado") return true;
    }

    // Bodega puede editar compras en estado Comprado o En Bodega
    if (roles.includes("Bodega")) {
        if (!compra) return false;
        if (compra.estado === "Comprado" || compra.estado === "En Bodega") return true;
    }

    return false;
}

/**
 * Campos de compra disponibles
 */
type CompraField =
    | "numero_ordinario"
    | "descripcion"
    | "unidad_requirente"
    | "comprador"
    | "fecha_solicitud"
    | "fecha_inicio"

    | "subvencion"
    | "estado"
    | "adjunta_ordinario"
    | "presupuesto"
    | "observacion";

/**
 * Obtiene los campos que un rol puede editar
 */
export function getEditableFields(roles: UserRole[], estadoCompra?: EstadoCompra): CompraField[] {
    // Si el estado es Anulado, no se puede editar ningún campo
    if (estadoCompra === "Anulado") {
        return [];
    }

    const fields = new Set<CompraField>();

    // Admin y Encargado compras pueden editar todos los campos
    if (roles.includes("Admin") || roles.includes("Encargado compras")) {
        return [
            "numero_ordinario",
            "descripcion",
            "unidad_requirente",
            "comprador",
            "fecha_solicitud",

            "subvencion",
            "estado",
            "adjunta_ordinario",
            "presupuesto",
            "fecha_inicio",
            "observacion",
        ];
    }

    // Comprador puede editar todo excepto el presupuesto
    if (roles.includes("Comprador")) {
        ([
            "numero_ordinario",
            "descripcion",
            "unidad_requirente",
            "comprador",
            "fecha_solicitud",


            "subvencion",
            "estado",
            "adjunta_ordinario",
            "observacion",
        ] as CompraField[]).forEach(f => fields.add(f));
    }

    // Bodega solo puede editar estado
    if (roles.includes("Bodega")) {
        fields.add("estado");
    }

    return Array.from(fields);
}

/**
 * Verifica si un campo específico es editable para un rol
 */
export function isFieldEditable(
    field: CompraField,
    roles: UserRole[],
    estadoCompra?: EstadoCompra
): boolean {
    const editableFields = getEditableFields(roles, estadoCompra);
    return editableFields.includes(field);
}

/**
 * Obtiene los estados a los que se puede cambiar según el rol
 */
export function getAvailableEstados(roles: UserRole[], currentEstado?: EstadoCompra): EstadoCompra[] {
    const states = new Set<EstadoCompra>();

    // Always include current state if it exists
    if (currentEstado) {
        states.add(currentEstado);
    }

    // Admin puede cambiar a cualquier estado
    if (roles.includes("Admin") || roles.includes("Encargado compras")) {
        return ["Asignado", "Comprado", "En Bodega", "Entregado"];
    }

    // Bodega puede cambiar de Comprado a En Bodega o Entregado
    if (roles.includes("Bodega")) {
        if (currentEstado === "Comprado") {
            states.add("Comprado");
            states.add("En Bodega");
            states.add("Entregado");
        }
        if (currentEstado === "En Bodega") {
            states.add("En Bodega");
            states.add("Entregado");
        }
    }

    // Comprador puede cambiar a: Asignado, En Proceso, Comprado, Devuelto
    if (roles.includes("Comprador")) {
        states.add("Asignado");
        states.add("En Proceso");
        states.add("Comprado");
        states.add("Devuelto");
    }

    return Array.from(states);
}
