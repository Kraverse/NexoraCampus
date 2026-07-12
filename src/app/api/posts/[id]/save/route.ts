import { db } from "@/db";
import { posts, savedPosts } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });
  const { id } = await params;
  const postId = parseInt(id, 10);

  const existing = await db
    .select()
    .from(savedPosts)
    .where(and(eq(savedPosts.userId, session.userId), eq(savedPosts.postId, postId)));

  if (existing.length) {
    await db
      .delete(savedPosts)
      .where(and(eq(savedPosts.userId, session.userId), eq(savedPosts.postId, postId)));
    await db
      .update(posts)
      .set({ saveCount: sql`GREATEST(${posts.saveCount} - 1, 0)` })
      .where(eq(posts.id, postId));
    return Response.json({ saved: false });
  }

  await db.insert(savedPosts).values({ userId: session.userId, postId });
  await db
    .update(posts)
    .set({ saveCount: sql`${posts.saveCount} + 1` })
    .where(eq(posts.id, postId));
  return Response.json({ saved: true });
}
