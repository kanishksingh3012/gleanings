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

export async function getAllResources(): Promise<Resource[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("resources")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load resources: ${error.message}`);
  return (data ?? []) as Resource[];
}
