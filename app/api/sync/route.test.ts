import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const maybeSingleForSelect = vi.fn();
const maybeSingleForUpsert = vi.fn();
const eqMock = vi.fn(() => ({ maybeSingle: maybeSingleForSelect }));
const selectMock = vi.fn(() => ({ eq: eqMock }));
const selectAfterUpsertMock = vi.fn(() => ({ maybeSingle: maybeSingleForUpsert }));
const upsertMock = vi.fn(() => ({ select: selectAfterUpsertMock }));
const fromMock = vi.fn(() => ({ select: selectMock, upsert: upsertMock }));

vi.mock("@/lib/supabaseAdmin", () => ({
  getSupabaseAdmin: () => ({ from: fromMock }),
}));

const parsePostMock = vi.fn();
vi.mock("@/lib/llm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/llm")>();
  return { ...actual, parsePost: parsePostMock };
});

const mirrorAvatarMock = vi.fn();
vi.mock("@/lib/storage", () => ({
  mirrorAvatar: mirrorAvatarMock,
}));

const { POST } = await import("./route");
const { LLMExtractionError } = await import("@/lib/llm");

const SECRET = "test-secret-value";

function buildBody(overrides: Record<string, unknown> = {}) {
  return {
    linkedin_urn: "urn:li:activity:12345",
    authorName: "Jane Doe",
    authorUrl: "https://linkedin.com/in/janedoe",
    authorAvatarUrl: "https://media.licdn.com/avatar.jpg",
    rawText: "Some reasonably long post content that exceeds the short-text threshold easily.",
    originalPostUrl: "https://linkedin.com/posts/janedoe_12345",
    ...overrides,
  };
}

function buildRequest(body: unknown, authHeader?: string) {
  return new NextRequest("http://localhost/api/sync", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(authHeader !== undefined ? { authorization: authHeader } : {}),
    },
    body: JSON.stringify(body),
  });
}

const validParsedPost = {
  title: "Cool Post",
  summary: "A reasonably descriptive two sentence summary of the post.",
  extracted_link: null,
  link_context: null,
  intent_tags: ["Learning"],
  domain_tags: ["AI"],
};

beforeEach(() => {
  process.env.API_SECRET_KEY = SECRET;
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.LLM_API_KEY = "gemini-key";

  fromMock.mockClear();
  selectMock.mockClear();
  eqMock.mockClear();
  upsertMock.mockClear();
  selectAfterUpsertMock.mockClear();
  maybeSingleForSelect.mockReset().mockResolvedValue({ data: null });
  maybeSingleForUpsert.mockReset().mockResolvedValue({ data: { linkedin_urn: "urn:li:activity:12345" }, error: null });
  parsePostMock.mockReset().mockResolvedValue(validParsedPost);
  mirrorAvatarMock.mockReset().mockResolvedValue("https://cdn.example.com/mirrored.jpg");
});

describe("POST /api/sync", () => {
  it("rejects a missing Authorization header with 401", async () => {
    const res = await POST(buildRequest(buildBody()));
    expect(res.status).toBe(401);
  });

  it("rejects an incorrect Authorization header of the same length with 401", async () => {
    const wrongSameLength = "x".repeat(`Bearer ${SECRET}`.length);
    const res = await POST(buildRequest(buildBody(), wrongSameLength));
    expect(res.status).toBe(401);
  });

  it("returns 500 naming the missing env var when server misconfigured", async () => {
    delete process.env.LLM_API_KEY;
    const res = await POST(buildRequest(buildBody(), `Bearer ${SECRET}`));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toContain("LLM_API_KEY");
  });

  it("returns 400 for a malformed body (missing required field)", async () => {
    const { linkedin_urn: _linkedin_urn, ...rest } = buildBody();
    const res = await POST(buildRequest(rest, `Bearer ${SECRET}`));
    expect(res.status).toBe(400);
  });

  it("returns 400 for oversized rawText", async () => {
    const res = await POST(
      buildRequest(buildBody({ rawText: "a".repeat(20_001) }), `Bearer ${SECRET}`),
    );
    expect(res.status).toBe(400);
  });

  it("short-circuits on an existing linkedin_urn without calling parsePost/mirrorAvatar", async () => {
    maybeSingleForSelect.mockResolvedValue({ data: { linkedin_urn: "urn:li:activity:12345" } });

    const res = await POST(buildRequest(buildBody(), `Bearer ${SECRET}`));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.duplicate).toBe(true);
    expect(parsePostMock).not.toHaveBeenCalled();
    expect(mirrorAvatarMock).not.toHaveBeenCalled();
  });

  it("processes a new post end-to-end and upserts with onConflict linkedin_urn", async () => {
    const res = await POST(buildRequest(buildBody(), `Bearer ${SECRET}`));
    expect(res.status).toBe(200);

    expect(upsertMock).toHaveBeenCalledTimes(1);
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        linkedin_urn: "urn:li:activity:12345",
        title: validParsedPost.title,
      }),
      { onConflict: "linkedin_urn", ignoreDuplicates: true },
    );
  });

  it("returns 502 (not 500) when parsePost throws LLMExtractionError", async () => {
    parsePostMock.mockRejectedValue(new LLMExtractionError("schema validation failed"));

    const res = await POST(buildRequest(buildBody(), `Bearer ${SECRET}`));
    expect(res.status).toBe(502);
  });
});
