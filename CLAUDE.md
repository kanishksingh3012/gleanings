# CLAUDE.md - LinkedIn Post Processor & Reader (PRD + TRD)

## 1. Executive Summary & Vision

A single-user, open-source (Bring Your Own Key) web application and PWA that transforms saved LinkedIn posts into a scannable, structured personal knowledge library. The mobile workflow uses native LinkedIn post saving, while the desktop Chrome Extension acts as an automated DOM extraction sync engine. Extracted payloads are sanitized, passed through an LLM to generate structured summaries, categorized, and persisted to a Supabase database.

---

## 2. System Architecture & Ingestion Flow

```
[Mobile/Desktop LinkedIn] ──> Save Post Natively
│
▼
[Desktop Chrome Extension] ──> Intercept / Scrape my-items/saved-posts/
│ (Raw Text, Author, Avatar, Link, URN)
▼
[Next.js API: /api/sync] ────> 1. Normalize Unicode text (NFKD)
                                2. Upload CDN Avatar to Supabase Storage
                                3. Pass to LLM with Zod Schema
│
▼
[Supabase PostgreSQL] ────────> Insert with ON CONFLICT (linkedin_urn) DO NOTHING
│
▼
[Responsive PWA Reader] ──────> Display in Library/Drafts with Filters & Search
```

---

## 3. Database Schema (Supabase PostgreSQL)

Execute the following schema in the Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS public.posts (
  linkedin_urn TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_url TEXT,
  author_avatar_url TEXT,
  original_post_url TEXT NOT NULL,
  extracted_link TEXT,
  link_context TEXT,
  intent_tags TEXT[] DEFAULT '{}',
  domain_tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'published', -- 'published' or 'draft'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for fast search and filter queries
CREATE INDEX IF NOT EXISTS idx_posts_domain_tags ON public.posts USING GIN (domain_tags);
CREATE INDEX IF NOT EXISTS idx_posts_intent_tags ON public.posts USING GIN (intent_tags);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts (created_at DESC);
```

### Storage Bucket

Bucket Name: `post-avatars` (Public read access enabled).

---

## 4. Security & BYOK Architecture

- **Model:** Single-user deployment / Open-source forkable (Bring Your Own Key).
- **Authentication:** NO Supabase Auth / NextAuth required for V1.
- **Route Protection:** Protect `/api/sync` and `/api/parse` endpoints by validating the HTTP Header:
  `Authorization: Bearer <API_SECRET_KEY>`

### Environment Variables (`.env.local`):

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
LLM_API_KEY=your_gemini_or_groq_key
API_SECRET_KEY=your_custom_secure_bearer_token
```

`.env.example`: Provide empty keys for GitHub open-source cloning.

---

## 5. Chrome Extension Specification (Manifest V3)

### Structure

```
chrome-extension/
├── manifest.json
├── popup.html / popup.js
├── options.html / options.js (Configures Backend URL & API Secret)
├── content.js (DOM Scraper for saved posts)
└── background.js (Service Worker & Storage Sync)
```

### Key Functional Requirements

- **Target URL:** `https://www.linkedin.com/my-items/saved-posts/`
- **Scraping Target:** Extract `.reusable-search__result-container` cards.
- **Extracted Attributes per Card:**
  - `linkedin_urn`: Extracted from post container `data-urn` or anchor URN strings.
  - `authorName`: Anchor text from author profile link.
  - `authorUrl`: `href` of author profile.
  - `authorAvatarUrl`: `src` of author profile image.
  - `rawText`: Text content inside description wrapper.
  - `originalPostUrl`: Source post URL.
- **Options Page UI:** Fields for Backend API Base URL and API Secret Key. Save values in `chrome.storage.sync`.

---

## 6. Backend API & LLM Extraction Pipeline

- **Endpoint:** `POST /api/sync`
- **Header Check:** Verify `Authorization` matches `process.env.API_SECRET_KEY`.
- **Text Normalization:** Strip mathematical font noise:

```typescript
const sanitizedText = rawText.normalize('NFKD').replace(/[̀-ͯ]/g, '');
```

- **Avatar Mirroring:** Fetch `authorAvatarUrl`, upload blob to Supabase Storage `post-avatars` bucket, and return permanent public URL.
- **LLM Extraction Call:** Send `sanitizedText` to Gemini/Groq utilizing Zod schema validation.

### Zod Schema Definition (`lib/schemas.ts`)

```typescript
import { z } from 'zod';

export const ParsedPostSchema = z.object({
  title: z.string().max(60).describe("Catchy title summarising core concept, max 6 words"),
  summary: z.string().describe("Clear, objective breakdown of the post, 2-3 concise sentences"),
  extracted_link: z.string().nullable().optional().describe("External URL found inside post text, if any"),
  link_context: z.string().nullable().optional().describe("One line explanation of what the external link leads to"),
  intent_tags: z.array(z.enum(['Resources', 'Cool Build', 'Learning', 'Inspiration'])).max(1),
  domain_tags: z.array(z.enum(['Design', 'Data', 'AI', 'Coding', 'Development'])).max(2)
});
```

---

## 7. PWA Reader UI & Layout Specifications

### Information Architecture

- **Header:** App title, search bar, sync status badge ("Last Synced: X ago"), and manual paste modal CTA.
- **Filter Bar:** Sticky horizontal category pills for Domain and Intent tags.
- **Feed Layout:**
  - Desktop: Responsive 2/3 column card grid.
  - Mobile: Single column vertical list stack.
- **Card Anatomy (Post Skeleton):**
  - Top Row: Domain Tag Badges + Intent Badge.
  - Heading: AI-generated short title (Bold).
  - Author Row: Avatar Image + Author Name (Hyperlinked) + View Original Post link.
  - Body: AI-generated 2-3 sentence summary.
  - Extracted Link Box (if present): External URL + 1-line link context.
  - Footer: Creation timestamp + action button (Delete/Archive).

---

## 8. Resilience & Edge Case Rules

| Risk / Edge Case | System Rule / Mitigation |
|---|---|
| Expiring LinkedIn CDN Images | Chrome Extension passes image URLs to backend; backend immediately mirrors images to Supabase Storage before DB write. |
| LinkedIn CSS Class Drift | Scraper queries structural ARIA/href attributes (`a[href*="/in/"]`) rather than brittle obfuscated class names. |
| Duplicate Sync Attempts | Database enforces `linkedin_urn` primary key constraint with `ON CONFLICT (linkedin_urn) DO NOTHING`. |
| Low Context / Short Posts | If `sanitizedText.length < 50`, bypass heavy LLM summarization and set `title = "Direct Bookmark"` with raw text as summary. |
| Mobile Sync Expectation Gap | UI displays a banner indicating post sync occurs via desktop Chrome Extension. |

---

## 9. Claude Code Step-by-Step Execution Phases

Execute the build in isolated, sequential steps:

- **Phase 1: Database & Security Foundations**
  Prompt: "Set up Next.js App Router project structure with Tailwind CSS, create schema.sql, configure .env.example, and write /api/sync/route.ts with static Bearer Token authentication."
- **Phase 2: LLM Service & Storage Mirroring**
  Prompt: "Implement the LLM parser in /lib/llm.ts using Zod schema validation. Add Supabase Storage avatar mirror utility in /lib/storage.ts to upload external image URLs to the post-avatars bucket."
- **Phase 3: Chrome Extension Engine**
  Prompt: "Create the chrome-extension directory with Manifest V3, Content Script for linkedin.com/my-items/saved-posts/, Background Worker, and Options page for setting backendUrl and apiSecret."
- **Phase 4: Responsive PWA Interface**
  Prompt: "Build the responsive frontend card feed in app/page.tsx, category filter controls, slide-over reader overlay, search filtering, and @serwist/next PWA service worker setup."

---

## Tech Stack

| Layer | Technology | Role & Details |
|---|---|---|
| Framework | Next.js (App Router, TypeScript) | Unified PWA frontend and serverless API backend. |
| Styling & PWA | Tailwind CSS + @serwist/next | Responsive cross-device UI and web manifest/service worker caching. |
| Database & Storage | Supabase (PostgreSQL + Storage) | Metadata database and image bucket for mirrored LinkedIn CDN assets. |
| LLM Engine | Gemini 1.5 Flash or Groq (Llama 3) | Free-tier, structured JSON extraction via Zod schema enforcement. |
| Ingestion Engine | Chrome Extension (Manifest V3) | Desktop background scraper for LinkedIn saved items and DOM extraction. |
| Validation | Zod | End-to-end type safety and enforced LLM JSON outputs. |
| Security | BYOK + Bearer Secret Token | Header verification (API_SECRET_KEY) for single-user endpoint protection. |

---

## Build Status

- **Phase 1-2 (Backend Foundation):** Done. LLM model: `gemini-flash-latest`, with fallback to `gemini-flash-lite-latest` on 503s. Supabase project ref: `ezpgvdrvyqsfiayzwvia`, connected via the Supabase MCP server.
- **Library UI (`app/page.tsx` + `components/library/*`):** Done. Full HeroUI v3 app — search, tag filters (built-in + custom, user-assignable), starred, notes, Resources tab, archive, Markdown export, light/dark, Settings as a modal.
- **Phase 3 (Chrome Extension):** Done and in daily use (`chrome-extension/`) — floating box, right-click save, saving any post URL (not just the current page). See `chrome-extension/README.md`.
- **Access control:** Done. `EDIT_PASSWORD` gates the whole deployed site (`middleware.ts` fails closed if unset) and unlocks editing; `/private` is the lock screen.
- **Public demo (`app/demo/page.tsx`):** Done. Sample data (`lib/demo-data.ts`), no auth required, edits are local-only and never persisted — linked from `/private` and used for the public GitHub/LinkedIn demo link.
- **PWA manifest/service worker:** Not started — not currently planned.
