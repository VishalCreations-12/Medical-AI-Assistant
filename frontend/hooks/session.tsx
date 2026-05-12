"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { authApi } from "@/services/api";
import type { User } from "@/types";

const TOKEN_KEY = "mai_token";

type SessionContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | undefined>(
  undefined,
);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const t = window.localStorage.getItem(TOKEN_KEY);
    if (!t) {
      setUser(null);
      setToken(null);
      return;
    }
    setToken(t);
    try {
      const me = await authApi.me();
      setUser(me);
    } catch {
      window.localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      setToken(null);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await refresh();
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    window.localStorage.setItem(TOKEN_KEY, res.token);
    setToken(res.token);
    setUser(res.user);
    toast.success("Signed in");
  }, []);

  const register = useCallback(
    async (email: string, password: string, role?: string) => {
      const res = await authApi.register(email, password, role);
      window.localStorage.setItem(TOKEN_KEY, res.token);
      setToken(res.token);
      setUser(res.user);
      toast.success("Account ready");
    },
    [],
  );

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    void authApi.logout().catch(() => undefined);
    toast.message("Signed out");
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
      refresh,
    }),
    [user, token, loading, login, register, logout, refresh],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return ctx;
}
