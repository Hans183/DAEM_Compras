"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/lib/utils";
import { getUserAvatarUrl, updateCurrentUserProfile } from "@/services/users.service";
import { ChevronDown, ChevronUp, ImageIcon, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { profileFormSchema, type ProfileFormValues } from "../schemas/profile-form.schema";

export function ProfileForm() {
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined);
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            name: user?.name || "",
            email: user?.email || "",
            oldPassword: "",
            password: "",
            passwordConfirm: "",
        },
    });

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            form.setValue("avatar", file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = async (data: ProfileFormValues) => {
        if (!user) return;

        setIsSubmitting(true);

        try {
            await updateCurrentUserProfile({
                name: data.name,
                email: data.email,
                avatar: data.avatar,
                password: data.password || undefined,
                passwordConfirm: data.passwordConfirm || undefined,
                oldPassword: data.oldPassword || undefined,
            });

            toast.success("Perfil actualizado exitosamente");

            // Clear avatar preview and password fields after successful update
            setAvatarPreview(undefined);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

            // Reset password fields
            form.setValue("oldPassword", "");
            form.setValue("password", "");
            form.setValue("passwordConfirm", "");

            // Close password section if it was open
            if (showPasswordSection) {
                setShowPasswordSection(false);
            }
        } catch (error: any) {
            console.error("Error updating profile:", error);
            toast.error(error?.message || "Error al actualizar perfil");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) {
        return null;
    }

    const currentAvatarUrl = avatarPreview || getUserAvatarUrl(user);

    return (
        <div className="flex justify-center w-full">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle>Información del Perfil</CardTitle>
                    <CardDescription>
                        Actualiza tu información personal y avatar
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {/* Avatar Section */}
                            <div className="flex flex-col items-center gap-4">
                                <Avatar className="h-24 w-24">
                                    <AvatarImage src={currentAvatarUrl} alt={user.name} />
                                    <AvatarFallback className="text-2xl">
                                        {getInitials(user.name)}
                                    </AvatarFallback>
                                </Avatar>

                                <FormField
                                    control={form.control}
                                    name="avatar"
                                    render={({ field: { value, onChange, ...field } }) => (
                                        <FormItem>
                                            <FormControl>
                                                <div className="flex flex-col items-center gap-2">
                                                    <Input
                                                        {...field}
                                                        ref={fileInputRef}
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleAvatarChange}
                                                        className="hidden"
                                                        id="avatar-input"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => fileInputRef.current?.click()}
                                                    >
                                                        <ImageIcon className="mr-2 h-4 w-4" />
                                                        Cambiar Avatar
                                                    </Button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Separator />

                            {/* Name Field */}
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

                            {/* Email Field */}
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

                            {/* Role Field - Read Only */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Rol
                                </label>
                                <Input
                                    value={user.role}
                                    disabled
                                    className="bg-muted cursor-not-allowed"
                                />
                                <p className="text-sm text-muted-foreground">
                                    El rol no puede ser modificado
                                </p>
                            </div>

                            <Separator />

                            {/* Password Change Section */}
                            <div className="space-y-4">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full justify-between"
                                    onClick={() => setShowPasswordSection(!showPasswordSection)}
                                >
                                    <span className="font-medium">Cambiar Contraseña</span>
                                    {showPasswordSection ? (
                                        <ChevronUp className="h-4 w-4" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4" />
                                    )}
                                </Button>

                                {showPasswordSection && (
                                    <div className="space-y-4 pt-2">
                                        <FormField
                                            control={form.control}
                                            name="oldPassword"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Contraseña Actual</FormLabel>
                                                    <FormControl>
                                                        <Input type="password" placeholder="••••••••" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="password"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Nueva Contraseña</FormLabel>
                                                    <FormControl>
                                                        <Input type="password" placeholder="••••••••" {...field} />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Mínimo 8 caracteres
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="passwordConfirm"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                                                    <FormControl>
                                                        <Input type="password" placeholder="••••••••" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end">
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
