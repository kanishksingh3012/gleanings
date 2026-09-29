import { DownloadIcon, MonitorIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { EditLock } from "@/components/library/edit-lock";
import { FilterBar } from "@/components/library/filter-bar";
import { PostCard } from "@/components/library/post-card";
import { PostDetailDrawer } from "@/components/library/post-detail-drawer";
import { ResourceCard } from "@/components/library/resource-card";
import { SearchInput } from "@/components/library/search-input";
import { ViewTabs } from "@/components/library/view-tabs";
import { ThemeToggle } from "@/components/theme-toggle";
import { canEdit, isPasswordConfigured } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { buildHref } from "@/lib/href";
import { getLastSyncedAt, getPostByUrn, getPosts, parseFilters } from "@/lib/posts";
import { getResources, getSavedResourceUrls } from "@/lib/resources";

// Reads live data on every request instead of freezing it at build time.
export const dynamic = "force-dynamic";

function EmptyState({ title, body }: { title: string; body: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
      <p className="font-medium">{title}</p>
      <p className="max-w-measure text-sm text-muted">{body}</p>
    </div>
  );
}

export default async function Home({ searchParams }: PageProps<"/">) {
  const raw = await searchParams;
  const filters = parseFilters(raw);
  const view = filters.view ?? "all";
  const selectedUrn = typeof raw.post === "string" ? raw.post : undefined;

  // Only the params the UI owns — keeps generated links clean.
  const params = {
    q: filters.q,
    domain: view === "resources" ? undefined : filters.domain,
    intent: view === "resources" ? undefined : filters.intent,
    type: view === "resources" ? filters.type : undefined,
    starred: filters.starred ? "1" : undefined,
    view: view === "all" ? undefined : view,
  };

  const [posts, resources, lastSyncedAt, editable] = await Promise.all([
    view === "resources" ? Promise.resolve([]) : getPosts(filters),
    view === "resources" ? getResources(filters) : Promise.resolve([]),
    getLastSyncedAt(),
    canEdit(),
  ]);

  const selected = selectedUrn
    ? (posts.find((p) => p.linkedin_urn === selectedUrn) ?? (await getPostByUrn(selectedUrn)))
    : null;
  const savedResourceUrls = selected?.resources?.length
    ? [...(await getSavedResourceUrls(selected.resources.map((r) => r.url)))]
    : [];

  const hasFilters = Boolean(filters.q || params.domain || params.intent || params.type || params.starred);
  const clearHref = buildHref({ view: params.view }, {});
  const items = view === "resources" ? resources : posts;

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-reading flex-col gap-6 px-4 py-10 lg:max-w-5xl">
        <header className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-tight">Gleanings</h1>
              <p className="text-sm text-muted">
                {lastSyncedAt ? `Last saved ${timeAgo(lastSyncedAt)}` : "Nothing saved yet"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <a
                href={`/export?type=${view === "resources" ? "resources" : "posts"}`}
                aria-label="Export as Markdown"
                title="Export as Markdown"
                className="inline-flex size-9 items-center justify-center rounded-xl text-foreground hover:bg-default"
              >
                <DownloadIcon className="size-4" />
              </a>
              <EditLock unlocked={editable} configured={isPasswordConfigured()} />
              <ThemeToggle />
            </div>
          </div>

          <p className="flex items-center gap-2 rounded-xl bg-default px-3 py-2 text-sm text-muted sm:hidden">
            <MonitorIcon className="size-4 shrink-0" />
            Posts are saved from your desktop browser with the extension.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="sm:w-80">
              <Suspense>
                <SearchInput />
              </Suspense>
            </div>
            <ViewTabs params={params} view={view} />
          </div>
        </header>

        <FilterBar params={params} view={view} />

        {items.length === 0 ? (
          hasFilters ? (
            <EmptyState
              title="Nothing matches these filters"
              body={
                <Link href={clearHref} className="underline underline-offset-4">
                  Clear filters
                </Link>
              }
            />
          ) : view === "resources" ? (
            <EmptyState
              title="No resources yet"
              body="Open a post and use “Add” on the tools and links found in it to collect them here."
            />
          ) : view === "archived" ? (
            <EmptyState title="Nothing archived" body="Archived posts show up here and can be restored any time." />
          ) : (
            <EmptyState
              title="Your library is empty"
              body="Use the Gleanings box on LinkedIn to save a post — it'll appear here, summarized."
            />
          )
        ) : (
          <main className="grid gap-4 lg:grid-cols-2">
            {view === "resources"
              ? resources.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    canEdit={editable}
                    sourceHref={resource.source_urn ? buildHref({}, { post: resource.source_urn }) : null}
                  />
                ))
              : posts.map((post) => (
                  <PostCard
                    key={post.linkedin_urn}
                    post={post}
                    canEdit={editable}
                    detailHref={buildHref(params, { post: post.linkedin_urn })}
                  />
                ))}
          </main>
        )}
      </div>

      <PostDetailDrawer
        post={selected}
        closeHref={buildHref(params, {})}
        savedLabel={selected ? timeAgo(selected.synced_at) : null}
        savedResourceUrls={savedResourceUrls}
        canEdit={editable}
      />
    </div>
  );
}
