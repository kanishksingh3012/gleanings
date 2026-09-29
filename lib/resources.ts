import { getSupabaseAdmin } from "./supabaseAdmin";

export const RESOURCE_TYPES = ["Tool", "Article", "Repo", "List", "Course", "Other"] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

/** A link the AI found inside a post (stored on `posts.resources`). */
export interface FoundResource {
  title: string;
  url: string;
  description: string;
  type: ResourceType;
}

/** A resource the user chose to keep (row in the `resources` table). */
export interface Resource extends FoundResource {
  id: string;
  source_urn: string | null;
  note: string | null;
  is_favorite: boolean;
  created_at: string;
}

export interface ResourceFilters {
  q?: string;
  type?: string;
  starred?: boolean;
}

function escapeForOr(value: string): string {
  return value.replace(/[,()*\\]/g, " ");
}

export async function getResources(filters: ResourceFilters): Promise<Resource[]> {
  let query = getSupabaseAdmin().from("resources").select("*").order("created_at", { ascending: false });

  if (filters.q) {
    const term = `%${escapeForOr(filters.q)}%`;
    query = query.or(`title.ilike.${term},description.ilike.${term},url.ilike.${term},note.ilike.${term}`);
  }
  if (filters.type) query = query.eq("type", filters.type);
  if (filters.starred) query = query.eq("is_favorite", true);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to load resources: ${error.message}`);
  return (data ?? []) as Resource[];
}

/** URLs already kept, so found resources can show "Added". */
export async function getSavedResourceUrls(urls: string[]): Promise<Set<string>> {
  if (urls.length === 0) return new Set();
  const { data, error } = await getSupabaseAdmin().from("resources").select("url").in("url", urls);
  if (error) throw new Error(`Failed to load resources: ${error.message}`);
  return new Set((data ?? []).map((row) => row.url as string));
}
