import { z } from "zod";

export const ParsedPostSchema = z.object({
  title: z.string().max(60).describe("Catchy title summarising core concept, max 6 words"),
  summary: z.string().describe("Clear, objective breakdown of the post, 2-3 concise sentences"),
  extracted_link: z.string().nullable().optional().describe("External URL found inside post text, if any"),
  link_context: z.string().nullable().optional().describe("One line explanation of what the external link leads to"),
  intent_tags: z.array(z.enum(["Resources", "Cool Build", "Learning", "Inspiration"])).max(1),
  domain_tags: z.array(z.enum(["Design", "Data", "AI", "Coding", "Development"])).max(2),
});

export type ParsedPost = z.infer<typeof ParsedPostSchema>;

// Max length for rawText before we reject the request outright (basic abuse guard).
export const MAX_RAW_TEXT_LENGTH = 20_000;

export const SyncRequestSchema = z.object({
  linkedin_urn: z.string().min(1, "linkedin_urn is required"),
  authorName: z.string().min(1, "authorName is required"),
  authorUrl: z.string().url().nullable().optional(),
  authorAvatarUrl: z.string().url().nullable().optional(),
  rawText: z.string().min(1, "rawText is required").max(MAX_RAW_TEXT_LENGTH, "rawText is too long"),
  originalPostUrl: z.string().url("originalPostUrl must be a valid URL"),
});

export type SyncRequest = z.infer<typeof SyncRequestSchema>;
