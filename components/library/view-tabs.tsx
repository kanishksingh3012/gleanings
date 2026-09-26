import Link from "next/link";
import { buildHref } from "@/lib/href";
import type { LibraryView } from "@/lib/posts";
import { cn } from "@/lib/utils";

const VIEWS: { value: LibraryView; label: string }[] = [
  { value: "all", label: "Library" },
  { value: "archived", label: "Archived" },
];

export function ViewTabs({ params, view }: { params: Record<string, string | undefined>; view: LibraryView }) {
  return (
    <div role="tablist" aria-label="Library view" className="inline-flex rounded-lg bg-muted p-1">
      {VIEWS.map(({ value, label }) => (
        <Link
          key={value}
          role="tab"
          aria-selected={view === value}
          href={buildHref(params, { view: value === "all" ? undefined : value, post: undefined })}
          scroll={false}
          className={cn(
            "rounded-md px-3 py-1 text-sm transition-colors",
            view === value ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
