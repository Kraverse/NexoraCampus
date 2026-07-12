import "dotenv/config";
import { db, pool } from "../src/db";
import { users, posts, savedPosts, reports } from "../src/db/schema";
import bcrypt from "bcryptjs";
import { suggestTags, categorize, localSummarize } from "../src/lib/ai";

const COLORS = ["#7c5cff", "#22d3ee", "#f472b6", "#f59e0b", "#10b981", "#3b82f6", "#ef4444"];

async function main() {
  console.log("🌱 Seeding NexoraCampus…");

  // Clear (dev only)
  await db.delete(reports);
  await db.delete(savedPosts);
  await db.delete(posts);
  await db.delete(users);

  const hash = async (pw: string) => bcrypt.hash(pw, 10);

  const seedUsers = [
    { email: "demo@nexora.edu", password: "demo123", name: "Aisha Verma", college: "IIT Delhi", role: "student", bio: "CS junior. Love building web apps and hunting internships ✨", collegeVerified: true },
    { email: "admin@nexora.edu", password: "admin123", name: "Nova Admin", college: "NexoraCampus HQ", role: "admin", bio: "Keeping the campus safe & friendly.", collegeVerified: true },
    { email: "rohan@campus.ac.in", password: "pass123", name: "Rohan Mehta", college: "BITS Pilani", role: "student", bio: "Design + product. Selling my old gear.", collegeVerified: true },
    { email: "sara@nexora.edu", password: "pass123", name: "Sara Khan", college: "IIM Bangalore", role: "student", bio: "MBA candidate. Events & networking enthusiast.", collegeVerified: true },
    { email: "dev@gmail.com", password: "pass123", name: "Dev Patel", college: "VIT Vellore", role: "student", bio: "ML learner sharing free resources.", collegeVerified: false },
  ];

  const insertedUsers = [];
  for (let i = 0; i < seedUsers.length; i++) {
    const u = seedUsers[i];
    const [row] = await db
      .insert(users)
      .values({
        email: u.email,
        passwordHash: await hash(u.password),
        name: u.name,
        college: u.college,
        role: u.role,
        bio: u.bio,
        collegeVerified: u.collegeVerified,
        avatarColor: COLORS[i % COLORS.length],
      })
      .returning();
    insertedUsers.push(row);
  }

  const [aisha, , rohan, sara, dev] = insertedUsers;

  const seedPosts: {
    authorId: number;
    title: string;
    body: string;
    category?: string;
    imageUrl?: string;
    price?: string;
    location?: string;
    likeCount?: number;
    saveCount?: number;
    viewCount?: number;
  }[] = [
    {
      authorId: aisha.id,
      title: "Referral: Summer SDE Internship at a fintech startup (paid stipend)",
      body: "My team is hiring 2 summer SDE interns. Stack is React + Node. Stipend is ₹40k/month, fully remote. DM me your resume and I'll refer you. Great mentorship and real product work. Apply before the 30th!",
      category: "internships",
      likeCount: 42, saveCount: 28, viewCount: 310,
    },
    {
      authorId: sara.id,
      title: "Campus Hackathon 2026 — ₹1L prize pool, register now!",
      body: "48-hour hackathon happening next weekend at the main auditorium. Teams of up to 4. Themes: AI, sustainability, fintech. Free food, swag, and mentors from top startups. Register with your team by Friday. Let's build something amazing!",
      category: "events",
      location: "Main Auditorium",
      likeCount: 88, saveCount: 51, viewCount: 640,
    },
    {
      authorId: dev.id,
      title: "Free curated roadmap + notes for Machine Learning beginners",
      body: "I compiled a complete ML roadmap with free courses, python notebooks, and my personal notes on DSA and math foundations. Covers everything from linear algebra to neural networks. Totally free — grab it and start learning today.",
      category: "resources",
      likeCount: 120, saveCount: 95, viewCount: 890,
    },
    {
      authorId: rohan.id,
      title: "Selling: Lightly used mechanical keyboard + gaming mouse",
      body: "Moving out, so selling my mechanical keyboard (brown switches) and a wireless gaming mouse. Both in great condition, barely used for a year. Price negotiable for students. Can meet on campus.",
      category: "marketplace",
      price: "₹4,500",
      location: "BITS Pilani campus",
      likeCount: 15, saveCount: 22, viewCount: 180,
    },
    {
      authorId: aisha.id,
      title: "Need help understanding dynamic programming — anyone free?",
      body: "I'm stuck on DP problems for my upcoming interviews. Can anyone explain the intuition behind memoization vs tabulation with a simple example? Would really appreciate a study buddy or a quick call. Thanks in advance!",
      category: "help",
      likeCount: 9, saveCount: 4, viewCount: 95,
    },
    {
      authorId: sara.id,
      title: "Guest lecture: Building a startup from your dorm room",
      body: "A successful founder is coming to talk about going from idea to funded startup while still in college. Free entry, limited seats. Q&A session and networking after. Don't miss this if you have startup dreams!",
      category: "events",
      location: "Seminar Hall B",
      likeCount: 54, saveCount: 33, viewCount: 420,
    },
    {
      authorId: dev.id,
      title: "Product Design internship openings (portfolio-based)",
      body: "A design studio I intern at is looking for UI/UX design interns. Portfolio matters more than experience. Paid, hybrid. Great place to grow your design skills and work on real client projects.",
      category: "internships",
      likeCount: 37, saveCount: 41, viewCount: 290,
    },
    {
      authorId: rohan.id,
      title: "Best free resources for learning Figma & UI design",
      body: "Sharing a list of the best free YouTube channels, Figma community files, and design challenges that helped me level up. Perfect for beginners who want to break into product design without spending money.",
      category: "resources",
      likeCount: 66, saveCount: 58, viewCount: 510,
    },
  ];

  const insertedPosts = [];
  for (const p of seedPosts) {
    const combined = `${p.title}. ${p.body}`;
    const category = p.category || categorize(combined).category;
    const [row] = await db
      .insert(posts)
      .values({
        authorId: p.authorId,
        title: p.title,
        body: p.body,
        summary: localSummarize(p.body),
        category,
        tags: suggestTags(combined),
        imageUrl: p.imageUrl || "",
        price: p.price || "",
        location: p.location || "",
        likeCount: p.likeCount || 0,
        saveCount: p.saveCount || 0,
        viewCount: p.viewCount || 0,
      })
      .returning();
    insertedPosts.push(row);
  }

  // Aisha saves a couple posts
  await db.insert(savedPosts).values([
    { userId: aisha.id, postId: insertedPosts[2].id },
    { userId: aisha.id, postId: insertedPosts[1].id },
  ]);

  // One open report
  await db.insert(reports).values({
    postId: insertedPosts[3].id,
    reporterId: sara.id,
    reason: "Spam or scam",
    details: "Not sure if this is a genuine listing.",
  });

  console.log(`✅ Seeded ${insertedUsers.length} users, ${insertedPosts.length} posts.`);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
