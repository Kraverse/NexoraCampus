import { db } from "@/db";
import { reports } from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });
  const { id } = await params;
  const postId = parseInt(id, 10);
  const { reason, details } = await req.json();
  if (!reason) return Response.json({ error: "Reason required" }, { status: 400 });
  await db.insert(reports).values({
    postId,
    reporterId: session.userId,
    reason: String(reason).slice(0, 80),
    details: String(details ?? "").slice(0, 1000),
  });
  return Response.json({ ok: true });
}
