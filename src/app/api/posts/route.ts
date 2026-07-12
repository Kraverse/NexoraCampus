import { db } from "@/db";
import { posts, users, savedPosts } from "@/db/schema";
import { and, eq, desc, sql, or, ilike, inArray } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { categorize, suggestTags, moderate, summarize, rankFeed } from "@/lib/ai";
import type { CategoryId } from "@/lib/categories";

export const dynamic = "force-dynamic";

const VALID_CATEGORIES: CategoryId[] = [
  "internships",
  "events",
  "resources",
  "marketplace",
  "help",
];

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get("category");
    const q = url.searchParams.get("q")?.trim();
    const tag = url.searchParams.get("tag")?.trim();
    const sort = url.searchParams.get("sort") || "recent"; // recent | popular | smart
    const authorId = url.searchParams.get("authorId");
    const savedBy = url.searchParams.get("savedBy");
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(20, parseInt(url.searchParams.get("limit") || "8", 10));
    const offset = (page - 1) * limit;

    const session = await getSession();

    const conds = [eq(posts.status, "published")];
    if (category && VALID_CATEGORIES.includes(category as CategoryId)) {
      conds.push(eq(posts.category, category));
    }
    if (authorId) conds.push(eq(posts.authorId, parseInt(authorId, 10)));
    if (q) {
      conds.push(
        or(
          ilike(posts.title, `%${q}%`),
          ilike(posts.body, `%${q}%`),
          sql`${posts.tags}::text ILIKE ${"%" + q + "%"}`
        )!
      );
    }
    if (tag) {
      conds.push(sql`${posts.tags}::text ILIKE ${"%" + tag + "%"}`);
    }

    // saved-by filter: restrict to saved post ids
    if (savedBy) {
      const uid = parseInt(savedBy, 10);
      const saved = await db
        .select({ postId: savedPosts.postId })
        .from(savedPosts)
        .where(eq(savedPosts.userId, uid));
      const ids = saved.map((s) => s.postId);
      if (ids.length === 0) {
        return Response.json({ posts: [], hasMore: false, page });
      }
      conds.push(inArray(posts.id, ids));
    }

    let orderBy;
    if (sort === "popular") {
      orderBy = desc(sql`${posts.likeCount} * 3 + ${posts.saveCount} * 4 + ${posts.viewCount}`);
    } else {
      orderBy = desc(posts.createdAt);
    }

    const rows = await db
      .select({
        id: posts.id,
        title: posts.title,
        body: posts.body,
        summary: posts.summary,
        category: posts.category,
        tags: posts.tags,
        imageUrl: posts.imageUrl,
        location: posts.location,
        price: posts.price,
        likeCount: posts.likeCount,
        saveCount: posts.saveCount,
        viewCount: posts.viewCount,
        createdAt: posts.createdAt,
        authorId: posts.authorId,
        authorName: users.name,
        authorColor: users.avatarColor,
        authorCollege: users.college,
        authorVerified: users.collegeVerified,
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(and(...conds))
      .orderBy(orderBy)
      .limit(limit + 1)
      .offset(offset);

    const hasMore = rows.length > limit;
    let pageRows = rows.slice(0, limit);

    if (sort === "smart") {
      pageRows = rankFeed(pageRows);
    }

    // Mark saved state for current user
    let savedSet = new Set<number>();
    if (session && pageRows.length) {
      const ids = pageRows.map((p) => p.id);
      const s = await db
        .select({ postId: savedPosts.postId })
        .from(savedPosts)
        .where(and(eq(savedPosts.userId, session.userId), inArray(savedPosts.postId, ids)));
      savedSet = new Set(s.map((x) => x.postId));
    }

    return Response.json({
      posts: pageRows.map((p) => ({ ...p, saved: savedSet.has(p.id) })),
      hasMore,
      page,
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to load posts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json();
    const title = String(body.title ?? "").trim();
    const text = String(body.body ?? "").trim();
    let category = String(body.category ?? "").trim();
    const tags: string[] = Array.isArray(body.tags)
      ? body.tags.map((t: unknown) => String(t).toLowerCase().slice(0, 24)).slice(0, 8)
      : [];
    const imageUrl = String(body.imageUrl ?? "").slice(0, 500);
    const location = String(body.location ?? "").slice(0, 160);
    const price = String(body.price ?? "").slice(0, 40);

    if (!title || title.length < 4) {
      return Response.json({ error: "Please add a longer title." }, { status: 400 });
    }
    if (!text || text.length < 10) {
      return Response.json({ error: "Please add more detail to your post." }, { status: 400 });
    }

    const combined = `${title}. ${text}`;

    // Moderation gate
    const mod = moderate(combined);
    if (!mod.allowed) {
      return Response.json(
        {
          error: "Your post was flagged by our AI moderation and can't be published.",
          moderation: mod,
        },
        { status: 422 }
      );
    }

    if (!VALID_CATEGORIES.includes(category as CategoryId)) {
      category = categorize(combined).category;
    }

    const finalTags = tags.length ? tags : suggestTags(combined);
    const summary = await summarize(text);

    const [post] = await db
      .insert(posts)
      .values({
        authorId: session.userId,
        title: title.slice(0, 200),
        body: text,
        summary,
        category,
        tags: finalTags,
        imageUrl,
        location,
        price,
      })
      .returning();

    return Response.json({ post });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to create post" }, { status: 500 });
  }
}
