"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useState, type ReactNode } from "react";
import { AuthProvider, useAuth } from "./AuthProvider";
import { AuthModal } from "./AuthModal";
import { Assistant } from "./Assistant";
import { Avatar } from "./ui";
import {
  IconHome,
  IconBookmark,
  IconUser,
  IconShield,
  IconSparkles,
  IconPlus,
  IconLogout,
  IconMenu,
} from "./icons";
import { CATEGORIES } from "@/lib/categories";

interface ModalCtx {
  requireAuth: () => boolean;
  openAuth: (mode?: "login" | "register") => void;
}
const Ctx = createContext<ModalCtx>({ requireAuth: () => false, openAuth: () => {} });
export const useAppShell = () => useContext(Ctx);

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <Inner>{children}</Inner>
    </AuthProvider>
  );
}

function Inner({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [mobileNav, setMobileNav] = useState(false);

  function openAuth(mode: "login" | "register" = "login") {
    setAuthMode(mode);
    setAuthOpen(true);
  }
  function requireAuth() {
    if (user) return true;
    openAuth("login");
    return false;
  }

  const navItems = [
    { href: "/", label: "Feed", icon: IconHome },
    { href: "/saved", label: "Saved", icon: IconBookmark, auth: true },
    { href: user ? `/profile/${user.id}` : "/", label: "Profile", icon: IconUser, auth: true },
  ];
  if (user?.role === "admin") navItems.push({ href: "/admin", label: "Admin", icon: IconShield });

  return (
    <Ctx.Provider value={{ requireAuth, openAuth }}>
      <div className="min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
            <button
              className="text-[var(--text-dim)] lg:hidden"
              onClick={() => setMobileNav((v) => !v)}
              aria-label="Menu"
            >
              <IconMenu />
            </button>
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#7c5cff] to-[#22d3ee] text-white">
                <IconSparkles width={20} height={20} />
              </div>
              <span className="hidden text-lg font-bold tracking-tight sm:block">
                Nexora<span className="nx-gradient-text">Campus</span>
              </span>
            </Link>

            <div className="flex-1" />

            <button
              onClick={() => router.push("/create")}
              className="nx-btn-primary flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold text-white sm:px-4"
            >
              <IconPlus width={17} height={17} />
              <span className="hidden sm:inline">Create</span>
            </button>

            {loading ? (
              <div className="nx-skeleton h-9 w-9 rounded-full" />
            ) : user ? (
              <div className="group relative">
                <button className="flex items-center gap-2 rounded-full p-0.5 transition hover:ring-2 hover:ring-[#7c5cff]/40">
                  <Avatar name={user.name} color={user.avatarColor} size={36} />
                </button>
                <div className="invisible absolute right-0 top-full z-40 mt-2 w-52 origin-top-right scale-95 rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] p-1.5 opacity-0 shadow-2xl transition-all group-hover:visible group-hover:scale-100 group-hover:opacity-100">
                  <div className="border-b border-[var(--border)] px-3 py-2">
                    <div className="truncate text-sm font-medium text-white">{user.name}</div>
                    <div className="truncate text-xs text-[var(--text-faint)]">{user.email}</div>
                  </div>
                  <Link
                    href={`/profile/${user.id}`}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--text-dim)] transition hover:bg-white/5 hover:text-white"
                  >
                    <IconUser width={16} height={16} /> My profile
                  </Link>
                  <Link
                    href="/saved"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--text-dim)] transition hover:bg-white/5 hover:text-white"
                  >
                    <IconBookmark width={16} height={16} /> Saved
                  </Link>
                  <button
                    onClick={async () => {
                      await logout();
                      router.push("/");
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
                  >
                    <IconLogout width={16} height={16} /> Log out
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => openAuth("login")}
                className="rounded-xl border border-[var(--border)] bg-white/[0.03] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.07]"
              >
                Sign in
              </button>
            )}
          </div>
        </header>

        <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
          {/* Sidebar */}
          <aside
            className={`${
              mobileNav ? "block" : "hidden"
            } fixed inset-x-0 top-16 z-20 border-b border-[var(--border)] bg-[var(--bg-elev)] p-4 lg:static lg:z-0 lg:block lg:w-56 lg:shrink-0 lg:border-0 lg:bg-transparent lg:p-0`}
          >
            <nav className="space-y-1">
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      setMobileNav(false);
                      router.push(item.href);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-[var(--accent-soft)] text-[#c4b5fd]"
                        : "text-[var(--text-dim)] hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <item.icon width={19} height={19} />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="mt-6 hidden lg:block">
              <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-faint)]">
                Categories
              </div>
              <div className="space-y-0.5">
                {CATEGORIES.map((c) => (
                  <Link
                    key={c.id}
                    href={`/?category=${c.id}`}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[var(--text-dim)] transition hover:bg-white/5 hover:text-white"
                  >
                    <span>{c.emoji}</span>
                    {c.label}
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          <main className="min-w-0 flex-1">{children}</main>
        </div>

        <Assistant />
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} defaultMode={authMode} />
      </div>
    </Ctx.Provider>
  );
}
