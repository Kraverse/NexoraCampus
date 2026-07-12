"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FeedPost, RelatedPost } from "@/lib/types";
import { Avatar, CategoryChip, Tag, timeAgo, Spinner } from "./ui";
import { EmptyState } from "./EmptyState";
import { useAuth } from "./AuthProvider";
import { useAppShell } from "./AppShell";
import { ReportModal } from "./ReportModal";
import {
  IconHeart,
  IconBookmark,
  IconEye,
  IconShare,
  IconFlag,
  IconCheck,
  IconLocation,
  IconChevron,
} from "./icons";

function haptic() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try { navigator.vibrate(12); } catch {}
  }
}

export function PostDetail({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const { requireAuth } = useAppShell();
  const [post, setPost] = useState<(FeedPost & { authorBio?: string }) | null>(null);
  const [related, setRelated] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saved, setSaved] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/posts/${id}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setNotFound(true);
        } else {
          setPost(data.post);
          setRelated(data.related || []);
          setSaved(!!data.post.saved);
          setLikes(data.post.likeCount);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  async function toggleSave() {
    if (!requireAuth()) return;
    haptic();
    setSaved((s) => !s);
    const res = await fetch(`/api/posts/${id}/save`, { method: "POST" });
    const data = await res.json();
    if (typeof data.saved === "boolean") setSaved(data.saved);
  }
  async function like() {
    if (!requireAuth() || liked) return;
    haptic();
    setLiked(true);
    setLikes((n) => n + 1);
    await fetch(`/api/posts/${id}/like`, { method: "POST" });
  }
  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: post?.title, url }); return; } catch {}
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  async function del() {
    if (!confirm("Delete this post?")) return;
    await fetch(`/api/posts/${id}`, { method: "DELETE" });
    router.push("/");
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="nx-skeleton h-6 w-40" />
        <div className="nx-skeleton h-8 w-3/4" />
        <div className="nx-skeleton h-52 w-full rounded-2xl" />
        <div className="nx-skeleton h-4 w-full" />
        <div className="nx-skeleton h-4 w-5/6" />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <EmptyState
        emoji="🕳️"
        title="Post not found"
        description="This post may have been removed or never existed."
        action={
          <Link href="/" className="nx-btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold text-white">
            Back to feed
          </Link>
        }
      />
    );
  }

  const canDelete = user && (user.id === post.authorId || user.role === "admin");

  return (
    <div className="mx-auto max-w-2xl nx-fade-up">
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1 text-sm text-[var(--text-faint)] transition hover:text-white"
      >
        <IconChevron width={16} height={16} className="rotate-180" /> Back
      </button>

      <article className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 sm:p-7">
        <div className="mb-4 flex items-center justify-between">
          <CategoryChip category={post.category} size="md" />
          <span className="text-xs text-[var(--text-faint)]">{timeAgo(post.createdAt)}</span>
        </div>

        <h1 className="mb-4 text-2xl font-bold leading-tight text-white sm:text-3xl">
          {post.title}
        </h1>

        {/* Author */}
        <Link
          href={`/profile/${post.authorId}`}
          className="mb-5 flex items-center gap-3 rounded-xl border border-[var(--border)] bg-white/[0.02] p-3 transition hover:bg-white/[0.05]"
        >
          <Avatar name={post.authorName} color={post.authorColor} size={44} />
          <div>
            <div className="flex items-center gap-1 text-sm font-semibold text-white">
              {post.authorName}
              {post.authorVerified && <IconCheck width={14} height={14} className="text-emerald-400" />}
            </div>
            <div className="text-xs text-[var(--text-faint)]">{post.authorCollege || "Student"}</div>
          </div>
        </Link>

        {post.imageUrl ? (
          <div className="mb-5 overflow-hidden rounded-2xl border border-[var(--border)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.imageUrl} alt="" className="w-full object-cover" />
          </div>
        ) : null}

        {(post.price || post.location) && (
          <div className="mb-4 flex flex-wrap gap-2">
            {post.price ? (
              <span className="rounded-lg bg-amber-500/10 px-3 py-1.5 text-sm font-semibold text-amber-400">
                {post.price}
              </span>
            ) : null}
            {post.location ? (
              <span className="inline-flex items-center gap-1 rounded-lg bg-white/[0.04] px-3 py-1.5 text-sm text-[var(--text-dim)]">
                <IconLocation width={15} height={15} /> {post.location}
              </span>
            ) : null}
          </div>
        )}

        <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--text-dim)]">
          {post.body}
        </div>

        {post.tags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {post.tags.map((t) => (
              <Link key={t} href={`/?tag=${t}`}>
                <Tag label={t} />
              </Link>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-[var(--border-soft)] pt-4">
          <button
            onClick={like}
            className={`flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-3.5 py-2 text-sm transition hover:border-pink-500/50 hover:text-pink-400 ${liked ? "border-pink-500/50 text-pink-400" : "text-[var(--text-dim)]"}`}
          >
            <IconHeart width={17} height={17} filled={liked} /> {likes}
          </button>
          <button
            onClick={toggleSave}
            className={`flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-3.5 py-2 text-sm transition hover:border-[#7c5cff]/50 hover:text-[#a78bfa] ${saved ? "border-[#7c5cff]/50 text-[#a78bfa]" : "text-[var(--text-dim)]"}`}
          >
            <IconBookmark width={17} height={17} filled={saved} /> {saved ? "Saved" : "Save"}
          </button>
          <button
            onClick={share}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-3.5 py-2 text-sm text-[var(--text-dim)] transition hover:text-white"
          >
            <IconShare width={17} height={17} /> {copied ? "Copied!" : "Share"}
          </button>
          <span className="flex items-center gap-1.5 px-2 text-sm text-[var(--text-faint)]">
            <IconEye width={17} height={17} /> {post.viewCount}
          </span>
          <div className="flex-1" />
          {canDelete ? (
            <button onClick={del} className="rounded-xl border border-red-500/30 px-3.5 py-2 text-sm text-red-400 transition hover:bg-red-500/10">
              Delete
            </button>
          ) : (
            <button
              onClick={() => (requireAuth() ? setReportOpen(true) : null)}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-3.5 py-2 text-sm text-[var(--text-faint)] transition hover:border-red-500/40 hover:text-red-400"
            >
              <IconFlag width={16} height={16} /> Report
            </button>
          )}
        </div>
      </article>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-white">Related posts</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/post/${r.id}`}
                className="nx-card-hover rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4"
              >
                <CategoryChip category={r.category} />
                <h3 className="mt-2 line-clamp-2 text-sm font-semibold text-white">{r.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-[var(--text-faint)]">{r.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} postId={post.id} />
    </div>
  );
}
