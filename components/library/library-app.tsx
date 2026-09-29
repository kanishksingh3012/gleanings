"use client";

import { toast, useOverlayState } from "@heroui/react";
import { DownloadIcon, MonitorIcon, SettingsIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  addResource,
  archivePost,
  deletePost,
  deleteResource,
  setPostNote,
  setPostTags,
  setResourceNote,
  togglePostFavorite,
  toggleResourceFavorite,
  unarchivePost,
} from "@/app/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { filterPosts, filterResources } from "@/lib/filter";
import { timeAgo } from "@/lib/format";
import { buildHref } from "@/lib/href";
import {
  DOMAIN_TAGS,
  parseFilters,
  type LibraryView,
  type Post,
  type PostFilters,
} from "@/lib/posts";
import type { FoundResource, Resource } from "@/lib/resources";
import { useSettings, type Settings } from "@/lib/settings";
import { cn } from "@/lib/utils";
import { EditLockButton, useEdit } from "./edit-context";
import { FilterBar } from "./filter-bar";
import { PostCard, type PostHandlers } from "./post-card";
import { PostDetailDrawer } from "./post-detail-drawer";
import { ResourceCard, type ResourceHandlers } from "./resource-card";
import { SearchInput } from "./search-input";
import { SettingsModal } from "./settings-modal";
import { ViewTabs } from "./view-tabs";
import { ViewToolbar } from "./view-toolbar";

const AUTHOR_URL = "https://www.linkedin.com/in/kanishk-singh-728126211/";

function toParams(filters: PostFilters, selected: string | null) {
  return {
    q: filters.q || undefined,
    domain: filters.view === "resources" ? undefined : filters.domain,
    intent: filters.view === "resources" ? undefined : filters.intent,
    type: filters.view === "resources" ? filters.type : undefined,
    starred: filters.starred ? "1" : undefined,
    view: filters.view === "all" ? undefined : filters.view,
    post: selected ?? undefined,
  };
}

/** Applies the "start on" setting to a URL that didn't choose a view itself. */
function withStartView(
  filters: PostFilters,
  startView: Settings["startView"],
): PostFilters {
  if (startView === "resources") return { ...filters, view: "resources" };
  if (startView === "starred") return { ...filters, starred: true };
  return filters;
}

function EmptyState({ title, body }: { title: string; body: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
      <p className="font-medium">{title}</p>
      <p className="max-w-measure text-sm text-muted">{body}</p>
    </div>
  );
}

interface LibraryAppProps {
  initialPosts: Post[];
  initialResources: Resource[];
  /** The request's search params, passed from the server page. */
  initialParams: Record<string, string | string[] | undefined>;
  /** Sample data on /demo: edits apply locally and are never saved. */
  demo?: boolean;
}

/**
 * The whole library lives in the browser: filters, search, tabs, sorting and
 * opening a post never hit the server. Edits update the UI immediately and
 * are saved in the background (rolled back with a toast if the save fails).
 */
export function LibraryApp({
  initialPosts,
  initialResources,
  initialParams,
  demo = false,
}: LibraryAppProps) {
  const { requireEdit } = useEdit();
  const toHref = (href: string) => (demo ? `/demo${href.slice(1)}` : href);
  const { settings, update: updateSettings } = useSettings();

  const [posts, setPosts] = useState(initialPosts);
  const [resources, setResources] = useState(initialResources);
  const [rawFilters, setRawFilters] = useState<PostFilters>(() =>
    parseFilters(initialParams),
  );
  const [selected, setSelected] = useState<string | null>(
    typeof initialParams.post === "string" ? initialParams.post : null,
  );
  // Until the user picks a view, the "start on" setting decides it.
  const [viewChosen, setViewChosen] = useState(
    Boolean(initialParams.view || initialParams.starred),
  );
  const filters = viewChosen
    ? rawFilters
    : withStartView(rawFilters, settings.startView);

  function setFilters(
    next: PostFilters | ((current: PostFilters) => PostFilters),
  ) {
    setRawFilters(typeof next === "function" ? next(filters) : next);
    setViewChosen(true);
  }

  // Mirror state into the URL without a server round trip, so views stay linkable.
  useEffect(() => {
    const href = toHref(buildHref({}, toParams(filters, selected)));
    if (href !== `${window.location.pathname}${window.location.search}`)
      window.history.replaceState(null, "", href);
  }, [filters, selected]);

  const view: LibraryView = filters.view ?? "all";
  const visiblePosts = useMemo(
    () => filterPosts(posts, filters, settings.sort),
    [posts, filters, settings.sort],
  );
  const visibleResources = useMemo(
    () => filterResources(resources, filters, settings.sort),
    [resources, filters, settings.sort],
  );
  const savedUrls = useMemo(
    () => new Set(resources.map((r) => r.url)),
    [resources],
  );
  const selectedPost = selected
    ? (posts.find((p) => p.linkedin_urn === selected) ?? null)
    : null;
  const lastSaved = posts.reduce<string | null>(
    (max, p) => (!max || p.synced_at > max ? p.synced_at : max),
    null,
  );
  const compact = settings.density === "compact";
  const settingsModal = useOverlayState();
  // Built-in domains, tags created in Settings, and any custom tag already on a post.
  const tagOptions = useMemo(
    () => [
      ...new Set<string>([
        ...DOMAIN_TAGS,
        ...settings.customTags,
        ...posts.flatMap((p) => p.domain_tags),
      ]),
    ],
    [posts, settings.customTags],
  );
  const customTags = tagOptions.filter(
    (tag) => !(DOMAIN_TAGS as readonly string[]).includes(tag),
  );

  const changeFilters = (patch: Partial<PostFilters>) =>
    setFilters((f) => ({ ...f, ...patch }));

  /** Optimistic update + background save; restores the previous list on failure. */
  function persist(
    apply: () => () => void,
    save: () => Promise<unknown>,
    success?: string,
  ) {
    const rollback = apply();
    if (demo) {
      if (success) toast.success(success);
      return;
    }
    save().then(
      () => success && toast.success(success),
      (err) => {
        rollback();
        toast.danger(
          err instanceof Error ? err.message : "Couldn't save that change",
        );
      },
    );
  }

  function editPost(
    urn: string,
    patch: Partial<Post>,
    save: () => Promise<unknown>,
    success?: string,
  ) {
    requireEdit(() =>
      persist(
        () => {
          const prev = posts;
          setPosts((list) =>
            list.map((p) => (p.linkedin_urn === urn ? { ...p, ...patch } : p)),
          );
          return () => setPosts(prev);
        },
        save,
        success,
      ),
    );
  }

  function editResource(
    id: string,
    patch: Partial<Resource>,
    save: () => Promise<unknown>,
    success?: string,
  ) {
    requireEdit(() =>
      persist(
        () => {
          const prev = resources;
          setResources((list) =>
            list.map((r) => (r.id === id ? { ...r, ...patch } : r)),
          );
          return () => setResources(prev);
        },
        save,
        success,
      ),
    );
  }

  const postHandlers: PostHandlers = {
    onOpen: setSelected,
    onToggleStar: (p) =>
      editPost(p.linkedin_urn, { is_favorite: !p.is_favorite }, () =>
        togglePostFavorite(p.linkedin_urn, !p.is_favorite),
      ),
    onToggleArchive: (p) =>
      p.status === "archived"
        ? editPost(
            p.linkedin_urn,
            { status: "published" },
            () => unarchivePost(p.linkedin_urn),
            "Moved back to library",
          )
        : editPost(
            p.linkedin_urn,
            { status: "archived" },
            () => archivePost(p.linkedin_urn),
            "Archived",
          ),
    onNote: (p, note) =>
      editPost(
        p.linkedin_urn,
        { note: note.trim() || null },
        () => setPostNote(p.linkedin_urn, note),
        "Note saved",
      ),
    onDelete: (p) =>
      persist(
        () => {
          const prev = posts;
          setPosts((list) =>
            list.filter((x) => x.linkedin_urn !== p.linkedin_urn),
          );
          if (selected === p.linkedin_urn) setSelected(null);
          return () => setPosts(prev);
        },
        () => deletePost(p.linkedin_urn),
        "Post deleted",
      ),
  };

  const resourceHandlers: ResourceHandlers = {
    onToggleStar: (r) =>
      editResource(r.id, { is_favorite: !r.is_favorite }, () =>
        toggleResourceFavorite(r.id, !r.is_favorite),
      ),
    onNote: (r, note) =>
      editResource(
        r.id,
        { note: note.trim() || null },
        () => setResourceNote(r.id, note),
        "Note saved",
      ),
    onDelete: (r) =>
      persist(
        () => {
          const prev = resources;
          setResources((list) => list.filter((x) => x.id !== r.id));
          return () => setResources(prev);
        },
        () => deleteResource(r.id),
        "Resource removed",
      ),
    onOpenSource: setSelected,
  };

  function addToResources(post: Post, found: FoundResource) {
    requireEdit(() => {
      const temp: Resource = {
        ...found,
        id: `temp-${found.url}`,
        source_urn: post.linkedin_urn,
        note: null,
        is_favorite: false,
        created_at: new Date().toISOString(),
      };
      persist(
        () => {
          setResources((list) => [temp, ...list]);
          return () =>
            setResources((list) => list.filter((r) => r.id !== temp.id));
        },
        async () => {
          const saved = await addResource(post.linkedin_urn, found);
          if (saved)
            setResources((list) =>
              list.map((r) => (r.id === temp.id ? saved : r)),
            );
        },
        "Added to Resources",
      );
    });
  }

  const hasFilters = Boolean(
    filters.q ||
    filters.domain ||
    filters.intent ||
    filters.type ||
    filters.starred,
  );
  const items = view === "resources" ? visibleResources : visiblePosts;
  const three = settings.columns === 3;

  return (
    <div className="min-h-screen">
      <div
        className={cn(
          "mx-auto flex max-w-reading flex-col gap-6 px-4 py-10",
          three ? "lg:max-w-7xl" : "lg:max-w-5xl",
        )}
      >
        <header className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">
                  Gleanings
                </h1>
                <a
                  href={AUTHOR_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted hover:text-foreground hover:underline"
                >
                  by @kanishk
                </a>
              </div>
              <p className="text-sm text-muted">
                {demo
                  ? "Demo with sample posts. Changes reset when you reload."
                  : lastSaved
                    ? `Last saved ${timeAgo(lastSaved)}`
                    : "Nothing saved yet"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {!demo && (
                <a
                  href={`/export?type=${view === "resources" ? "resources" : "posts"}`}
                  aria-label="Export as Markdown"
                  title="Export as Markdown"
                  className="inline-flex size-9 items-center justify-center rounded-xl hover:bg-default"
                >
                  <DownloadIcon className="size-4" />
                </a>
              )}
              <button
                type="button"
                onClick={settingsModal.open}
                aria-label="Settings"
                title="Settings"
                className="inline-flex size-9 items-center justify-center rounded-xl hover:bg-default"
              >
                <SettingsIcon className="size-4" />
              </button>
              {!demo && <EditLockButton />}
              <ThemeToggle />
            </div>
          </div>

          <p className="flex items-center gap-2 rounded-xl bg-default px-3 py-2 text-sm text-muted sm:hidden">
            <MonitorIcon className="size-4 shrink-0" />
            Posts are saved from your desktop browser with the extension.
          </p>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="flex-1 lg:max-w-80">
                <SearchInput
                  value={filters.q ?? ""}
                  onChange={(q) => changeFilters({ q })}
                />
              </div>
              <ViewToolbar settings={settings} onChange={updateSettings} />
            </div>
            <ViewTabs
              view={view}
              onChange={(v) => setFilters((f) => ({ q: f.q, view: v }))}
            />
          </div>
        </header>

        <FilterBar
          filters={filters}
          view={view}
          customTags={customTags}
          onChange={changeFilters}
        />

        {items.length === 0 ? (
          hasFilters ? (
            <EmptyState
              title="Nothing matches these filters"
              body={
                <button
                  type="button"
                  onClick={() => setFilters({ view })}
                  className="underline underline-offset-4"
                >
                  Clear filters
                </button>
              }
            />
          ) : view === "resources" ? (
            <EmptyState
              title="No resources yet"
              body="Open a post and tap + on the tools and links found in it to collect them here."
            />
          ) : view === "archived" ? (
            <EmptyState
              title="Nothing archived"
              body="Archived posts show up here and can be restored any time."
            />
          ) : (
            <EmptyState
              title="Your library is empty"
              body="Use the Gleanings box on LinkedIn to save a post — it'll appear here, summarized."
            />
          )
        ) : (
          <main
            className={cn(
              "grid gap-4",
              three ? "md:grid-cols-2 xl:grid-cols-3" : "lg:grid-cols-2",
            )}
          >
            {view === "resources"
              ? visibleResources.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    compact={compact}
                    {...resourceHandlers}
                  />
                ))
              : visiblePosts.map((post) => (
                  <PostCard
                    key={post.linkedin_urn}
                    post={post}
                    compact={compact}
                    detailHref={toHref(
                      buildHref({}, toParams(filters, post.linkedin_urn)),
                    )}
                    {...postHandlers}
                  />
                ))}
          </main>
        )}
      </div>

      <PostDetailDrawer
        post={selectedPost}
        savedResourceUrls={savedUrls}
        onClose={() => setSelected(null)}
        onNote={postHandlers.onNote}
        onAddResource={addToResources}
        onTags={(p, tags) =>
          editPost(p.linkedin_urn, { domain_tags: tags }, () =>
            setPostTags(p.linkedin_urn, tags),
          )
        }
        tagOptions={tagOptions}
      />
      <SettingsModal state={settingsModal} />
    </div>
  );
}
