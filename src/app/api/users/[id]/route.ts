import { db } from "@/db";
import { users, posts, savedPosts } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getSession, publicUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = parseInt(id, 10);
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

  const [{ count: postCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(posts)
    .where(and(eq(posts.authorId, userId), eq(posts.status, "published")));

  const [{ count: savedCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(savedPosts)
    .where(eq(savedPosts.userId, userId));

  return Response.json({
    user: publicUser(user),
    stats: { postCount, savedCount },
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  const { id } = await params;
  const userId = parseInt(id, 10);
  if (!session || session.userId !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { name, bio, college } = await req.json();
  const [updated] = await db
    .update(users)
    .set({
      ...(name !== undefined ? { name: String(name).slice(0, 120) } : {}),
      ...(bio !== undefined ? { bio: String(bio).slice(0, 500) } : {}),
      ...(college !== undefined ? { college: String(college).slice(0, 160) } : {}),
    })
    .where(eq(users.id, userId))
    .returning();
  return Response.json({ user: publicUser(updated) });
}
