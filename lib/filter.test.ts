import { describe, expect, it } from "vitest";
import { filterPosts } from "./filter";
import type { Post } from "./posts";

function post(overrides: Partial<Post>): Post {
  return {
    linkedin_urn: "urn",
    title: "Title",
    summary: "",
    author_name: "Author",
    author_url: null,
    author_avatar_url: null,
    original_post_url: "https://www.linkedin.com/feed/update/urn:li:activity:1/",
    extracted_link: null,
    link_context: null,
    intent_tags: [],
    domain_tags: [],
    status: "published",
    note: null,
    is_favorite: false,
    resources: [],
    created_at: "2026-01-01T00:00:00Z",
    synced_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

const posts = [
  post({ linkedin_urn: "a", title: "banana", created_at: "2026-01-02T00:00:00Z", domain_tags: ["AI"] }),
  post({ linkedin_urn: "b", title: "Apple", created_at: "2026-01-03T00:00:00Z", is_favorite: true, note: "try figma" }),
  post({ linkedin_urn: "c", title: "cherry", created_at: "2026-01-01T00:00:00Z", status: "archived" }),
];

const urns = (list: Post[]) => list.map((p) => p.linkedin_urn);

describe("filterPosts", () => {
  it("excludes archived posts from the library view and shows them in Archived", () => {
    expect(urns(filterPosts(posts, { view: "all" }, "newest"))).toEqual(["b", "a"]);
    expect(urns(filterPosts(posts, { view: "archived" }, "newest"))).toEqual(["c"]);
  });

  it("sorts by date and case-insensitively by title", () => {
    expect(urns(filterPosts(posts, { view: "all" }, "oldest"))).toEqual(["a", "b"]);
    expect(urns(filterPosts(posts, { view: "all" }, "az"))).toEqual(["b", "a"]);
    expect(urns(filterPosts(posts, { view: "all" }, "za"))).toEqual(["a", "b"]);
  });

  it("filters by tag, starred, and search across notes", () => {
    expect(urns(filterPosts(posts, { view: "all", domain: "AI" }, "newest"))).toEqual(["a"]);
    expect(urns(filterPosts(posts, { view: "all", starred: true }, "newest"))).toEqual(["b"]);
    expect(urns(filterPosts(posts, { view: "all", q: "FIGMA" }, "newest"))).toEqual(["b"]);
  });
});
