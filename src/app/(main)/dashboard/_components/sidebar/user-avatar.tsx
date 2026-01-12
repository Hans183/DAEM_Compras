"use client";

import { BadgeCheck, Bell, CircleUser, LogOut } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/lib/utils";
import { getUserAvatarUrl } from "@/services/users.service";
import Link from "next/link";

export function UserAvatar() {
    const { user, logout } = useAuth();

    if (!user) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Avatar className="size-9 rounded-lg cursor-pointer">
                    <AvatarImage src={getUserAvatarUrl(user)} alt={user.name || user.email} />
                    <AvatarFallback className="rounded-lg">
                        {getInitials(user.name || user.email)}
                    </AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-56 rounded-lg" side="bottom" align="end" sideOffset={4}>
                <div className="flex items-center gap-2 px-2 py-2">
                    <Avatar className="size-9 rounded-lg">
                        <AvatarImage src={getUserAvatarUrl(user)} alt={user.name || user.email} />
                        <AvatarFallback className="rounded-lg">
                            {getInitials(user.name || user.email)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">{user.name || user.email}</span>
                        <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                    </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                        <Link href="/dashboard/profile">
                            <CircleUser />
                            Mi Perfil
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <Bell />
                        Notificaciones
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                    <LogOut />
                    Cerrar Sesión
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
