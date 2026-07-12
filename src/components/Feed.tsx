"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { FeedPost } from "@/lib/types";
import { PostCard, PostCardSkeleton } from "./PostCard";
import { EmptyState } from "./EmptyState";
import { CATEGORIES } from "@/lib/categories";
import { IconSearch, IconSparkles } from "./icons";
import { useAppShell } from "./AppShell";

const SORTS = [
  { id: "smart", label: "✨ For you" },
  { id: "recent", label: "🕒 Recent" },
  { id: "popular", label: "🔥 Popular" },
];

export function Feed() {
  const params = useSearchParams();
  const router = useRouter();
  const { requireAuth } = useAppShell();

  const category = params.get("category") || "";
  const tag = params.get("tag") || "";
  const [sort, setSort] = useState("smart");
  const [query, setQuery] = useState(params.get("q") || "");
  const [activeQuery, setActiveQuery] = useState(params.get("q") || "");

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  const buildUrl = useCallback(
    (p: number) => {
      const u = new URLSearchParams();
      if (category) u.set("category", category);
      if (tag) u.set("tag", tag);
      if (activeQuery) u.set("q", activeQuery);
      u.set("sort", sort);
      u.set("page", String(p));
      return `/api/posts?${u.toString()}`;
    },
    [category, tag, activeQuery, sort]
  );

  // Reset & load first page when filters change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPage(1);
    fetch(buildUrl(1), { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setPosts(data.posts || []);
        setHasMore(!!data.hasMore);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [buildUrl]);

  // Infinite scroll
  useEffect(() => {
    const el = sentinel.current;
    if (!el || loading || !hasMore) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          setLoadingMore(true);
          const next = page + 1;
          fetch(buildUrl(next), { cache: "no-store" })
            .then((r) => r.json())
            .then((data) => {
              setPosts((prev) => [...prev, ...(data.posts || [])]);
              setHasMore(!!data.hasMore);
              setPage(next);
            })
            .finally(() => setLoadingMore(false));
        }
      },
      { rootMargin: "400px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [buildUrl, page, hasMore, loading, loadingMore]);

  function setCategory(c: string) {
    const u = new URLSearchParams(params.toString());
    if (c) u.set("category", c);
    else u.delete("category");
    u.delete("tag");
    router.push(`/?${u.toString()}`);
  }

  function onTagClick(t: string) {
    const u = new URLSearchParams();
    u.set("tag", t);
    router.push(`/?${u.toString()}`);
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setActiveQuery(query.trim());
    const u = new URLSearchParams(params.toString());
    if (query.trim()) u.set("q", query.trim());
    else u.delete("q");
    router.push(`/?${u.toString()}`);
  }

  return (
    <div className="space-y-5">
      {/* Search */}
      <form onSubmit={submitSearch} className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-faint)]">
          <IconSearch />
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search naturally — 'free ML notes', 'cheap laptop'…"
          className="nx-focus w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] py-3.5 pl-12 pr-24 text-sm text-white placeholder:text-[var(--text-faint)] transition focus:border-[#7c5cff]"
        />
        <button
          type="submit"
          className="nx-btn-primary absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-4 py-2 text-sm font-semibold text-white"
        >
          Search
        </button>
      </form>

      {(activeQuery || tag) && (
        <div className="flex items-center gap-2 text-sm text-[var(--text-dim)]">
          <IconSparkles width={16} height={16} />
          {activeQuery ? (
            <span>
              Results for <span className="font-semibold text-white">“{activeQuery}”</span>
            </span>
          ) : (
            <span>
              Tagged <span className="font-semibold text-[#a78bfa]">#{tag}</span>
            </span>
          )}
          <button
            onClick={() => {
              setQuery("");
              setActiveQuery("");
              router.push("/");
            }}
            className="ml-1 text-[var(--text-faint)] underline hover:text-white"
          >
            clear
          </button>
        </div>
      )}

      {/* Category filter row */}
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <FilterPill active={!category} onClick={() => setCategory("")} label="🌐 All" />
        {CATEGORIES.map((c) => (
          <FilterPill
            key={c.id}
            active={category === c.id}
            onClick={() => setCategory(c.id)}
            label={`${c.emoji} ${c.label}`}
          />
        ))}
      </div>

      {/* Sort */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {SORTS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSort(s.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                sort === s.id
                  ? "bg-white/[0.08] text-white"
                  : "text-[var(--text-faint)] hover:text-white"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          emoji="🔭"
          title="Nothing here yet"
          description="No posts match this filter. Be the first to share something with your campus!"
        />
      ) : (
        <>
          <div className="nx-stagger grid grid-cols-1 gap-4 md:grid-cols-2">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} onTagClick={onTagClick} requireAuth={requireAuth} />
            ))}
          </div>
          {loadingMore && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <PostCardSkeleton />
              <PostCardSkeleton />
            </div>
          )}
          <div ref={sentinel} className="h-8" />
          {!hasMore && (
            <p className="py-6 text-center text-sm text-[var(--text-faint)]">
              You&apos;ve reached the end ✨
            </p>
          )}
        </>
      )}
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
        active
          ? "border-[#7c5cff] bg-[var(--accent-soft)] text-white"
          : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-dim)] hover:border-[#38384a] hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}
