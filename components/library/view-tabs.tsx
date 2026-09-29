import Link from "next/link";
import { buildHref } from "@/lib/href";
import type { LibraryView } from "@/lib/posts";
import { cn } from "@/lib/utils";

const VIEWS: { value: LibraryView; label: string }[] = [
  { value: "all", label: "Library" },
  { value: "resources", label: "Resources" },
  { value: "archived", label: "Archived" },
];

// Links rather than a stateful Tabs widget: the view lives in the URL, so each
// tab is bookmarkable and works without JS. Filters are reset on switch since
// tags and resource types don't carry over between views.
export function ViewTabs({ params, view }: { params: Record<string, string | undefined>; view: LibraryView }) {
  return (
    <div role="tablist" aria-label="View" className="inline-flex shrink-0 rounded-xl bg-default p-1">
      {VIEWS.map(({ value, label }) => (
        <Link
          key={value}
          role="tab"
          aria-selected={view === value}
          href={buildHref({ q: params.q }, { view: value === "all" ? undefined : value })}
          scroll={false}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm transition-colors",
            view === value ? "bg-surface font-medium text-foreground shadow-sm" : "text-muted hover:text-foreground",
          )}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
