"use server";

import { assertCanEdit, clearEditCookie, tryUnlock } from "@/lib/auth";
import type { FoundResource, Resource } from "@/lib/resources";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const AVATAR_BUCKET = "post-avatars";
const MAX_NOTE_LENGTH = 5000;

async function updatePost(urn: string, fields: Record<string, unknown>) {
  await assertCanEdit();
  const { error } = await getSupabaseAdmin().from("posts").update(fields).eq("linkedin_urn", urn);
  if (error) throw new Error(error.message);
}

async function updateResource(id: string, fields: Record<string, unknown>) {
  await assertCanEdit();
  const { error } = await getSupabaseAdmin().from("resources").update(fields).eq("id", id);
  if (error) throw new Error(error.message);
}

// --- Access -----------------------------------------------------------------

export async function unlock(password: string): Promise<{ ok: boolean }> {
  return { ok: await tryUnlock(password) };
}

export async function lock() {
  await clearEditCookie();
}

// --- Posts ------------------------------------------------------------------

export async function archivePost(urn: string) {
  await updatePost(urn, { status: "archived" });
}

export async function unarchivePost(urn: string) {
  await updatePost(urn, { status: "published" });
}

export async function togglePostFavorite(urn: string, isFavorite: boolean) {
  await updatePost(urn, { is_favorite: isFavorite });
}

export async function setPostNote(urn: string, note: string) {
  await updatePost(urn, { note: note.trim().slice(0, MAX_NOTE_LENGTH) || null });
}

export async function deletePost(urn: string) {
  await assertCanEdit();
  const supabase = getSupabaseAdmin();

  const { data: post } = await supabase
    .from("posts")
    .select("author_avatar_url")
    .eq("linkedin_urn", urn)
    .maybeSingle();

  const { error } = await supabase.from("posts").delete().eq("linkedin_urn", urn);
  if (error) throw new Error(error.message);

  // Best-effort: remove the mirrored avatar too (object key = last URL segment).
  const key = post?.author_avatar_url?.split(`/${AVATAR_BUCKET}/`)[1];
  if (key) {
    await supabase.storage.from(AVATAR_BUCKET).remove([decodeURIComponent(key)]);
  }
}

// --- Resources --------------------------------------------------------------

export async function addResource(sourceUrn: string, resource: FoundResource): Promise<Resource | null> {
  await assertCanEdit();
  const { data, error } = await getSupabaseAdmin()
    .from("resources")
    .upsert(
      {
        url: resource.url,
        title: resource.title,
        description: resource.description,
        type: resource.type,
        source_urn: sourceUrn,
      },
      { onConflict: "url", ignoreDuplicates: true },
    )
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Resource | null;
}

export async function toggleResourceFavorite(id: string, isFavorite: boolean) {
  await updateResource(id, { is_favorite: isFavorite });
}

export async function setResourceNote(id: string, note: string) {
  await updateResource(id, { note: note.trim().slice(0, MAX_NOTE_LENGTH) || null });
}

export async function deleteResource(id: string) {
  await assertCanEdit();
  const { error } = await getSupabaseAdmin().from("resources").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
