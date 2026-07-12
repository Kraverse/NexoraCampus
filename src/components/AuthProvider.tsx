"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import type { PublicUser } from "@/lib/types";

interface AuthCtx {
  user: PublicUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setUser: (u: PublicUser | null) => void;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  loading: true,
  refresh: async () => {},
  setUser: () => {},
  logout: async () => {},
});

const STORAGE_KEY = "nexora_user";

function readStoredUser(): PublicUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PublicUser) : null;
  } catch {
    return null;
  }
}

function writeStoredUser(user: PublicUser | null) {
  if (typeof window === "undefined") return;
  try {
    if (user) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const initialUser = readStoredUser();
  const hasStickySessionRef = useRef(Boolean(initialUser));
  const [userState, setUserState] = useState<PublicUser | null>(initialUser);
  const [loading, setLoading] = useState(!initialUser);

  const setUser = useCallback((next: PublicUser | null) => {
    setUserState(next);
    writeStoredUser(next);
    hasStickySessionRef.current = Boolean(next);
    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", {
        cache: "no-store",
        credentials: "include",
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
      } else if (!hasStickySessionRef.current) {
        setUser(null);
      } else {
        // Keep the sticky client session available if the cookie is missing or
        // the session lookup temporarily fails, so the user isn't forced to sign
        // in again during normal navigation.
        setLoading(false);
      }
    } catch {
      // Preserve any optimistic client session if the network blips.
      setLoading(false);
    }
  }, [setUser]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      hasStickySessionRef.current = false;
      setUser(null);
    }
  }, [setUser]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <Ctx.Provider value={{ user: userState, loading, refresh, setUser, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
