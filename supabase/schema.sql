-- Run this in the Supabase SQL Editor for your project.

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

-- Storage bucket setup (do this in the Supabase dashboard, Storage tab —
-- bucket creation isn't available via plain SQL):
--   1. Create a new bucket named `post-avatars`.
--   2. Mark it as a public bucket (public read access), since avatar images
--      are displayed directly in the PWA reader with no auth in front of them.
