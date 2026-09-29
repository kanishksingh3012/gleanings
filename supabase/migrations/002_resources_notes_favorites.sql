-- Round 3: notes, favorites, AI-found resources, Resources collection, and a
-- fix for double-encoded avatar URLs. Paste into the Supabase SQL Editor and
-- run once. Safe to re-run.

ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS resources JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'Other', -- Tool | Article | Repo | List | Course | Other
  source_urn TEXT REFERENCES public.posts (linkedin_urn) ON DELETE SET NULL,
  note TEXT,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Same access model as posts: only the server-side service_role key.
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resources TO service_role;

CREATE INDEX IF NOT EXISTS idx_resources_created_at ON public.resources (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resources_source_urn ON public.resources (source_urn);

-- Avatar URLs were stored double-encoded (%253A), which 404s; the objects
-- themselves exist under the single-encoded key.
UPDATE public.posts
SET author_avatar_url = replace(author_avatar_url, '%253A', '%3A')
WHERE author_avatar_url LIKE '%\%253A%';
