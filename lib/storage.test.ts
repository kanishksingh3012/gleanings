import { beforeEach, describe, expect, it, vi } from "vitest";

const uploadMock = vi.fn();
const getPublicUrlMock = vi.fn();
const fromMock = vi.fn(() => ({ upload: uploadMock, getPublicUrl: getPublicUrlMock }));

vi.mock("./supabaseAdmin", () => ({
  getSupabaseAdmin: () => ({
    storage: { from: fromMock },
  }),
}));

const { mirrorAvatar } = await import("./storage");

beforeEach(() => {
  uploadMock.mockReset();
  getPublicUrlMock.mockReset();
  fromMock.mockClear();
  vi.stubGlobal("fetch", vi.fn());
});

describe("mirrorAvatar", () => {
  it("returns null immediately without fetching when avatarUrl is missing", async () => {
    const result = await mirrorAvatar(null, "urn:1");
    expect(result).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns the public URL on a successful mirror", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "image/jpeg" }),
      arrayBuffer: async () => new ArrayBuffer(8),
    } as Response);
    uploadMock.mockResolvedValue({ error: null });
    getPublicUrlMock.mockReturnValue({ data: { publicUrl: "https://cdn.example.com/avatar.jpg" } });

    const result = await mirrorAvatar("https://linkedin.com/avatar.jpg", "urn:1");
    expect(result).toBe("https://cdn.example.com/avatar.jpg");
    expect(uploadMock).toHaveBeenCalledTimes(1);
  });

  it("returns null (not throw) when the fetch rejects", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("network error"));
    const result = await mirrorAvatar("https://linkedin.com/avatar.jpg", "urn:1");
    expect(result).toBeNull();
  });

  it("returns null when the response is not ok", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);
    const result = await mirrorAvatar("https://linkedin.com/avatar.jpg", "urn:1");
    expect(result).toBeNull();
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("returns null when content-type is not an image (never uploads non-image bytes)", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "text/html" }),
    } as Response);
    const result = await mirrorAvatar("https://linkedin.com/avatar.jpg", "urn:1");
    expect(result).toBeNull();
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("returns null when the Supabase upload itself errors", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "image/png" }),
      arrayBuffer: async () => new ArrayBuffer(8),
    } as Response);
    uploadMock.mockResolvedValue({ error: new Error("upload failed") });

    const result = await mirrorAvatar("https://linkedin.com/avatar.jpg", "urn:1");
    expect(result).toBeNull();
  });
});
