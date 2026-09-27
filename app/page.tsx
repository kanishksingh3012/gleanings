import { MonitorIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { FilterBar } from "@/components/library/filter-bar";
import { PostCard } from "@/components/library/post-card";
import { PostDetailSheet } from "@/components/library/post-detail-sheet";
import { SearchInput } from "@/components/library/search-input";
import { ViewTabs } from "@/components/library/view-tabs";
import { ThemeToggle } from "@/components/theme-toggle";
import { timeAgo } from "@/lib/format";
import { buildHref } from "@/lib/href";
import { getLastSyncedAt, getPostByUrn, getPosts, mutationsEnabled, parseFilters } from "@/lib/posts";

// Reads live data on every request instead of freezing it at build time.
export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: PageProps<"/">) {
  const raw = await searchParams;
  const filters = parseFilters(raw);
  const selectedUrn = typeof raw.post === "string" ? raw.post : undefined;

  // Only the params the UI owns — keeps generated links clean.
  const params = {
    q: filters.q,
    domain: filters.domain,
    intent: filters.intent,
    view: filters.view === "archived" ? "archived" : undefined,
  };

  const [posts, lastSyncedAt] = await Promise.all([getPosts(filters), getLastSyncedAt()]);
  const selected = selectedUrn
    ? (posts.find((p) => p.linkedin_urn === selectedUrn) ?? (await getPostByUrn(selectedUrn)))
    : null;
  const canEdit = mutationsEnabled();
  const hasFilters = Boolean(filters.q || filters.domain || filters.intent);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-reading flex-col gap-6 px-4 py-10 lg:max-w-5xl">
        <header className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-tight">Gleanings</h1>
              <p className="text-sm text-muted-foreground">
                {lastSyncedAt ? `Last saved ${timeAgo(lastSyncedAt)}` : "Nothing saved yet"}
              </p>
            </div>
            <ThemeToggle />
          </div>

          <p className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground sm:hidden">
            <MonitorIcon className="size-4 shrink-0" />
            Posts are saved from your desktop browser with the extension.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="sm:w-80">
              <Suspense>
                <SearchInput />
              </Suspense>
            </div>
            <ViewTabs params={params} view={filters.view ?? "all"} />
          </div>
        </header>

        <FilterBar params={params} />

        {posts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-16 text-center">
            <p className="font-medium">
              {hasFilters
                ? "No posts match these filters"
                : filters.view === "archived"
                  ? "Nothing archived"
                  : "Your library is empty"}
            </p>
            <p className="max-w-measure text-sm text-muted-foreground">
              {hasFilters ? (
                <Link href={buildHref({ view: params.view }, {})} className="underline underline-offset-4">
                  Clear filters
                </Link>
              ) : filters.view === "archived" ? (
                "Archived posts show up here and can be restored any time."
              ) : (
                "Open a LinkedIn post and use the extension's Save button to add it here."
              )}
            </p>
          </div>
        ) : (
          <main className="grid gap-4 lg:grid-cols-2">
            {posts.map((post) => (
              <PostCard
                key={post.linkedin_urn}
                post={post}
                canEdit={canEdit}
                detailHref={buildHref(params, { post: post.linkedin_urn })}
              />
            ))}
          </main>
        )}
      </div>

      <PostDetailSheet
        post={selected}
        closeHref={buildHref(params, {})}
        savedLabel={selected ? timeAgo(selected.synced_at) : null}
      />
    </div>
  );
}
