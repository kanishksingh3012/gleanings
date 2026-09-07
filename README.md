# LinkedIn Post Processor — Backend

Single-user, Bring-Your-Own-Key backend for turning saved LinkedIn posts into
a structured personal knowledge library. This is the **backend foundation**
(Next.js API + Supabase + Gemini extraction pipeline) — the Chrome extension
and PWA reader UI come in a later pass. See [CLAUDE.md](./CLAUDE.md) for the
full product spec.

## Setup

1. **Install dependencies** (already done if you're reading this from the repo):
   ```bash
   npm install
   ```

2. **Create a Supabase project** at [supabase.com](https://supabase.com).

3. **Run the schema.** Open the SQL Editor in your Supabase project and run
   the contents of [`supabase/schema.sql`](./supabase/schema.sql).

4. **Create the storage bucket.** In the Supabase dashboard's Storage tab,
   create a new bucket named `post-avatars` and mark it **public**.

5. **Get a Gemini API key** from [Google AI Studio](https://aistudio.google.com/apikey).

6. **Configure environment variables.** Copy `.env.example` to `.env.local`
   and fill in the values:
   ```bash
   cp .env.example .env.local
   ```
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` — from your Supabase project's API settings.
   - `LLM_API_KEY` — your Gemini API key.
   - `API_SECRET_KEY` — any random string you invent yourself, e.g. `openssl rand -hex 32`. This is not shared with any external service; it's the bearer token the Chrome extension will use to call this backend.

7. **Run the dev server:**
   ```bash
   npm run dev
   ```

## Testing

```bash
npm test    # Vitest — fully mocked, no real credentials needed
npm run build   # TypeScript + production build check
```

## Trying `/api/sync` manually

Once `.env.local` is filled in with real credentials:

```bash
curl -X POST http://localhost:3000/api/sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your API_SECRET_KEY>" \
  -d '{
    "linkedin_urn": "urn:li:activity:12345",
    "authorName": "Jane Doe",
    "authorUrl": "https://linkedin.com/in/janedoe",
    "authorAvatarUrl": "https://media.licdn.com/dms/image/example.jpg",
    "rawText": "Some interesting post content about building AI agents...",
    "originalPostUrl": "https://linkedin.com/posts/janedoe_12345"
  }'
```

A successful sync returns the inserted row. Re-running the same request
returns `{ "duplicate": true }` without calling the LLM or mirroring the
avatar again.

**Note:** full end-to-end verification (a real row landing in `posts`, an
avatar mirrored into Storage) requires real Supabase + Gemini credentials —
Claude cannot create those cloud accounts for you. Without them, requests
will fail once they reach Supabase/Gemini, which is expected; the auth,
validation, and request-wiring layers are all covered by the automated test
suite regardless.
