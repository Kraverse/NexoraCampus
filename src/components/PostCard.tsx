"use client";

import Link from "next/link";
import { useState } from "react";
import type { FeedPost } from "@/lib/types";
import { Avatar, CategoryChip, Tag, timeAgo } from "./ui";
import { IconHeart, IconBookmark, IconEye, IconCheck, IconLocation } from "./icons";

function haptic() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(12);
    } catch {}
  }
}

export function PostCard({
  post,
  onTagClick,
  requireAuth,
}: {
  post: FeedPost;
  onTagClick?: (t: string) => void;
  requireAuth?: () => boolean;
}) {
  const [saved, setSaved] = useState(!!post.saved);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likeCount);
  const [saveBusy, setSaveBusy] = useState(false);
  const cat = post.category;
  const summary = post.summary || post.body.slice(0, 160);

  async function toggleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (requireAuth && !requireAuth()) return;
    haptic();
    setSaveBusy(true);
    setSaved((s) => !s);
    try {
      const res = await fetch(`/api/posts/${post.id}/save`, { method: "POST" });
      const data = await res.json();
      if (typeof data.saved === "boolean") setSaved(data.saved);
    } catch {
      setSaved((s) => !s);
    } finally {
      setSaveBusy(false);
    }
  }

  async function toggleLike(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (requireAuth && !requireAuth()) return;
    if (liked) return;
    haptic();
    setLiked(true);
    setLikes((n) => n + 1);
    try {
      await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
    } catch {}
  }

  return (
    <Link
      href={`/post/${post.id}`}
      className="nx-card-hover group block rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 nx-focus sm:p-5"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar name={post.authorName} color={post.authorColor} size={34} />
          <div className="min-w-0">
            <div className="flex items-center gap-1 truncate text-sm font-medium text-white">
              {post.authorName}
              {post.authorVerified && (
                <span title="Verified college email" className="text-emerald-400">
                  <IconCheck width={13} height={13} />
                </span>
              )}
            </div>
            <div className="truncate text-xs text-[var(--text-faint)]">
              {post.authorCollege || "Student"} · {timeAgo(post.createdAt)}
            </div>
          </div>
        </div>
        <CategoryChip category={cat} />
      </div>

      <h3 className="mb-1.5 text-base font-semibold leading-snug text-white transition group-hover:text-[#c4b5fd] sm:text-lg">
        {post.title}
      </h3>

      {post.imageUrl ? (
        <div className="mb-3 overflow-hidden rounded-xl border border-[var(--border)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.imageUrl}
            alt=""
            className="h-44 w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      ) : null}

      <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-[var(--text-dim)]">
        {summary}
      </p>

      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {post.price ? (
          <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
            {post.price}
          </span>
        ) : null}
        {post.location ? (
          <span className="inline-flex items-center gap-1 text-xs text-[var(--text-faint)]">
            <IconLocation width={13} height={13} />
            {post.location}
          </span>
        ) : null}
        {post.tags.slice(0, 3).map((t) => (
          <span
            key={t}
            onClick={(e) => {
              if (onTagClick) {
                e.preventDefault();
                e.stopPropagation();
                onTagClick(t);
              }
            }}
          >
            <Tag label={t} />
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-[var(--border-soft)] pt-3 text-[var(--text-faint)]">
        <div className="flex items-center gap-4 text-xs">
          <button
            onClick={toggleLike}
            className={`flex items-center gap-1 transition hover:text-pink-400 ${liked ? "text-pink-400" : ""}`}
            aria-label="Like"
          >
            <IconHeart width={16} height={16} filled={liked} />
            {likes}
          </button>
          <span className="flex items-center gap-1">
            <IconEye width={16} height={16} />
            {post.viewCount}
          </span>
        </div>
        <button
          onClick={toggleSave}
          disabled={saveBusy}
          className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition hover:bg-white/5 hover:text-[#a78bfa] ${saved ? "text-[#a78bfa]" : ""}`}
          aria-label={saved ? "Remove bookmark" : "Save post"}
        >
          <IconBookmark width={16} height={16} filled={saved} />
          {saved ? "Saved" : "Save"}
        </button>
      </div>
    </Link>
  );
}

export function PostCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <div className="nx-skeleton h-9 w-9 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="nx-skeleton h-3 w-28" />
          <div className="nx-skeleton h-2.5 w-20" />
        </div>
      </div>
      <div className="nx-skeleton mb-2 h-5 w-3/4" />
      <div className="nx-skeleton mb-2 h-3 w-full" />
      <div className="nx-skeleton mb-4 h-3 w-5/6" />
      <div className="flex gap-2">
        <div className="nx-skeleton h-5 w-14 rounded-full" />
        <div className="nx-skeleton h-5 w-14 rounded-full" />
      </div>
    </div>
  );
}
