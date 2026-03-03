"use client";

import type React from "react";
import { createContext, useCallback, useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

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

    // biome-ignore lint/suspicious/noDocumentCookie: Sync cookie for PB parity
    document.cookie = pb.authStore.exportToCookie({ httpOnly: false });

    // Listen to auth changes
    const unsubscribe = pb.authStore.onChange((_token, model) => {
      setUser(model as User | null);
      // Update cookie on auth change
      // biome-ignore lint/suspicious/noDocumentCookie: Sync cookie for PB parity on auth change
      document.cookie = pb.authStore.exportToCookie({ httpOnly: false });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const authData = await pb.collection("users").authWithPassword(email, password);
        setUser(authData.record as User);
        router.push("/dashboard");
      } catch (error) {
        console.error("Login error:", error);
        throw error;
      }
    },
    [router],
  );

  const logout = useCallback(() => {
    pb.authStore.clear();
    setUser(null);
    router.push("/auth/login");
  }, [router]);

  const contextValue = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}
