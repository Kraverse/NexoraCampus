"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { useAppShell } from "./AppShell";
import type { FeedPost, PublicUser } from "@/lib/types";
import { Avatar, Badge, Spinner, timeAgo } from "./ui";
import { PostCard, PostCardSkeleton } from "./PostCard";
import { EmptyState } from "./EmptyState";
import { IconCheck, IconSparkles } from "./icons";

export function Profile({ id }: { id: string }) {
  const { user, setUser } = useAuth();
  const { requireAuth } = useAppShell();
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [stats, setStats] = useState({ postCount: 0, savedCount: 0 });
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [saved, setSaved] = useState<FeedPost[]>([]);
  const [tab, setTab] = useState<"posts" | "saved">("posts");
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const isOwn = user?.id === Number(id);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/users/${id}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setNotFound(true);
        else {
          setProfile(data.user);
          setStats(data.stats);
        }
      })
      .finally(() => setLoading(false));

    setPostsLoading(true);
    fetch(`/api/posts?authorId=${id}&limit=20`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setPosts(data.posts || []))
      .finally(() => setPostsLoading(false));
  }, [id]);

  useEffect(() => {
    if (tab === "saved" && isOwn && saved.length === 0) {
      fetch(`/api/posts?savedBy=${id}&limit=20`, { cache: "no-store" })
        .then((r) => r.json())
        .then((data) => setSaved((data.posts || []).map((p: FeedPost) => ({ ...p, saved: true }))));
    }
  }, [tab, isOwn, id, saved.length]);

  if (notFound) {
    return <EmptyState emoji="👻" title="User not found" description="This profile doesn't exist." />;
  }
  if (loading || !profile) {
    return (
      <div className="space-y-4">
        <div className="nx-skeleton h-40 w-full rounded-2xl" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <PostCardSkeleton />
          <PostCardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="nx-fade-up">
      {/* Header */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[#7c5cff]/10 to-transparent">
        <div className="h-20 bg-gradient-to-r from-[#7c5cff]/20 via-[#22d3ee]/10 to-[#f472b6]/10" />
        <div className="px-5 pb-5 sm:px-7">
          <div className="-mt-8 mb-3 flex items-end justify-between">
            <div className="rounded-full border-4 border-[var(--bg)]">
              <Avatar name={profile.name} color={profile.avatarColor} size={72} />
            </div>
            {isOwn ? (
              <button
                onClick={() => setEditing((e) => !e)}
                className="rounded-xl border border-[var(--border)] bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08]"
              >
                {editing ? "Close" : "Edit profile"}
              </button>
            ) : null}
          </div>

          {editing && isOwn ? (
            <EditForm profile={profile} onSaved={(u) => { setProfile(u); if (isOwn) setUser(u); setEditing(false); }} />
          ) : (
            <>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">{profile.name}</h1>
                {profile.collegeVerified && (
                  <Badge tone="green">
                    <IconCheck width={12} height={12} /> Verified
                  </Badge>
                )}
                {profile.role === "admin" && <Badge tone="amber">Admin</Badge>}
              </div>
              <p className="mt-0.5 text-sm text-[var(--text-dim)]">
                {profile.college || "Student"} · Joined {timeAgo(profile.createdAt)}
              </p>
              {profile.bio ? (
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-[var(--text-dim)]">{profile.bio}</p>
              ) : isOwn ? (
                <p className="mt-3 text-sm italic text-[var(--text-faint)]">Add a bio to tell your campus about you.</p>
              ) : null}

              <div className="mt-4 flex gap-5">
                <Stat label="Posts" value={stats.postCount} />
                {isOwn && <Stat label="Saved" value={stats.savedCount} />}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 mb-4 flex gap-2 border-b border-[var(--border)]">
        <TabBtn active={tab === "posts"} onClick={() => setTab("posts")} label={`Posts (${stats.postCount})`} />
        {isOwn && <TabBtn active={tab === "saved"} onClick={() => setTab("saved")} label={`Saved (${stats.savedCount})`} />}
      </div>

      {tab === "posts" ? (
        postsLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <PostCardSkeleton /> <PostCardSkeleton />
          </div>
        ) : posts.length === 0 ? (
          <EmptyState emoji="✍️" title="No posts yet" description={isOwn ? "Share your first post with the campus!" : "This user hasn't posted yet."} />
        ) : (
          <div className="nx-stagger grid grid-cols-1 gap-4 md:grid-cols-2">
            {posts.map((p) => <PostCard key={p.id} post={p} requireAuth={requireAuth} />)}
          </div>
        )
      ) : saved.length === 0 ? (
        <EmptyState emoji="📌" title="No saved posts" description="Bookmark posts to find them here." />
      ) : (
        <div className="nx-stagger grid grid-cols-1 gap-4 md:grid-cols-2">
          {saved.map((p) => <PostCard key={p.id} post={p} requireAuth={requireAuth} />)}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <span className="text-lg font-bold text-white">{value}</span>{" "}
      <span className="text-sm text-[var(--text-faint)]">{label}</span>
    </div>
  );
}

function TabBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`relative px-3 pb-2.5 text-sm font-medium transition ${
        active ? "text-white" : "text-[var(--text-faint)] hover:text-white"
      }`}
    >
      {label}
      {active && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-gradient-to-r from-[#7c5cff] to-[#22d3ee]" />}
    </button>
  );
}

function EditForm({ profile, onSaved }: { profile: PublicUser; onSaved: (u: PublicUser) => void }) {
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio || "");
  const [college, setCollege] = useState(profile.college || "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const res = await fetch(`/api/users/${profile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio, college }),
      });
      const data = await res.json();
      if (data.user) onSaved(data.user);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-2 space-y-3">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name"
        className="nx-focus w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3.5 py-2.5 text-sm text-white focus:border-[#7c5cff]" />
      <input value={college} onChange={(e) => setCollege(e.target.value)} placeholder="College"
        className="nx-focus w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3.5 py-2.5 text-sm text-white focus:border-[#7c5cff]" />
      <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Bio"
        className="nx-focus w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3.5 py-2.5 text-sm text-white focus:border-[#7c5cff]" />
      <button onClick={save} disabled={busy}
        className="nx-btn-primary flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
        {busy ? <Spinner size={15} /> : <IconSparkles width={15} height={15} />} Save changes
      </button>
    </div>
  );
}
