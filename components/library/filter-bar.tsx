"use client";

import { DOMAIN_TAGS, INTENT_TAGS, type LibraryView, type PostFilters } from "@/lib/posts";
import { RESOURCE_TYPES } from "@/lib/resources";
import { tagClass } from "@/lib/tags";
import { cn } from "@/lib/utils";

interface PillProps {
  active: boolean;
  activeClass?: string;
  onClick: () => void;
  children: string;
}

function Pill({ active, activeClass, onClick, children }: PillProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1 text-sm transition-colors",
        active
          ? cn("border-transparent font-medium", activeClass ?? "bg-foreground text-background")
          : "border-border text-muted hover:bg-default hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span aria-hidden className="mx-1 w-px shrink-0 self-stretch bg-separator" />;
}

interface FilterBarProps {
  filters: PostFilters;
  view: LibraryView;
  onChange: (patch: Partial<PostFilters>) => void;
}

/** Sticky pill row. "All" clears tag/type filters; clicking an active pill clears it. */
export function FilterBar({ filters, view, onChange }: FilterBarProps) {
  const isResources = view === "resources";
  const noneSelected = isResources ? !filters.type : !filters.domain && !filters.intent;
  const toggle = <K extends "domain" | "intent" | "type">(key: K, value: string) =>
    onChange({ [key]: filters[key] === value ? undefined : value });

  return (
    <nav
      aria-label="Filters"
      className="sticky top-0 z-10 -mx-4 flex gap-2 overflow-x-auto bg-background/90 px-4 py-3 backdrop-blur"
    >
      <Pill active={noneSelected} onClick={() => onChange({ domain: undefined, intent: undefined, type: undefined })}>
        All
      </Pill>
      <Pill
        active={Boolean(filters.starred)}
        activeClass="bg-amber-400/20 text-amber-700 dark:text-amber-300"
        onClick={() => onChange({ starred: !filters.starred })}
      >
        ★ Starred
      </Pill>
      <Divider />
      {isResources ? (
        RESOURCE_TYPES.map((type) => (
          <Pill key={type} active={filters.type === type} onClick={() => toggle("type", type)}>
            {type}
          </Pill>
        ))
      ) : (
        <>
          {DOMAIN_TAGS.map((tag) => (
            <Pill key={tag} active={filters.domain === tag} activeClass={tagClass(tag)} onClick={() => toggle("domain", tag)}>
              {tag}
            </Pill>
          ))}
          <Divider />
          {INTENT_TAGS.map((tag) => (
            <Pill key={tag} active={filters.intent === tag} activeClass={tagClass(tag)} onClick={() => toggle("intent", tag)}>
              {tag}
            </Pill>
          ))}
        </>
      )}
    </nav>
  );
}
