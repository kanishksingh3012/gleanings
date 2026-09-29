import { RESOURCE_TYPES, type FoundResource } from "./resources";
import { getSupabaseAdmin } from "./supabaseAdmin";

export const DOMAIN_TAGS = ["Design", "Data", "AI", "Coding", "Development"] as const;
export const INTENT_TAGS = ["Resources", "Cool Build", "Learning", "Inspiration"] as const;

export type PostStatus = "published" | "archived";
export type LibraryView = "all" | "archived" | "resources";

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
  note: string | null;
  is_favorite: boolean;
  resources: FoundResource[] | null;
  created_at: string;
  synced_at: string;
}

export interface PostFilters {
  q?: string;
  domain?: string;
  intent?: string;
  type?: string;
  starred?: boolean;
  view?: LibraryView;
}

const VIEWS: LibraryView[] = ["all", "archived", "resources"];

/** Normalizes raw `searchParams` into typed filters, dropping unknown values. */
export function parseFilters(params: Record<string, string | string[] | undefined>): PostFilters {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const pick = <T extends string>(value: string | undefined, allowed: readonly T[]) =>
    allowed.includes(value as T) ? (value as T) : undefined;

  return {
    q: first(params.q)?.trim() || undefined,
    domain: pick(first(params.domain), DOMAIN_TAGS),
    intent: pick(first(params.intent), INTENT_TAGS),
    type: pick(first(params.type), RESOURCE_TYPES),
    starred: first(params.starred) === "1",
    view: pick(first(params.view), VIEWS) ?? "all",
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
    query = query.or(
      `title.ilike.${term},summary.ilike.${term},author_name.ilike.${term},note.ilike.${term}`,
    );
  }
  if (filters.domain) query = query.contains("domain_tags", [filters.domain]);
  if (filters.intent) query = query.contains("intent_tags", [filters.intent]);
  if (filters.starred) query = query.eq("is_favorite", true);

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
