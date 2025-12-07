import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from "react";
import { api } from "../lib/api";

/**
 * Minimal AuthContext:
 * - stores user info
 * - exposes login/logout, and a method to refresh current user (me)
 * Replace with your actual auth mechanism (JWT cookie, OAuth, etc.)
 */

type User = { id: string; name?: string; email?: string; roles?: string[] } | null;

type AuthContextValue = {
  user: User;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const res = await api.auth.me();
    if (res.ok) {
      setUser(res.data);
    } else {
      setUser(null);
    }
    setLoading(false);
  }

  async function logout() {
    await api.auth.logout();
    setUser(null);
  }

  useEffect(() => {
    // On mount check current user; backend should read cookie or session
    refresh().catch(() => setLoading(false));
  }, []);

  return <AuthContext.Provider value={{ user, loading, refresh, logout }}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used inside AuthProvider");
  return ctx;
}
