"use server";

import { revalidatePath } from "next/cache";
import { mutationsEnabled } from "@/lib/posts";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const AVATAR_BUCKET = "post-avatars";

// The library has no login yet, so writes are refused server-side unless
// explicitly enabled — hiding the buttons alone wouldn't stop a direct call.
function assertMutationsEnabled() {
  if (!mutationsEnabled()) {
    throw new Error("Editing is disabled on this deployment.");
  }
}

async function setStatus(urn: string, status: "published" | "archived") {
  assertMutationsEnabled();
  const { error } = await getSupabaseAdmin().from("posts").update({ status }).eq("linkedin_urn", urn);
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function archivePost(urn: string) {
  await setStatus(urn, "archived");
}

export async function unarchivePost(urn: string) {
  await setStatus(urn, "published");
}

export async function deletePost(urn: string) {
  assertMutationsEnabled();
  const supabase = getSupabaseAdmin();

  const { data: post } = await supabase
    .from("posts")
    .select("author_avatar_url")
    .eq("linkedin_urn", urn)
    .maybeSingle();

  const { error } = await supabase.from("posts").delete().eq("linkedin_urn", urn);
  if (error) throw new Error(error.message);

  // Best-effort: remove the mirrored avatar too. The object key is the last
  // path segment of the public URL (see lib/storage.ts).
  const key = post?.author_avatar_url?.split(`/${AVATAR_BUCKET}/`)[1];
  if (key) {
    await supabase.storage.from(AVATAR_BUCKET).remove([decodeURIComponent(key)]);
  }

  revalidatePath("/");
}
