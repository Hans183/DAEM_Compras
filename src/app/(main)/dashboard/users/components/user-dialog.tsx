"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createUser, updateUser } from "@/services/users.service";
import type { User } from "@/types/user";

import { createUserSchema, type UserFormValues, userFormSchema } from "../schemas/user-form.schema";

interface UserDialogProps {
    user?: User;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

const ROLES = ["Comprador", "Observador", "SEP", "Bodega", "Encargado compras", "Admin"];

export function UserDialog({ user, open, onOpenChange, onSuccess }: UserDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditing = !!user;

    const form = useForm<UserFormValues>({
        resolver: zodResolver(isEditing ? userFormSchema : createUserSchema) as any,
        defaultValues: {
            name: user?.name || "",
            email: user?.email || "",
            role: user?.role || "" as any,
            dependencia: user?.dependencia || "",
            emailVisibility: user?.emailVisibility ?? true,
            password: "",
            passwordConfirm: "",
            oldPassword: "",
        },
    });

    const onSubmit = async (data: UserFormValues) => {
        setIsSubmitting(true);

        try {
            if (isEditing) {
                await updateUser(user.id, {
                    name: data.name,
                    email: data.email,
                    role: data.role,
                    dependencia: data.dependencia,
                    emailVisibility: data.emailVisibility,
                    ...(data.password && {
                        password: data.password,
                        passwordConfirm: data.passwordConfirm!,
                        oldPassword: data.oldPassword,
                    }),
                });
                toast.success("Usuario actualizado exitosamente");
            } else {
                await createUser({
                    name: data.name,
                    email: data.email,
                    password: data.password!,
                    passwordConfirm: data.passwordConfirm!,
                    role: data.role,
                    dependencia: data.dependencia,
                    emailVisibility: data.emailVisibility,
                });
                toast.success("Usuario creado exitosamente");
            }

            form.reset();
            onSuccess();
        } catch (error: any) {
            // console.error("Error saving user:", error); // Commented to prevet Next.js overlay

            // Handle PocketBase validation errors
            if (error?.data?.data) {
                const fieldErrors = error.data.data;
                Object.keys(fieldErrors).forEach((field) => {
                    const message = fieldErrors[field].message;
                    // Map common PocketBase errors to user-friendly messages
                    const errorMessage = fieldErrors[field].code === "validation_not_unique"
                        ? "Este valor ya está en uso."
                        : message;

                    form.setError(field as any, {
                        type: "server",
                        message: errorMessage,
                    });
                });
                toast.error("Por favor revisa los errores en el formulario.");
            } else {
                toast.error(error?.message || "Error al guardar usuario");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Usuario" : "Crear Nuevo Usuario"}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Modifica los datos del usuario. Los campos vacíos no se actualizarán."
                            : "Complete los datos para crear un nuevo usuario."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre Completo</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Juan Pérez" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="usuario@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Rol</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona un rol" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {ROLES.map((role) => (
                                                <SelectItem key={role} value={role}>
                                                    {role}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {!isEditing && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Contraseña</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="••••••••" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="passwordConfirm"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Confirmar Contraseña</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="••••••••" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}

                        <FormField
                            control={form.control}
                            name="emailVisibility"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                    <div className="space-y-0.5">
                                        <FormLabel>Email público</FormLabel>
                                        <div className="text-sm text-muted-foreground">
                                            Permitir que otros usuarios vean este email
                                        </div>
                                    </div>
                                    <FormControl>
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Guardando..." : isEditing ? "Guardar Cambios" : "Crear Usuario"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
