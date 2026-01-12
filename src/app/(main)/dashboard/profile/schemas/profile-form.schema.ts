import { z } from "zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

/**
 * Schema de validación para el formulario de perfil
 */
export const profileFormSchema = z.object({
    name: z.string().min(2, {
        message: "El nombre debe tener al menos 2 caracteres.",
    }).max(100, {
        message: "El nombre no puede exceder 100 caracteres.",
    }),
    email: z.string().email({
        message: "Por favor ingresa un email válido.",
    }),
    avatar: z
        .instanceof(File)
        .optional()
        .refine(
            (file) => !file || file.size <= MAX_FILE_SIZE,
            "El tamaño máximo de archivo es 5MB."
        )
        .refine(
            (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type),
            "Solo se aceptan archivos .jpg, .jpeg, .png y .webp."
        ),
    oldPassword: z.string().optional(),
    password: z.string().min(8, {
        message: "La contraseña debe tener al menos 8 caracteres.",
    }).optional().or(z.literal("")),
    passwordConfirm: z.string().optional().or(z.literal("")),
}).refine((data) => {
    // Si se proporciona nueva contraseña, debe coincidir con la confirmación
    if (data.password && data.password.length > 0) {
        return data.password === data.passwordConfirm;
    }
    return true;
}, {
    message: "Las contraseñas no coinciden.",
    path: ["passwordConfirm"],
}).refine((data) => {
    // Si se proporciona nueva contraseña, se requiere la contraseña actual
    if (data.password && data.password.length > 0) {
        return data.oldPassword && data.oldPassword.length > 0;
    }
    return true;
}, {
    message: "Debes ingresar tu contraseña actual para cambiarla.",
    path: ["oldPassword"],
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
