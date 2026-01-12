"use client";

import { useRouter } from "next/navigation";
import type React from "react";
import { createContext, useEffect, useState } from "react";

import pb from "@/lib/pocketbase";
import type { User } from "@/types/user";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check if user is already authenticated
        const authData = pb.authStore.model;
        if (authData) {
            setUser(authData as User);
        }
        setLoading(false);

        // Listen to auth changes
        const unsubscribe = pb.authStore.onChange((token, model) => {
            setUser(model as User | null);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const authData = await pb.collection("users").authWithPassword(email, password);
            setUser(authData.record as User);
            router.push("/dashboard");
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        }
    };

    const logout = () => {
        pb.authStore.clear();
        setUser(null);
        router.push("/auth/login");
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
