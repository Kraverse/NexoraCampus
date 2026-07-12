"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { Spinner } from "./ui";
import { IconClose, IconSparkles } from "./icons";

export function AuthModal({
  open,
  onClose,
  defaultMode = "login",
}: {
  open: boolean;
  onClose: () => void;
  defaultMode?: "login" | "register";
}) {
  const { setUser } = useAuth();
  const [mode, setMode] = useState<"login" | "register">(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [college, setCollege] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, college }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      setUser(data.user);
      onClose();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function demo(as: "student" | "admin") {
    setBusy(true);
    setError("");
    const creds =
      as === "admin"
        ? { email: "admin@nexora.edu", password: "admin123" }
        : { email: "demo@nexora.edu", password: "demo123" };
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creds),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        onClose();
      } else {
        setError("Demo account not seeded yet.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 nx-fade-in"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="nx-scale-in relative w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[var(--text-faint)] transition hover:text-white"
          aria-label="Close"
        >
          <IconClose />
        </button>

        <div className="mb-6">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#7c5cff] to-[#22d3ee] text-white">
            <IconSparkles />
          </div>
          <h2 className="text-2xl font-bold text-white">
            {mode === "login" ? "Welcome back" : "Join NexoraCampus"}
          </h2>
          <p className="mt-1 text-sm text-[var(--text-dim)]">
            {mode === "login"
              ? "Sign in to your student community."
              : "Create an account to connect with your campus."}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "register" && (
            <>
              <Field label="Full name" value={name} onChange={setName} placeholder="Aisha Verma" required />
              <Field
                label="College (optional)"
                value={college}
                onChange={setCollege}
                placeholder="IIT Delhi"
              />
            </>
          )}
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@college.edu"
            required
          />
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            required
          />

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="nx-btn-primary flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white disabled:opacity-60"
          >
            {busy ? <Spinner /> : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-[var(--text-faint)]">
          <div className="h-px flex-1 bg-[var(--border)]" />
          quick demo
          <div className="h-px flex-1 bg-[var(--border)]" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => demo("student")}
            disabled={busy}
            className="rounded-xl border border-[var(--border)] bg-white/[0.03] py-2.5 text-sm font-medium text-[var(--text-dim)] transition hover:bg-white/[0.06] hover:text-white"
          >
            👩‍🎓 Student demo
          </button>
          <button
            onClick={() => demo("admin")}
            disabled={busy}
            className="rounded-xl border border-[var(--border)] bg-white/[0.03] py-2.5 text-sm font-medium text-[var(--text-dim)] transition hover:bg-white/[0.06] hover:text-white"
          >
            🛡️ Admin demo
          </button>
        </div>

        <p className="mt-5 text-center text-sm text-[var(--text-dim)]">
          {mode === "login" ? "New here? " : "Already have an account? "}
          <button
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
            className="font-semibold text-[#a78bfa] hover:underline"
          >
            {mode === "login" ? "Create account" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-[var(--text-dim)]">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="nx-focus w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3.5 py-2.5 text-sm text-white placeholder:text-[var(--text-faint)] transition focus:border-[#7c5cff]"
      />
    </label>
  );
}
