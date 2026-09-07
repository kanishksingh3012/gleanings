import { getSupabaseAdmin } from "./supabaseAdmin";

const BUCKET_NAME = "post-avatars";

function extensionFromContentType(contentType: string): string {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  return "jpg";
}

/**
 * Mirrors an external (often expiring) avatar image into permanent Supabase
 * Storage. Never throws — a broken avatar must not block the rest of a sync.
 * Returns null if there's nothing to mirror or the mirror attempt fails.
 */
export async function mirrorAvatar(
  avatarUrl: string | null | undefined,
  urn: string,
): Promise<string | null> {
  if (!avatarUrl) {
    return null;
  }

  try {
    const response = await fetch(avatarUrl);
    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) {
      return null;
    }

    const blob = await response.arrayBuffer();
    const key = `${encodeURIComponent(urn)}.${extensionFromContentType(contentType)}`;

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.storage.from(BUCKET_NAME).upload(key, blob, {
      contentType,
      upsert: true,
    });

    if (error) {
      return null;
    }

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(key);
    return data.publicUrl ?? null;
  } catch {
    return null;
  }
}
