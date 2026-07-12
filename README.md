<<<<<<< HEAD
# 🎓 NexoraCampus

> **Nexora = Nexus + Aurora** — a connection hub with a bright, modern identity.

NexoraCampus is a **premium, AI-powered student community super-app**. It helps
students discover opportunities, share resources, find help, and connect — all
in one unified, dark-mode-first platform that feels like a real startup product.

🔗 **Live demo:** _deploy to Vercel and drop the link here_

---

## ✨ Overview

Students juggle a dozen scattered tools. NexoraCampus brings the campus into one
place: **internships, events, resources, a marketplace, and help requests** — an
infinite, AI-ranked feed with smart categorization, moderation, natural-language
search, and a floating campus assistant.

> ℹ️ This implementation targets a **Next.js (App Router) + PostgreSQL/Drizzle**
> web stack. It fully realizes the NexoraCampus product vision (dark-first design
> system, micro-animations, AI layer, admin moderation, clean architecture) as a
> production-ready web app.

## 🧱 Tech Stack

| Layer      | Choice                                             |
| ---------- | -------------------------------------------------- |
| Frontend   | Next.js 16 (App Router), React 19, TypeScript      |
| Styling    | Tailwind CSS v4, custom dark design-system tokens  |
| Backend    | Next.js Route Handlers (REST)                      |
| Database   | PostgreSQL via Drizzle ORM                         |
| Auth       | JWT sessions (httpOnly cookies) + bcrypt           |
| AI layer   | Built-in offline engine · optional OpenAI upgrade  |
| State      | React hooks + lightweight `AuthProvider` context   |

## 🚀 Features (V1)

- 🔐 **Auth** — email/password, session cookies, auto college-email verification
  (`.edu` / `.ac.*`), demo student & admin logins.
- ♾️ **Infinite feed** with category filters and **smart / recent / popular** sorting.
- 🗂️ **5 categories** — internships, events, resources, marketplace, help.
- ✍️ **Create flow** with image URL, tags, price/location fields, and **AI support**.
- 🔎 **Search & filtering** by query, tag, category, and popularity.
- 🔖 **Saved posts / bookmarks** with one-tap toggle.
- 🚩 **Reporting system** with reasons + admin review.
- 🛡️ **Admin dashboard** — moderation queue + analytics (users, posts, reports, categories).
- 👤 **Profiles** — avatar, bio, college, verified badge, posts & saved tabs, inline editing.
- 📄 **Detailed post view** — share, save, like, report, related posts.

### 🤖 AI features

All AI lives in [`src/lib/ai.ts`](src/lib/ai.ts). It works **100% offline** with
strong heuristics and **auto-upgrades to OpenAI** when `OPENAI_API_KEY` is set.

- Smart post **categorization** + **tag suggestions**
- **AI rewrite / enhancement** for cleaner posts
- **Spam & toxicity detection** gating publish
- **Personalized feed ranking** (engagement × recency)
- **Natural-language search**
- **AI post summaries** for feed cards
- **Nova** — a floating assistant chatbot for help & navigation

## 🎨 UI/UX standards

Dark-mode-first design system · consistent palette, spacing & typography ·
smooth micro-animations (fade-up, scale-in, shimmer, float) · **skeleton loaders
on every async screen** · **beautiful empty states** · haptic feedback on mobile ·
responsive & adaptive from phone to widescreen · reduced-motion support.

## 🗃️ Database schema

Minimal, clean, extensible — core tables:

- `users` — profile, role, avatar color, college + verification
- `posts` — content, category, tags, media, counts, status
- `saved_posts` — bookmarks (user ↔ post)
- `reports` — moderation reports with status
- `ai_logs` — every AI action for observability

See [`src/db/schema.ts`](src/db/schema.ts).

## 🛠️ Setup

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env      # set DATABASE_URL (+ optional OPENAI_API_KEY)

# 3. Apply schema
npx drizzle-kit push

# 4. Seed demo data (5 users, 8 posts)
npx tsx scripts/seed.ts

# 5. Run
npm run dev
```

### Demo accounts

| Role    | Email               | Password   |
| ------- | ------------------- | ---------- |
| Student | `demo@nexora.edu`   | `demo123`  |
| Admin   | `admin@nexora.edu`  | `admin123` |

## 🧪 Tests

```bash
npx tsx tests/ai.test.ts      # AI categorization, tags, moderation, ranking
npx tsx tests/auth.test.ts    # password hashing + college-email detection
```

## 🏛️ Architecture

Feature-first, clean separation of concerns:

```
src/
  app/         # pages + REST API route handlers
  components/  # reusable UI (feed, post card, modals, assistant, admin…)
  db/          # Drizzle schema + client
  lib/         # auth, ai engine, categories, types  ← domain logic
scripts/       # seed
tests/         # integration tests
```

## 🗺️ V2 Roadmap

Realtime chat · push notifications · location-based sorting · smarter AI
recommendations · verified college badge system.

> **Scope rule:** build & stabilize V1 first, then layer V2.

## 📄 License

MIT
=======
# NexoraCampus
>>>>>>> 75c36feef2de4969b045edf9458c680143876b0e
