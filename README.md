# Gleanings

A personal library for LinkedIn posts worth keeping. Save a post with a browser
extension; it gets summarised, tagged, and its links pulled out automatically.
Then search, filter, star, note and organise it from a small web app.

**Demo (sample data, no account needed):** https://gleanings-post-parser.vercel.app/demo

## Stack

Next.js 16 (App Router) + HeroUI + Tailwind, Supabase (Postgres + Storage),
Gemini for summarising/tagging, deployed on Vercel. Plus a plain-JS Manifest V3
browser extension.

## Deploy your own copy

1. **Fork/clone this repo**, then `npm install`.

2. **Create a Supabase project** at [supabase.com](https://supabase.com). In
   the SQL Editor, run [`supabase/schema.sql`](./supabase/schema.sql). In
   Storage, create a bucket named `post-avatars` and mark it **public**.

3. **Get a Gemini API key** from [Google AI Studio](https://aistudio.google.com/apikey).

4. **Set environment variables** — copy `.env.example` to `.env.local` locally,
   and add the same values as Environment Variables in your Vercel project:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — from Supabase's API settings.
   - `LLM_API_KEY` — your Gemini key.
   - `API_SECRET_KEY` — any random string (`openssl rand -hex 32`); the bearer token the extension uses to call your deployment.
   - `EDIT_PASSWORD` — a password of your choosing. **This gates the entire site** — without it set, the deployed site is locked to everyone. Locally, leave it unset (or set `MUTATIONS_ENABLED=true`) to skip the lock screen while developing.

5. **Deploy to Vercel** (or run `npm run dev` locally first to try it out).

6. **Load the browser extension** — see [chrome-extension/README.md](./chrome-extension/README.md)
   for install steps and how saving works. Point it at your deployment's URL
   and the `API_SECRET_KEY` from step 4.

7. Visit your deployment, enter your `EDIT_PASSWORD` to unlock editing, and
   start saving posts.

## Features

- Search across posts, summaries and notes
- Filter by domain/intent tags, plus your own custom tags
- A separate Resources collection for tools/articles/repos found in posts
- Notes, favorites, archive, Markdown export
- Light/dark mode, works on mobile
- Password-gated (single user) — read and edit access both require `EDIT_PASSWORD`

## Local development

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # Vitest, fully mocked
npm run build   # typecheck + production build
```

See [CLAUDE.md](./CLAUDE.md) for the full product spec and design notes.
