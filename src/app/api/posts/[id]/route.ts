import { db } from "@/db";
import { posts, users, savedPosts } from "@/db/schema";
import { and, eq, ne, sql, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postId = parseInt(id, 10);
    if (Number.isNaN(postId)) return Response.json({ error: "Bad id" }, { status: 400 });

    const session = await getSession();

    // increment view count (best effort)
    await db
      .update(posts)
      .set({ viewCount: sql`${posts.viewCount} + 1` })
      .where(eq(posts.id, postId));

    const [post] = await db
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
        status: posts.status,
        authorId: posts.authorId,
        authorName: users.name,
        authorColor: users.avatarColor,
        authorCollege: users.college,
        authorVerified: users.collegeVerified,
        authorBio: users.bio,
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.id, postId));

    if (!post || post.status !== "published") {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    const related = await db
      .select({
        id: posts.id,
        title: posts.title,
        summary: posts.summary,
        category: posts.category,
        tags: posts.tags,
        likeCount: posts.likeCount,
        saveCount: posts.saveCount,
        viewCount: posts.viewCount,
        createdAt: posts.createdAt,
        authorName: users.name,
        authorColor: users.avatarColor,
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(
        and(
          eq(posts.category, post.category),
          ne(posts.id, postId),
          eq(posts.status, "published")
        )
      )
      .orderBy(desc(posts.createdAt))
      .limit(4);

    let saved = false;
    if (session) {
      const s = await db
        .select()
        .from(savedPosts)
        .where(and(eq(savedPosts.userId, session.userId), eq(savedPosts.postId, postId)));
      saved = s.length > 0;
    }

    return Response.json({ post: { ...post, saved }, related });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to load post" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });
    const { id } = await params;
    const postId = parseInt(id, 10);
    const [post] = await db.select().from(posts).where(eq(posts.id, postId));
    if (!post) return Response.json({ error: "Not found" }, { status: 404 });
    if (post.authorId !== session.userId && session.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    await db.delete(posts).where(eq(posts.id, postId));
    return Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to delete" }, { status: 500 });
  }
}
