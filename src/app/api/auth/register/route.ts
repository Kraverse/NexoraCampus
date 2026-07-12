import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, createSession, publicUser } from "@/lib/auth";

const COLORS = ["#7c5cff", "#22d3ee", "#f472b6", "#f59e0b", "#10b981", "#ef4444", "#3b82f6"];

export async function POST(req: Request) {
  try {
    const { email, password, name, college } = await req.json();
    if (!email || !password || !name) {
      return Response.json({ error: "Name, email and password are required." }, { status: 400 });
    }
    if (typeof password !== "string" || password.length < 6) {
      return Response.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }
    const normalized = String(email).toLowerCase().trim();
    const existing = await db.select().from(users).where(eq(users.email, normalized));
    if (existing.length) {
      return Response.json({ error: "An account with this email already exists." }, { status: 409 });
    }
    const collegeVerified = /\.(edu|ac\.[a-z]{2,})$/i.test(normalized);
    const [user] = await db
      .insert(users)
      .values({
        email: normalized,
        passwordHash: await hashPassword(password),
        name: String(name).trim().slice(0, 120),
        college: college ? String(college).slice(0, 160) : "",
        collegeVerified,
        avatarColor: COLORS[Math.floor(Math.random() * COLORS.length)],
      })
      .returning();
    await createSession({ userId: user.id, email: user.email, role: user.role });
    return Response.json({ user: publicUser(user) });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
