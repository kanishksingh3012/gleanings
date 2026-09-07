import { beforeEach, describe, expect, it, vi } from "vitest";

const generateContentMock = vi.fn();
const getGenerativeModelMock = vi.fn(() => ({ generateContent: generateContentMock }));

vi.mock("@google/generative-ai", () => {
  class GoogleGenerativeAI {
    getGenerativeModel = getGenerativeModelMock;
  }
  return {
    GoogleGenerativeAI,
    SchemaType: { OBJECT: "OBJECT", STRING: "STRING", ARRAY: "ARRAY" },
  };
});

const { parsePost, LLMExtractionError } = await import("./llm");

function mockResponse(text: string) {
  return { response: { text: () => text } };
}

beforeEach(() => {
  generateContentMock.mockReset();
  getGenerativeModelMock.mockClear();
  process.env.LLM_API_KEY = "test-key";
});

describe("parsePost", () => {
  it("throws without calling the model on empty input", async () => {
    await expect(parsePost("   ")).rejects.toThrow(LLMExtractionError);
    expect(generateContentMock).not.toHaveBeenCalled();
  });

  it("bypasses the model for short text (< 50 chars)", async () => {
    const result = await parsePost("Short post.");
    expect(result.title).toBe("Direct Bookmark");
    expect(result.summary).toBe("Short post.");
    expect(generateContentMock).not.toHaveBeenCalled();
  });

  it("returns a validated response from a well-formed mocked Gemini reply", async () => {
    const longText = "a".repeat(60);
    generateContentMock.mockResolvedValueOnce(
      mockResponse(
        JSON.stringify({
          title: "Cool Post",
          summary: "A summary of the post that is reasonably descriptive.",
          extracted_link: null,
          link_context: null,
          intent_tags: ["Learning"],
          domain_tags: ["AI"],
        }),
      ),
    );

    const result = await parsePost(longText);
    expect(result.title).toBe("Cool Post");
    expect(generateContentMock).toHaveBeenCalledTimes(1);
  });

  it("retries once on invalid schema, then throws LLMExtractionError on a second bad response", async () => {
    const longText = "b".repeat(60);
    generateContentMock
      .mockResolvedValueOnce(mockResponse(JSON.stringify({ title: "x", intent_tags: ["NotReal"] })))
      .mockResolvedValueOnce(mockResponse(JSON.stringify({ title: "still bad" })));

    await expect(parsePost(longText)).rejects.toThrow(LLMExtractionError);
    expect(generateContentMock).toHaveBeenCalledTimes(2);
  });

  it("recovers from a single transient network failure via retry", async () => {
    const longText = "c".repeat(60);
    generateContentMock
      .mockRejectedValueOnce(new Error("network blip"))
      .mockResolvedValueOnce(
        mockResponse(
          JSON.stringify({
            title: "Recovered",
            summary: "Recovered successfully after one retry attempt.",
            extracted_link: null,
            link_context: null,
            intent_tags: [],
            domain_tags: [],
          }),
        ),
      );

    const result = await parsePost(longText);
    expect(result.title).toBe("Recovered");
    expect(generateContentMock).toHaveBeenCalledTimes(2);
  });
});
