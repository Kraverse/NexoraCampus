# Contributing to NexoraCampus

Thanks for your interest in improving NexoraCampus! 🎉

## Getting started

1. Fork & clone the repo.
2. `npm install`
3. Copy `.env.example` to `.env` and fill in your `DATABASE_URL`.
4. Apply the schema: `npx drizzle-kit push`
5. Seed demo data: `npx tsx scripts/seed.ts`
6. `npm run dev`

## Project structure (feature-first, separation of concerns)

```
src/
  app/            # Next.js App Router pages + API routes
    api/          # REST endpoints (auth, posts, ai, admin, users)
  components/     # Reusable, presentational + smart UI components
  db/             # Drizzle schema & client
  lib/            # Domain logic: auth, ai engine, categories, types
scripts/          # Seed & maintenance scripts
tests/            # Lightweight integration tests
```

## Conventions

- **State**: React hooks + a small `AuthProvider` context (no heavy global store).
- **Styling**: Tailwind CSS v4 with a dark-first token system in `globals.css`.
- **Design language**: minimal, premium, Notion/Figma-level polish. Every async
  screen has a skeleton; every empty list has a friendly empty state.
- **AI**: all AI logic lives in `src/lib/ai.ts`. It works fully offline and
  upgrades to OpenAI automatically when `OPENAI_API_KEY` is set.

## Scope rule

Build and stabilize **V1** before starting V2 features (realtime chat, push
notifications, location sorting, smarter recommendations, verified badges).

## Before opening a PR

- `npm run typecheck`
- `npm run build`
- `npm run test`

Keep PRs focused and describe the "why". Screenshots for UI changes are welcome!
