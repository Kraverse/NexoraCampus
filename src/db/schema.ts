import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// NexoraCampus — core schema (V1)
// Minimal, clean, and extensible: users, posts, saved_posts, reports, ai_logs
// ---------------------------------------------------------------------------

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    avatarColor: varchar("avatar_color", { length: 20 }).notNull().default("#7c5cff"),
    bio: text("bio").default(""),
    college: varchar("college", { length: 160 }).default(""),
    collegeVerified: boolean("college_verified").notNull().default(false),
    role: varchar("role", { length: 20 }).notNull().default("student"), // student | admin
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    emailIdx: index("users_email_idx").on(t.email),
  })
);

export const posts = pgTable(
  "posts",
  {
    id: serial("id").primaryKey(),
    authorId: integer("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    body: text("body").notNull(),
    summary: text("summary").default(""),
    category: varchar("category", { length: 40 }).notNull(), // internships | events | resources | marketplace | help
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    imageUrl: text("image_url").default(""),
    location: varchar("location", { length: 160 }).default(""),
    price: varchar("price", { length: 40 }).default(""), // for marketplace items
    likeCount: integer("like_count").notNull().default(0),
    saveCount: integer("save_count").notNull().default(0),
    viewCount: integer("view_count").notNull().default(0),
    status: varchar("status", { length: 20 }).notNull().default("published"), // published | removed
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    categoryIdx: index("posts_category_idx").on(t.category),
    createdAtIdx: index("posts_created_at_idx").on(t.createdAt),
    authorIdx: index("posts_author_idx").on(t.authorId),
  })
);

export const savedPosts = pgTable(
  "saved_posts",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("saved_user_idx").on(t.userId),
    postIdx: index("saved_post_idx").on(t.postId),
  })
);

export const reports = pgTable(
  "reports",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    reporterId: integer("reporter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reason: varchar("reason", { length: 80 }).notNull(),
    details: text("details").default(""),
    status: varchar("status", { length: 20 }).notNull().default("open"), // open | resolved | dismissed
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    statusIdx: index("reports_status_idx").on(t.status),
  })
);

export const aiLogs = pgTable("ai_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 40 }).notNull(), // categorize | rewrite | moderate | summarize | search | assistant
  input: text("input").default(""),
  output: jsonb("output").$type<unknown>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type SavedPost = typeof savedPosts.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type AiLog = typeof aiLogs.$inferSelect;
