import type { Post, PostFilters } from "./posts";
import type { Resource } from "./resources";

export type SortOrder = "newest" | "oldest" | "az" | "za";

export const SORT_LABELS: Record<SortOrder, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  az: "A → Z",
  za: "Z → A",
};

function matches(query: string | undefined, fields: (string | null | undefined)[]): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return fields.some((field) => field?.toLowerCase().includes(q));
}

function sortBy<T>(items: T[], sort: SortOrder, title: (item: T) => string, date: (item: T) => string): T[] {
  return [...items].sort((a, b) => {
    switch (sort) {
      case "oldest":
        return date(a).localeCompare(date(b));
      case "az":
        return title(a).localeCompare(title(b), undefined, { sensitivity: "base" });
      case "za":
        return title(b).localeCompare(title(a), undefined, { sensitivity: "base" });
      default:
        return date(b).localeCompare(date(a));
    }
  });
}

export function filterPosts(posts: Post[], filters: PostFilters, sort: SortOrder): Post[] {
  const status = filters.view === "archived" ? "archived" : "published";
  const result = posts.filter(
    (p) =>
      p.status === status &&
      (!filters.domain || p.domain_tags.includes(filters.domain)) &&
      (!filters.intent || p.intent_tags.includes(filters.intent)) &&
      (!filters.starred || p.is_favorite) &&
      matches(filters.q, [p.title, p.summary, p.author_name, p.note]),
  );
  return sortBy(result, sort, (p) => p.title, (p) => p.created_at);
}

export function filterResources(resources: Resource[], filters: PostFilters, sort: SortOrder): Resource[] {
  const result = resources.filter(
    (r) =>
      (!filters.type || r.type === filters.type) &&
      (!filters.starred || r.is_favorite) &&
      matches(filters.q, [r.title, r.description, r.url, r.note]),
  );
  return sortBy(result, sort, (r) => r.title, (r) => r.created_at);
}
