import { getSupabaseAdmin } from "./supabaseAdmin";

export const DOMAIN_TAGS = ["Design", "Data", "AI", "Coding", "Development"] as const;
export const INTENT_TAGS = ["Resources", "Cool Build", "Learning", "Inspiration"] as const;

export type PostStatus = "published" | "archived";
export type LibraryView = "all" | "archived";

export interface Post {
  linkedin_urn: string;
  title: string;
  summary: string;
  author_name: string;
  author_url: string | null;
  author_avatar_url: string | null;
  original_post_url: string;
  extracted_link: string | null;
  link_context: string | null;
  intent_tags: string[];
  domain_tags: string[];
  status: PostStatus;
  created_at: string;
  synced_at: string;
}

export interface PostFilters {
  q?: string;
  domain?: string;
  intent?: string;
  view?: LibraryView;
}

/** Normalizes raw `searchParams` into typed filters, dropping unknown tag values. */
export function parseFilters(params: Record<string, string | string[] | undefined>): PostFilters {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const q = first(params.q)?.trim() || undefined;
  const domain = first(params.domain);
  const intent = first(params.intent);
  return {
    q,
    domain: DOMAIN_TAGS.includes(domain as never) ? domain : undefined,
    intent: INTENT_TAGS.includes(intent as never) ? intent : undefined,
    view: first(params.view) === "archived" ? "archived" : "all",
  };
}

// PostgREST's `or` filter syntax treats commas/parens as separators.
function escapeForOr(value: string): string {
  return value.replace(/[,()*\\]/g, " ");
}

export async function getPosts(filters: PostFilters): Promise<Post[]> {
  let query = getSupabaseAdmin()
    .from("posts")
    .select("*")
    .eq("status", filters.view === "archived" ? "archived" : "published")
    .order("created_at", { ascending: false });

  if (filters.q) {
    const term = `%${escapeForOr(filters.q)}%`;
    query = query.or(`title.ilike.${term},summary.ilike.${term},author_name.ilike.${term}`);
  }
  if (filters.domain) query = query.contains("domain_tags", [filters.domain]);
  if (filters.intent) query = query.contains("intent_tags", [filters.intent]);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to load posts: ${error.message}`);
  return (data ?? []) as Post[];
}

export async function getPostByUrn(urn: string): Promise<Post | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("posts")
    .select("*")
    .eq("linkedin_urn", urn)
    .maybeSingle();
  if (error) throw new Error(`Failed to load post: ${error.message}`);
  return (data as Post | null) ?? null;
}

export async function getLastSyncedAt(): Promise<string | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("posts")
    .select("synced_at")
    .order("synced_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Failed to load sync status: ${error.message}`);
  return data?.synced_at ?? null;
}

export function mutationsEnabled(): boolean {
  return process.env.MUTATIONS_ENABLED === "true";
}
