"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { useAppShell } from "./AppShell";
import type { FeedPost } from "@/lib/types";
import { PostCard, PostCardSkeleton } from "./PostCard";
import { EmptyState } from "./EmptyState";

export function SavedList() {
  const { user, loading: authLoading } = useAuth();
  const { requireAuth } = useAppShell();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    fetch(`/api/posts?savedBy=${user.id}&limit=20`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setPosts((data.posts || []).map((p: FeedPost) => ({ ...p, saved: true }))))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  if (!authLoading && !user) {
    return (
      <EmptyState
        emoji="🔒"
        title="Sign in to see saved posts"
        description="Bookmark internships, events, and resources to revisit them later."
        action={
          <button
            onClick={() => requireAuth()}
            className="nx-btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
          >
            Sign in
          </button>
        }
      />
    );
  }

  return (
    <div className="nx-fade-up">
      <h1 className="mb-1 text-2xl font-bold text-white">Saved posts</h1>
      <p className="mb-6 text-sm text-[var(--text-dim)]">Your bookmarked opportunities & resources.</p>

      {loading || authLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          emoji="📌"
          title="No saved posts yet"
          description="Tap the bookmark icon on any post to save it here for later."
          action={
            <Link href="/" className="nx-btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold text-white">
              Explore feed
            </Link>
          }
        />
      ) : (
        <div className="nx-stagger grid grid-cols-1 gap-4 md:grid-cols-2">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} requireAuth={requireAuth} />
          ))}
        </div>
      )}
    </div>
  );
}
