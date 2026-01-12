import { z } from "zod";
import type { UserRole } from "@/types/user";
import { USER_ROLES } from "@/types/user";

// Base schema without password fields
const baseUserSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.string().email("Email inválido"),
    role: z.enum(USER_ROLES, {
        errorMap: () => ({ message: "El rol es requerido" }),
    }) as z.ZodType<UserRole>,
    dependencia: z.string().optional(),
    emailVisibility: z.boolean().default(true),
    avatar: z.instanceof(File).optional(),
});

// Schema for creating users (requires password)
export const createUserSchema = baseUserSchema.extend({
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    passwordConfirm: z.string().min(8, "Confirma tu contraseña"),
}).refine(
    (data) => data.password === data.passwordConfirm,
    {
        message: "Las contraseñas no coinciden",
        path: ["passwordConfirm"],
    }
);

// Schema for updating users (password optional)
export const userFormSchema = baseUserSchema.extend({
    password: z.string().optional(),
    passwordConfirm: z.string().optional(),
    oldPassword: z.string().optional(),
}).refine(
    (data) => {
        if (data.password || data.passwordConfirm) {
            return data.password === data.passwordConfirm;
        }
        return true;
    },
    {
        message: "Las contraseñas no coinciden",
        path: ["passwordConfirm"],
    }
);

export type UserFormValues = z.infer<typeof userFormSchema>;
export type CreateUserFormValues = z.infer<typeof createUserSchema>;
