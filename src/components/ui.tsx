"use client";

import { getCategory } from "@/lib/categories";
import type { ReactNode } from "react";

export function Avatar({
  name,
  color,
  size = 36,
}: {
  name: string;
  color: string;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white select-none"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${color}, ${shade(color, -30)})`,
        fontSize: size * 0.4,
      }}
      aria-hidden
    >
      {initials || "?"}
    </div>
  );
}

function shade(hex: string, amt: number) {
  try {
    let c = hex.replace("#", "");
    if (c.length === 3) c = c.split("").map((x) => x + x).join("");
    const num = parseInt(c, 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amt));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amt));
    const b = Math.max(0, Math.min(255, (num & 0xff) + amt));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
  } catch {
    return hex;
  }
}

export function CategoryChip({ category, size = "sm" }: { category: string; size?: "sm" | "md" }) {
  const cat = getCategory(category);
  const px = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${px}`}
      style={{
        background: `linear-gradient(120deg, ${cat.from}22, ${cat.to}22)`,
        color: cat.from,
        border: `1px solid ${cat.from}44`,
      }}
    >
      <span>{cat.emoji}</span>
      {cat.label}
    </span>
  );
}

export function Tag({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full bg-white/[0.04] px-2.5 py-0.5 text-[11px] text-[var(--text-dim)] transition hover:bg-white/[0.08] hover:text-white"
    >
      #{label}
    </button>
  );
}

export function Spinner({ size = 18 }: { size?: number }) {
  return (
    <span
      className="inline-block animate-spin rounded-full border-2 border-white/20 border-t-white"
      style={{ width: size, height: size }}
      aria-label="Loading"
    />
  );
}

export function Badge({ children, tone = "accent" }: { children: ReactNode; tone?: "accent" | "green" | "amber" | "red" }) {
  const tones: Record<string, string> = {
    accent: "bg-[var(--accent-soft)] text-[#a78bfa] border-[#7c5cff44]",
    green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    red: "bg-red-500/10 text-red-400 border-red-500/30",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function timeAgo(date: string | Date): string {
  const d = new Date(date).getTime();
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  const w = Math.floor(days / 7);
  if (w < 4) return `${w}w ago`;
  return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
