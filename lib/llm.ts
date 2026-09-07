import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";
import { ParsedPostSchema, type ParsedPost } from "./schemas";

export class LLMExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LLMExtractionError";
  }
}

// "gemini-1.5-flash" was retired by Google; "-latest" aliases track whatever
// Google currently recommends for that tier without needing a code change
// every time a model generation is deprecated.
const MODEL_NAME = "gemini-flash-latest";

// Cap how much text we actually send to the model — a very long article-style
// post shouldn't blow up token cost. The hard request-size reject (20k chars)
// happens earlier in the route; this is a softer, cost-focused truncation.
const MAX_LLM_INPUT_LENGTH = 8_000;

// Below this length there isn't enough content to meaningfully summarize —
// bypass the model entirely per the "Low Context / Short Posts" rule.
const SHORT_TEXT_THRESHOLD = 50;

const SYSTEM_INSTRUCTION = [
  "You extract structured metadata from a single LinkedIn post.",
  "Use ONLY information present in the given text — never invent facts, links, authors, or numbers not in the source.",
  "If the post contains no external URL, extracted_link and link_context must be null.",
  "intent_tags must contain at most one value and domain_tags at most two, chosen ONLY from the provided enum lists — never invent a new tag.",
  "title must be at most 6 words.",
  "summary must be 2-3 sentences describing only what the post actually says.",
].join(" ");

const responseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    summary: { type: SchemaType.STRING },
    extracted_link: { type: SchemaType.STRING, nullable: true },
    link_context: { type: SchemaType.STRING, nullable: true },
    intent_tags: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.STRING,
        format: "enum",
        enum: ["Resources", "Cool Build", "Learning", "Inspiration"],
      },
    },
    domain_tags: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.STRING,
        format: "enum",
        enum: ["Design", "Data", "AI", "Coding", "Development"],
      },
    },
  },
  required: ["title", "summary", "intent_tags", "domain_tags"],
};

function getModel() {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    throw new Error("Missing LLM configuration: LLM_API_KEY is not set");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema,
    },
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** One retry for transient failures (network blip, 5xx, rate limit) before giving up. */
async function generateWithRetry(
  model: ReturnType<typeof getModel>,
  prompt: string,
): Promise<string> {
  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch {
    await sleep(300);
    const result = await model.generateContent(prompt);
    return result.response.text();
  }
}

/**
 * Extracts structured metadata from a sanitized post body via Gemini.
 *
 * Guardrails against hallucination / malformed output:
 * - empty input never reaches the model
 * - very short posts bypass the model entirely (nothing to summarize)
 * - generation is constrained to a JSON responseSchema at low temperature
 * - the model's own JSON is re-validated with Zod regardless (defense in
 *   depth against SDK/model drift); on validation failure we retry once with
 *   the exact error appended, then fail loudly with LLMExtractionError
 *   rather than ever returning unvalidated data
 */
export async function parsePost(sanitizedText: string): Promise<ParsedPost> {
  const trimmed = sanitizedText.trim();
  if (!trimmed) {
    throw new LLMExtractionError("Cannot extract structured data from empty text");
  }

  if (trimmed.length < SHORT_TEXT_THRESHOLD) {
    return {
      title: "Direct Bookmark",
      summary: trimmed,
      extracted_link: null,
      link_context: null,
      intent_tags: [],
      domain_tags: [],
    };
  }

  const truncated = trimmed.slice(0, MAX_LLM_INPUT_LENGTH);
  const model = getModel();

  let prompt = `Extract structured metadata from this LinkedIn post:\n\n${truncated}`;

  const MAX_SCHEMA_ATTEMPTS = 2;
  for (let attempt = 0; attempt < MAX_SCHEMA_ATTEMPTS; attempt++) {
    const raw = await generateWithRetry(model, prompt);

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(raw);
    } catch {
      prompt = `${prompt}\n\nYour previous response was not valid JSON. Respond with ONLY valid JSON matching the schema.`;
      continue;
    }

    const result = ParsedPostSchema.safeParse(parsedJson);
    if (result.success) {
      return result.data;
    }

    prompt = `${prompt}\n\nYour previous response failed validation: ${result.error.message}. Fix it and respond again with ONLY valid JSON matching the schema, using the enum values exactly as given.`;
  }

  throw new LLMExtractionError("Gemini response failed schema validation after retry");
}
