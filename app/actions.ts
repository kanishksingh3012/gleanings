"use server";

import { revalidatePath } from "next/cache";
import { assertCanEdit, clearEditCookie, tryUnlock } from "@/lib/auth";
import type { FoundResource } from "@/lib/resources";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const AVATAR_BUCKET = "post-avatars";
const MAX_NOTE_LENGTH = 5000;

function done() {
  revalidatePath("/");
}

async function updatePost(urn: string, fields: Record<string, unknown>) {
  await assertCanEdit();
  const { error } = await getSupabaseAdmin().from("posts").update(fields).eq("linkedin_urn", urn);
  if (error) throw new Error(error.message);
  done();
}

async function updateResource(id: string, fields: Record<string, unknown>) {
  await assertCanEdit();
  const { error } = await getSupabaseAdmin().from("resources").update(fields).eq("id", id);
  if (error) throw new Error(error.message);
  done();
}

// --- Access -----------------------------------------------------------------

export async function unlock(password: string): Promise<{ ok: boolean }> {
  const ok = await tryUnlock(password);
  if (ok) done();
  return { ok };
}

export async function lock() {
  await clearEditCookie();
  done();
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

  done();
}

// --- Resources --------------------------------------------------------------

export async function addResource(sourceUrn: string, resource: FoundResource) {
  await assertCanEdit();
  const { error } = await getSupabaseAdmin()
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
    );
  if (error) throw new Error(error.message);
  done();
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
  done();
}
