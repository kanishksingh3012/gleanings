import { describe, expect, it } from "vitest";
import { normalizeText } from "./text";

describe("normalizeText", () => {
  it("leaves plain ASCII untouched", () => {
    expect(normalizeText("Hello, world! 123")).toBe("Hello, world! 123");
  });

  it("strips LinkedIn's mathematical alphanumeric bold/italic noise", () => {
    // "𝗹𝗶𝗸𝗲 𝘁𝗵𝗶𝘀" — mathematical sans-serif bold, decomposes to plain letters + combining marks
    const fakeBold = "\u{1D5F9}\u{1D5F6}\u{1D5F0}\u{1D5F2}"; // 𝗹𝗶𝗸𝗲
    const result = normalizeText(fakeBold);
    // NFKD decomposition of these mathematical letters yields plain ASCII with no combining marks left
    expect(result).toMatch(/^[a-zA-Z]+$/);
  });

  it("strips combining diacritical marks introduced by NFKD decomposition", () => {
    const accented = "café";
    const result = normalizeText(accented);
    expect(result).toBe("cafe");
  });
});
