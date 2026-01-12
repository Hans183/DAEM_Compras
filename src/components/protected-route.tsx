"use client";

import { useRouter } from "next/navigation";
import { useContext, useEffect } from "react";

import { AuthContext } from "@/contexts/auth-context";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const authContext = useContext(AuthContext);
    const router = useRouter();

    useEffect(() => {
        // If not loading and no user, redirect to login
        if (!authContext?.loading && !authContext?.user) {
            router.push("/auth/login");
        }
    }, [authContext?.loading, authContext?.user, router]);

    // Show loading state while checking authentication
    if (authContext?.loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">Verificando autenticación...</p>
                </div>
            </div>
        );
    }

    // If no user after loading, show nothing (redirect will happen)
    if (!authContext?.user) {
        return null;
    }

    // User is authenticated, render children
    return <>{children}</>;
}
