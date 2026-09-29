-- Complete setup for a fresh Supabase project. Paste this whole file into the
-- Supabase SQL Editor and run it once. Safe to re-run.

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
  status TEXT DEFAULT 'published', -- 'published' or 'archived'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only the server-side service_role key touches this table (it bypasses RLS).
-- RLS with zero policies keeps anon/authenticated fully locked out.
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Explicit grant: projects created with "Automatically expose new tables"
-- disabled don't give service_role table privileges by default.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO service_role;

CREATE INDEX IF NOT EXISTS idx_posts_domain_tags ON public.posts USING GIN (domain_tags);
CREATE INDEX IF NOT EXISTS idx_posts_intent_tags ON public.posts USING GIN (intent_tags);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts (created_at DESC);

-- Public bucket for mirrored avatars: reads bypass RLS, writes only via service_role.
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-avatars', 'post-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Later changes live in supabase/migrations/ — run those too, in order.
