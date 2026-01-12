import { z } from "zod";

export const subvencionFormSchema = z.object({
    nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    descripcion: z.string().min(5, "La descripción debe tener al menos 5 caracteres"),
});

export type SubvencionFormValues = z.infer<typeof subvencionFormSchema>;
