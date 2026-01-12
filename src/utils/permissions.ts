import type { UserRole } from "@/types/user";
import type { Compra, EstadoCompra } from "@/types/compra";

/**
 * Verifica si un rol puede crear compras
 */
export function canCreateCompra(role: UserRole): boolean {
    return role === "Admin" || role === "Encargado compras";
}

/**
 * Verifica si un rol puede eliminar compras
 */
export function canDeleteCompra(role: UserRole): boolean {
    return role === "Admin" || role === "Encargado compras";
}

/**
 * Verifica si un rol puede anular compras
 */
export function canCancelCompra(role: UserRole): boolean {
    return role === "Encargado compras";
}

/**
 * Verifica si un rol puede editar una compra
 */
export function canEditCompra(role: UserRole, compra?: Compra): boolean {
    // Si la compra está anulada, nadie puede editar
    if (compra?.estado === "Anulado") return false;

    // Admin puede editar cualquier compra
    if (role === "Admin") return true;

    // Observador no puede editar nada
    if (role === "Observador") return false;

    // SEP no interactúa en este módulo
    if (role === "SEP") return false;

    // Comprador puede editar compras en estado Asignado
    if (role === "Comprador") {
        if (!compra) return false; // No puede crear, solo editar
        return compra.estado === "Asignado";
    }

    // Encargado compras puede editar compras en estado Asignado
    if (role === "Encargado compras") {
        if (!compra) return false; // No puede crear, solo editar
        return compra.estado === "Asignado";
    }

    // Bodega puede editar compras en estado Comprado o En Bodega
    if (role === "Bodega") {
        if (!compra) return false;
        return compra.estado === "Comprado" || compra.estado === "En Bodega";
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
    | "odd"
    | "fecha_odd"
    | "plazo_de_entrega"
    | "valor"
    | "subvencion"
    | "estado"
    | "adjunta_ordinario"
    | "adjunta_odd"
    | "presupuesto";

/**
 * Obtiene los campos que un rol puede editar
 */
export function getEditableFields(role: UserRole, estadoCompra?: EstadoCompra): CompraField[] {
    // Si el estado es Anulado, no se puede editar ningún campo
    if (estadoCompra === "Anulado") {
        return [];
    }

    // Admin y Encargado compras pueden editar todos los campos
    if (role === "Admin" || role === "Encargado compras") {
        return [
            "numero_ordinario",
            "descripcion",
            "unidad_requirente",
            "comprador",
            "odd",
            "fecha_odd",
            "plazo_de_entrega",
            "valor",
            "subvencion",
            "estado",
            "adjunta_ordinario",
            "adjunta_odd",
            "presupuesto",
        ];
    }

    // Observador no puede editar nada
    if (role === "Observador") {
        return [];
    }

    // SEP no interactúa en este módulo
    if (role === "SEP") {
        return [];
    }

    // Comprador puede editar todo
    if (role === "Comprador") {
        return [
            "numero_ordinario",
            "descripcion",
            "unidad_requirente",
            "comprador",
            "odd",
            "fecha_odd",
            "plazo_de_entrega",
            "valor",
            "subvencion",
            "estado",
            "adjunta_ordinario",
            "adjunta_odd",
        ];
    }

    // Bodega solo puede editar estado
    if (role === "Bodega") {
        return ["estado"];
    }

    return [];
}

/**
 * Verifica si un campo específico es editable para un rol
 */
export function isFieldEditable(
    field: CompraField,
    role: UserRole,
    estadoCompra?: EstadoCompra
): boolean {
    const editableFields = getEditableFields(role, estadoCompra);
    return editableFields.includes(field);
}

/**
 * Obtiene los estados a los que se puede cambiar según el rol
 */
export function getAvailableEstados(role: UserRole, currentEstado?: EstadoCompra): EstadoCompra[] {
    // Admin puede cambiar a cualquier estado
    if (role === "Admin" || role === "Encargado compras") {
        return ["Asignado", "Comprado", "En Bodega", "Entregado"];
    }

    // SEP no interactúa en este módulo
    if (role === "SEP") {
        return currentEstado ? [currentEstado] : [];
    }

    // Bodega puede cambiar de Comprado a En Bodega o Entregado
    if (role === "Bodega") {
        if (currentEstado === "Comprado") {
            return ["Comprado", "En Bodega", "Entregado"];
        }
        if (currentEstado === "En Bodega") {
            return ["En Bodega", "Entregado"];
        }
    }

    // Comprador puede cambiar a Comprado
    if (role === "Comprador") {
        return ["Asignado", "Comprado"];
    }

    return currentEstado ? [currentEstado] : [];
}
