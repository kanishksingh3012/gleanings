import { timingSafeEqual } from "crypto";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { SyncRequestSchema } from "@/lib/schemas";
import { normalizeText } from "@/lib/text";
import { parsePost, LLMExtractionError } from "@/lib/llm";
import { mirrorAvatar } from "@/lib/storage";
import { resolveResourceLinks } from "@/lib/links";

const REQUIRED_ENV_VARS = [
  "API_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "LLM_API_KEY",
] as const;

function findMissingEnvVar(): string | null {
  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key]) return key;
  }
  return null;
}

function isAuthorized(request: NextRequest): boolean {
  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.API_SECRET_KEY}`;

  const headerBuf = Buffer.from(header);
  const expectedBuf = Buffer.from(expected);

  // Lengths must match before timingSafeEqual (it throws on mismatched
  // lengths) — bailing out here is fine since it only leaks header length,
  // not any information about the secret's content.
  if (headerBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(headerBuf, expectedBuf);
}

export async function POST(request: NextRequest) {
  const missingEnvVar = findMissingEnvVar();
  if (missingEnvVar) {
    return NextResponse.json(
      { error: `Server misconfigured: missing ${missingEnvVar}` },
      { status: 500 },
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsedInput = SyncRequestSchema.safeParse(body);
  if (!parsedInput.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsedInput.error.flatten() },
      { status: 400 },
    );
  }

  const { linkedin_urn, authorName, authorUrl, authorAvatarUrl, rawText, originalPostUrl } =
    parsedInput.data;

  const supabase = getSupabaseAdmin();

  // Duplicate short-circuit: check BEFORE doing any avatar-mirroring or LLM
  // work, so a re-synced/double-fired post doesn't burn a Gemini call and an
  // image fetch just to be discarded by ON CONFLICT DO NOTHING. Best-effort
  // only — the linkedin_urn primary key is the actual correctness guarantee
  // against a true race between two first-time syncs of the same URN.
  const { data: existing } = await supabase
    .from("posts")
    .select("linkedin_urn")
    .eq("linkedin_urn", linkedin_urn)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ duplicate: true, linkedin_urn }, { status: 200 });
  }

  const sanitizedText = normalizeText(rawText);

  let parsedPost: Awaited<ReturnType<typeof parsePost>>;
  let mirroredAvatarUrl: string | null;
  try {
    [parsedPost, mirroredAvatarUrl] = await Promise.all([
      parsePost(sanitizedText),
      mirrorAvatar(authorAvatarUrl, linkedin_urn),
    ]);
  } catch (err) {
    if (err instanceof LLMExtractionError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    throw err;
  }

  const resources = await resolveResourceLinks(parsedPost.resources ?? []);

  const { data: inserted, error: insertError } = await supabase
    .from("posts")
    .upsert(
      {
        linkedin_urn,
        title: parsedPost.title,
        summary: parsedPost.summary,
        author_name: authorName,
        author_url: authorUrl ?? null,
        author_avatar_url: mirroredAvatarUrl,
        original_post_url: originalPostUrl,
        extracted_link: parsedPost.extracted_link ?? null,
        link_context: parsedPost.link_context ?? null,
        intent_tags: parsedPost.intent_tags,
        domain_tags: parsedPost.domain_tags,
        resources,
      },
      { onConflict: "linkedin_urn", ignoreDuplicates: true },
    )
    .select()
    .maybeSingle();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ post: inserted, duplicate: false }, { status: 200 });
}
