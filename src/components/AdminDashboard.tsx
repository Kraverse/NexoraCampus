"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { getCategory } from "@/lib/categories";
import { Badge, Spinner, timeAgo } from "./ui";
import { EmptyState } from "./EmptyState";
import { IconShield, IconCheck } from "./icons";

interface ReportRow {
  id: number;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  postId: number;
  postTitle: string;
  postStatus: string;
  reporterName: string;
}
interface Stats {
  userCount: number;
  postCount: number;
  openReportCount: number;
  aiCount: number;
}

export function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [byCategory, setByCategory] = useState<{ category: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [acting, setActing] = useState<number | null>(null);

  async function load() {
    const res = await fetch("/api/admin", { cache: "no-store" });
    if (res.status === 403) {
      setForbidden(true);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setReports(data.reports || []);
    setStats(data.stats);
    setByCategory(data.byCategory || []);
    setLoading(false);
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setForbidden(true);
      setLoading(false);
      return;
    }
    load();
  }, [authLoading, user]);

  async function act(reportId: number, action: string) {
    setActing(reportId);
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId, action }),
    });
    await load();
    setActing(null);
  }

  if (forbidden) {
    return (
      <EmptyState
        emoji="🛡️"
        title="Admins only"
        description="You need an admin account to access moderation. Try the Admin demo from the sign-in modal."
      />
    );
  }
  if (loading || !stats) {
    return <div className="flex justify-center py-20"><Spinner size={28} /></div>;
  }

  const maxCat = Math.max(1, ...byCategory.map((c) => c.count));

  return (
    <div className="nx-fade-up">
      <div className="mb-6 flex items-center gap-2">
        <span className="text-[#a78bfa]"><IconShield /></span>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Users" value={stats.userCount} emoji="👥" />
        <StatCard label="Posts" value={stats.postCount} emoji="📝" />
        <StatCard label="Open reports" value={stats.openReportCount} emoji="🚩" tone={stats.openReportCount > 0 ? "amber" : undefined} />
        <StatCard label="AI actions" value={stats.aiCount} emoji="✨" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Reports */}
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold text-white">Moderation queue</h2>
          {reports.length === 0 ? (
            <EmptyState emoji="✅" title="All clear" description="No reports to review right now." />
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <div key={r.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge tone="red">{r.reason}</Badge>
                      {r.status !== "open" && <Badge>{r.status}</Badge>}
                      {r.postStatus === "removed" && <Badge tone="amber">post removed</Badge>}
                    </div>
                    <span className="text-xs text-[var(--text-faint)]">{timeAgo(r.createdAt)}</span>
                  </div>
                  <Link href={`/post/${r.postId}`} className="text-sm font-semibold text-white hover:text-[#a78bfa]">
                    {r.postTitle}
                  </Link>
                  {r.details ? <p className="mt-1 text-xs text-[var(--text-dim)]">“{r.details}”</p> : null}
                  <p className="mt-1 text-xs text-[var(--text-faint)]">Reported by {r.reporterName}</p>

                  {r.status === "open" && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => act(r.id, "remove_post")}
                        disabled={acting === r.id}
                        className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                      >
                        Remove post
                      </button>
                      <button
                        onClick={() => act(r.id, "dismiss")}
                        disabled={acting === r.id}
                        className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-dim)] transition hover:text-white disabled:opacity-50"
                      >
                        Dismiss
                      </button>
                      {acting === r.id && <Spinner size={16} />}
                    </div>
                  )}
                  {r.status === "resolved" && r.postStatus === "removed" && (
                    <button
                      onClick={() => act(r.id, "restore_post")}
                      className="mt-3 rounded-lg border border-emerald-500/30 px-3 py-1.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/10"
                    >
                      Restore post
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category analytics */}
        <div>
          <h2 className="mb-3 text-lg font-semibold text-white">Posts by category</h2>
          <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
            {byCategory.length === 0 ? (
              <p className="text-sm text-[var(--text-faint)]">No data yet.</p>
            ) : (
              byCategory.map((c) => {
                const meta = getCategory(c.category);
                return (
                  <div key={c.category}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-[var(--text-dim)]">{meta.emoji} {meta.label}</span>
                      <span className="font-semibold text-white">{c.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${(c.count / maxCat) * 100}%`, background: `linear-gradient(90deg, ${meta.from}, ${meta.to})` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, emoji, tone }: { label: string; value: number; emoji: string; tone?: "amber" }) {
  return (
    <div className={`rounded-xl border p-4 ${tone === "amber" ? "border-amber-500/30 bg-amber-500/5" : "border-[var(--border)] bg-[var(--bg-card)]"}`}>
      <div className="text-2xl">{emoji}</div>
      <div className="mt-1 text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-[var(--text-faint)]">{label}</div>
    </div>
  );
}
