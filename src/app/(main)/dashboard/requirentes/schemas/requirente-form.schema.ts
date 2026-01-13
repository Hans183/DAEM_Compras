import { z } from "zod";

/**
 * Schema de validación para formulario de requirente
 */
export const requirenteFormSchema = z.object({
    nombre: z.string().min(2, {
        message: "El nombre debe tener al menos 2 caracteres.",
    }).max(100, {
        message: "El nombre no puede exceder 100 caracteres.",
    }),
    active: z.boolean().default(true),
    sep: z.boolean().default(false),
});

export type RequirenteFormValues = z.infer<typeof requirenteFormSchema>;
