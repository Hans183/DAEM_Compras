import { z } from "zod";
import { ESTADOS_COMPRA } from "@/types/compra";
import type { UserRole } from "@/types/user";
import { getEditableFields } from "@/utils/permissions";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"];

/**
 * Crea un schema de validación dinámico basado en el rol del usuario y el contexto (creación/edición)
 */
export function createCompraFormSchema(role: UserRole, context: { isCreating: boolean } = { isCreating: false }) {
    const editableFields = getEditableFields(role);
    // Si estamos editando, usamos los permisos normales. Si estamos creando, restringimos los campos requeridos.
    const isRequired = (field: string) => {
        if (!editableFields.includes(field as any)) return false;

        // En creación, solo estos campos son obligatorios independientemente del rol
        if (context.isCreating) {
            return ["numero_ordinario", "unidad_requirente", "descripcion", "estado", "comprador"].includes(field);
        }

        return true;
    };

    return z.object({
        numero_ordinario: isRequired("numero_ordinario")
            ? z.coerce.number().int().positive({
                message: "El número ordinario debe ser un número positivo.",
            })
            : z.coerce.number().optional(),

        adjunta_ordinario: z
            .instanceof(File)
            .optional()
            .refine(
                (file) => !file || file.size <= MAX_FILE_SIZE,
                "El tamaño máximo de archivo es 10MB."
            )
            .refine(
                (file) => !file || ACCEPTED_FILE_TYPES.includes(file.type),
                "Solo se aceptan archivos PDF e imágenes."
            ),

        unidad_requirente: isRequired("unidad_requirente")
            ? z.string().min(1, {
                message: "Debes seleccionar una unidad requirente.",
            })
            : z.string().optional(),

        comprador: isRequired("comprador")
            ? z.string().min(1, {
                message: "Debes seleccionar un comprador.",
            })
            : z.string().optional(),

        descripcion: isRequired("descripcion")
            ? z.string().min(10, {
                message: "La descripción debe tener al menos 10 caracteres.",
            }).max(500, {
                message: "La descripción no puede exceder 500 caracteres.",
            })
            : z.string().optional(),

        odd: isRequired("odd")
            ? z.string().min(1, {
                message: "El ODD es requerido.",
            })
            : z.string().optional(),

        fecha_odd: isRequired("fecha_odd")
            ? z.string().min(1, {
                message: "La fecha ODD es requerida.",
            })
            : z.string().optional(),

        adjunta_odd: z
            .instanceof(File)
            .optional()
            .refine(
                (file) => !file || file.size <= MAX_FILE_SIZE,
                "El tamaño máximo de archivo es 10MB."
            )
            .refine(
                (file) => !file || ACCEPTED_FILE_TYPES.includes(file.type),
                "Solo se aceptan archivos PDF e imágenes."
            ),

        plazo_de_entrega: isRequired("plazo_de_entrega")
            ? z.coerce.number().int().min(1, {
                message: "El plazo de entrega debe ser al menos 1 día.",
            })
            : z.coerce.number().optional(),

        valor: isRequired("valor")
            ? z.coerce.number().positive({
                message: "El valor debe ser un número positivo.",
            })
            : z.coerce.number().optional(),

        subvencion: isRequired("subvencion")
            ? z.string().min(1, {
                message: "Debes seleccionar una subvención.",
            })
            : z.string().optional(),

        estado: isRequired("estado")
            ? z.enum(ESTADOS_COMPRA, {
                required_error: "Debes seleccionar un estado.",
            })
            : z.enum(ESTADOS_COMPRA).optional(),
    });
}


// Tipo inferido del schema
export type CompraFormValues = z.infer<ReturnType<typeof createCompraFormSchema>>;
