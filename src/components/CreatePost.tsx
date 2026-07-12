"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { useAppShell } from "./AppShell";
import { CATEGORIES, type CategoryId } from "@/lib/categories";
import { Spinner } from "./ui";
import { EmptyState } from "./EmptyState";
import { IconSparkles, IconClose, IconBolt, IconCheck } from "./icons";

function haptic() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try { navigator.vibrate(15); } catch {}
  }
}

export function CreatePost() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { openAuth } = useAppShell();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<CategoryId | "">("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");

  const [aiBusy, setAiBusy] = useState<"" | "rewrite" | "tags" | "moderate">("");
  const [suggested, setSuggested] = useState<string[]>([]);
  const [moderation, setModeration] = useState<{ spamScore: number; toxicityScore: number; allowed: boolean; flags: string[] } | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Auto-detect category as the user types
  useEffect(() => {
    const text = `${title} ${body}`.trim();
    if (text.length < 12 || category) return;
    const t = setTimeout(async () => {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "categorize", text }),
      });
      const data = await res.json();
      if (data.category && !category) setCategory(data.category);
      if (Array.isArray(data.tags)) setSuggested(data.tags);
    }, 700);
    return () => clearTimeout(t);
  }, [title, body, category]);

  async function aiRewrite() {
    if (!body.trim()) return;
    setAiBusy("rewrite");
    haptic();
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rewrite", text: body }),
      });
      const data = await res.json();
      if (data.text) setBody(data.text);
    } finally {
      setAiBusy("");
    }
  }

  async function aiTags() {
    const text = `${title} ${body}`.trim();
    if (!text) return;
    setAiBusy("tags");
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "tags", text }),
      });
      const data = await res.json();
      if (Array.isArray(data.tags)) setSuggested(data.tags);
    } finally {
      setAiBusy("");
    }
  }

  async function aiModerate() {
    const text = `${title}. ${body}`.trim();
    if (!text) return;
    setAiBusy("moderate");
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "moderate", text }),
      });
      setModeration(await res.json());
    } finally {
      setAiBusy("");
    }
  }

  function addTag(t: string) {
    const clean = t.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    if (clean && !tags.includes(clean) && tags.length < 8) {
      setTags([...tags, clean]);
      haptic();
    }
    setTagInput("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (title.trim().length < 4) return setError("Add a longer, descriptive title.");
    if (body.trim().length < 10) return setError("Add more detail to your post.");
    if (!category) return setError("Pick a category.");

    // Quiet auth preflight: don't let the user reach a publish-time auth error.
    if (!user) {
      openAuth("login");
      return;
    }

    setSubmitting(true);
    haptic();
    try {
      const authCheck = await fetch("/api/auth/me", {
        cache: "no-store",
        credentials: "include",
      });
      const authData = await authCheck.json();
      if (!authData.user) {
        openAuth("login");
        return;
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, category, tags, imageUrl, location, price }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          openAuth("login");
          return;
        }
        setError(data.error || "Failed to publish.");
        if (data.moderation) setModeration(data.moderation);
        return;
      }
      router.push(`/post/${data.post.id}`);
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={28} />
      </div>
    );
  }

  if (!user) {
    return (
      <EmptyState
        emoji="🔐"
        title="Sign in to create a post"
        description="Create opportunities, resources, and help requests for your campus after logging in."
        action={
          <button
            onClick={() => openAuth("login")}
            className="nx-btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
          >
            Sign in
          </button>
        }
      />
    );
  }

  const showMarketFields = category === "marketplace";
  const showLocation = category === "events" || category === "marketplace";

  return (
    <div className="mx-auto max-w-2xl nx-fade-up">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Create a post</h1>
        <p className="mt-1 text-sm text-[var(--text-dim)]">
          Share with your campus — AI helps you tag, polish, and stay safe.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        {/* Category selector */}
        <div>
          <label className="mb-2 block text-sm font-medium text-white">Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                  category === c.id
                    ? "text-white"
                    : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-dim)] hover:text-white"
                }`}
                style={
                  category === c.id
                    ? { borderColor: c.from, background: `${c.from}22` }
                    : undefined
                }
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-white">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder="e.g. Summer SDE intern referral at a fintech startup"
            className="nx-focus w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-white placeholder:text-[var(--text-faint)] focus:border-[#7c5cff]"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-medium text-white">Details</label>
            <button
              type="button"
              onClick={aiRewrite}
              disabled={aiBusy === "rewrite" || !body.trim()}
              className="flex items-center gap-1.5 rounded-lg border border-[#7c5cff]/40 bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-medium text-[#c4b5fd] transition hover:bg-[#7c5cff]/25 disabled:opacity-50"
            >
              {aiBusy === "rewrite" ? <Spinner size={12} /> : <IconSparkles width={13} height={13} />}
              AI Enhance
            </button>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            placeholder="Describe the opportunity, event, resource, item, or question…"
            className="nx-focus w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-sm leading-relaxed text-white placeholder:text-[var(--text-faint)] focus:border-[#7c5cff]"
          />
        </div>

        {/* Optional media & market fields */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className={showMarketFields ? "" : "sm:col-span-2"}>
            <label className="mb-1.5 block text-sm font-medium text-white">Image URL (optional)</label>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://…"
              className="nx-focus w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-sm text-white placeholder:text-[var(--text-faint)] focus:border-[#7c5cff]"
            />
          </div>
          {showMarketFields && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white">Price</label>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="₹4,500 or Free"
                className="nx-focus w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-sm text-white placeholder:text-[var(--text-faint)] focus:border-[#7c5cff]"
              />
            </div>
          )}
          {showLocation && (
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-white">Location (optional)</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Campus, city, or 'Online'"
                className="nx-focus w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-sm text-white placeholder:text-[var(--text-faint)] focus:border-[#7c5cff]"
              />
            </div>
          )}
        </div>

        {/* Tags */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-medium text-white">Tags</label>
            <button
              type="button"
              onClick={aiTags}
              disabled={aiBusy === "tags"}
              className="flex items-center gap-1.5 rounded-lg border border-[#7c5cff]/40 bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-medium text-[#c4b5fd] transition hover:bg-[#7c5cff]/25 disabled:opacity-50"
            >
              {aiBusy === "tags" ? <Spinner size={12} /> : <IconSparkles width={13} height={13} />}
              Suggest Tags
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-2">
            {tags.map((t) => (
              <span
                key={t}
                className="flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs text-[#c4b5fd]"
              >
                #{t}
                <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))}>
                  <IconClose width={12} height={12} />
                </button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag(tagInput);
                }
              }}
              placeholder={tags.length ? "" : "Add tags (press Enter)…"}
              className="flex-1 bg-transparent px-1 py-1 text-sm text-white outline-none placeholder:text-[var(--text-faint)]"
            />
          </div>
          {suggested.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-[var(--text-faint)]">Suggested:</span>
              {suggested
                .filter((s) => !tags.includes(s))
                .map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addTag(s)}
                    className="rounded-full border border-[var(--border)] bg-white/[0.03] px-2.5 py-1 text-xs text-[var(--text-dim)] transition hover:border-[#7c5cff] hover:text-white"
                  >
                    + {s}
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Moderation check */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-[var(--text-dim)]">
              <IconBolt width={15} height={15} /> AI Safety Check
            </div>
            <button
              type="button"
              onClick={aiModerate}
              disabled={aiBusy === "moderate"}
              className="text-xs font-medium text-[#a78bfa] hover:underline disabled:opacity-50"
            >
              {aiBusy === "moderate" ? "Checking…" : "Run check"}
            </button>
          </div>
          {moderation && (
            <div className="mt-2 space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                {moderation.allowed ? (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <IconCheck width={13} height={13} /> Looks good — safe to publish
                  </span>
                ) : (
                  <span className="text-red-400">⚠ Flagged — please revise before publishing</span>
                )}
              </div>
              <div className="flex gap-4 text-[var(--text-faint)]">
                <span>Spam: {Math.round(moderation.spamScore * 100)}%</span>
                <span>Toxicity: {Math.round(moderation.toxicityScore * 100)}%</span>
              </div>
              {moderation.flags.length > 0 && (
                <div className="text-[var(--text-faint)]">{moderation.flags.join(" · ")}</div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="nx-btn-primary flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-white disabled:opacity-60"
          >
            {submitting ? <Spinner /> : <IconSparkles width={17} height={17} />}
            Publish post
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-medium text-[var(--text-dim)] transition hover:text-white"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
