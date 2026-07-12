"use client";

import { useAuth } from "./AuthProvider";
import { useAppShell } from "./AppShell";
import { IconSparkles, IconBolt } from "./icons";

const FEATURES = [
  { emoji: "💼", label: "Internships" },
  { emoji: "🎉", label: "Events" },
  { emoji: "📚", label: "Resources" },
  { emoji: "🛒", label: "Marketplace" },
  { emoji: "🤝", label: "Help" },
];

export function Hero() {
  const { user, loading } = useAuth();
  const { openAuth } = useAppShell();

  if (loading || user) return null;

  return (
    <div className="mb-6 overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-br from-[#7c5cff]/12 via-[var(--bg-card)] to-[#22d3ee]/8 p-6 sm:p-10 nx-fade-up">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#7c5cff]/40 bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[#c4b5fd]">
        <IconBolt width={13} height={13} /> AI-powered · Built for students
      </div>
      <h1 className="max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
        Your entire campus, <span className="nx-gradient-text">in one super-app</span>.
      </h1>
      <p className="mt-3 max-w-xl text-sm text-[var(--text-dim)] sm:text-base">
        Discover opportunities, share resources, find help, and connect with your community —
        supercharged by AI for smart tagging, moderation, search, and a helpful campus assistant.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          onClick={() => openAuth("register")}
          className="nx-btn-primary flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white"
        >
          <IconSparkles width={17} height={17} /> Get started free
        </button>
        <button
          onClick={() => openAuth("login")}
          className="rounded-xl border border-[var(--border)] bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
        >
          Sign in
        </button>
      </div>

      <div className="mt-7 flex flex-wrap gap-2">
        {FEATURES.map((f) => (
          <span
            key={f.label}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg)]/40 px-3 py-1.5 text-sm text-[var(--text-dim)]"
          >
            {f.emoji} {f.label}
          </span>
        ))}
      </div>
    </div>
  );
}
