import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });
  const { id } = await params;
  const postId = parseInt(id, 10);
  const [row] = await db
    .update(posts)
    .set({ likeCount: sql`${posts.likeCount} + 1` })
    .where(eq(posts.id, postId))
    .returning({ likeCount: posts.likeCount });
  return Response.json({ likeCount: row?.likeCount ?? 0 });
}
