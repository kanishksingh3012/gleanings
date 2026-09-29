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
    domain: first(params.domain)?.trim().slice(0, 30) || undefined, // custom tags allowed
    intent: pick(first(params.intent), INTENT_TAGS),
    type: pick(first(params.type), RESOURCE_TYPES),
    starred: first(params.starred) === "1",
    view: pick(first(params.view), VIEWS) ?? "all",
  };
}

/** Whole library in one query; filtering and sorting happen in the browser. */
export async function getAllPosts(): Promise<Post[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load posts: ${error.message}`);
  return (data ?? []) as Post[];
}
