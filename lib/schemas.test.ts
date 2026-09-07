import { describe, expect, it } from "vitest";
import { ParsedPostSchema, SyncRequestSchema } from "./schemas";

describe("ParsedPostSchema", () => {
  const validPost = {
    title: "Great AI Post",
    summary: "This post explains a new AI technique in two sentences. It is quite good.",
    extracted_link: "https://example.com",
    link_context: "Leads to the project repo",
    intent_tags: ["Learning"],
    domain_tags: ["AI", "Coding"],
  };

  it("accepts a valid payload", () => {
    const result = ParsedPostSchema.safeParse(validPost);
    expect(result.success).toBe(true);
  });

  it("accepts empty intent_tags/domain_tags arrays", () => {
    const result = ParsedPostSchema.safeParse({
      ...validPost,
      intent_tags: [],
      domain_tags: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid intent_tags enum value", () => {
    const result = ParsedPostSchema.safeParse({
      ...validPost,
      intent_tags: ["NotARealTag"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 2 domain_tags", () => {
    const result = ParsedPostSchema.safeParse({
      ...validPost,
      domain_tags: ["AI", "Coding", "Design"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 1 intent_tag", () => {
    const result = ParsedPostSchema.safeParse({
      ...validPost,
      intent_tags: ["Learning", "Resources"],
    });
    expect(result.success).toBe(false);
  });
});

describe("SyncRequestSchema", () => {
  const validRequest = {
    linkedin_urn: "urn:li:activity:12345",
    authorName: "Jane Doe",
    authorUrl: "https://linkedin.com/in/janedoe",
    authorAvatarUrl: "https://media.licdn.com/avatar.jpg",
    rawText: "Some post content here.",
    originalPostUrl: "https://linkedin.com/posts/janedoe_12345",
  };

  it("accepts a valid request", () => {
    expect(SyncRequestSchema.safeParse(validRequest).success).toBe(true);
  });

  it("accepts missing optional author fields", () => {
    const { authorUrl: _authorUrl, authorAvatarUrl: _authorAvatarUrl, ...rest } = validRequest;
    expect(SyncRequestSchema.safeParse(rest).success).toBe(true);
  });

  it("rejects a missing linkedin_urn", () => {
    const { linkedin_urn: _linkedin_urn, ...rest } = validRequest;
    expect(SyncRequestSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects a non-URL originalPostUrl", () => {
    const result = SyncRequestSchema.safeParse({ ...validRequest, originalPostUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("rejects oversized rawText", () => {
    const result = SyncRequestSchema.safeParse({
      ...validRequest,
      rawText: "a".repeat(20_001),
    });
    expect(result.success).toBe(false);
  });
});
