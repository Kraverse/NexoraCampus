import { db } from "@/db";
import { reports, posts, users, aiLogs } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const openReports = await db
    .select({
      id: reports.id,
      reason: reports.reason,
      details: reports.details,
      status: reports.status,
      createdAt: reports.createdAt,
      postId: reports.postId,
      postTitle: posts.title,
      postStatus: posts.status,
      reporterName: users.name,
    })
    .from(reports)
    .innerJoin(posts, eq(reports.postId, posts.id))
    .innerJoin(users, eq(reports.reporterId, users.id))
    .orderBy(desc(reports.createdAt))
    .limit(50);

  const [{ count: userCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users);
  const [{ count: postCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(posts);
  const [{ count: openReportCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(reports)
    .where(eq(reports.status, "open"));
  const [{ count: aiCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(aiLogs);

  const byCategory = await db
    .select({ category: posts.category, count: sql<number>`count(*)::int` })
    .from(posts)
    .where(eq(posts.status, "published"))
    .groupBy(posts.category);

  return Response.json({
    reports: openReports,
    stats: { userCount, postCount, openReportCount, aiCount },
    byCategory,
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { reportId, action } = await req.json();
  // action: dismiss | remove_post | resolve
  const [report] = await db.select().from(reports).where(eq(reports.id, reportId));
  if (!report) return Response.json({ error: "Not found" }, { status: 404 });

  if (action === "remove_post") {
    await db.update(posts).set({ status: "removed" }).where(eq(posts.id, report.postId));
    await db.update(reports).set({ status: "resolved" }).where(eq(reports.id, reportId));
  } else if (action === "dismiss") {
    await db.update(reports).set({ status: "dismissed" }).where(eq(reports.id, reportId));
  } else if (action === "restore_post") {
    await db.update(posts).set({ status: "published" }).where(eq(posts.id, report.postId));
    await db.update(reports).set({ status: "resolved" }).where(eq(reports.id, reportId));
  }
  return Response.json({ ok: true });
}
