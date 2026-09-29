"use client";

import type { LibraryView } from "@/lib/posts";
import { cn } from "@/lib/utils";

const VIEWS: { value: LibraryView; label: string }[] = [
  { value: "all", label: "Library" },
  { value: "resources", label: "Resources" },
  { value: "archived", label: "Archived" },
];

export function ViewTabs({ view, onChange }: { view: LibraryView; onChange: (view: LibraryView) => void }) {
  return (
    <div role="tablist" aria-label="View" className="inline-flex shrink-0 rounded-xl bg-default p-1">
      {VIEWS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          role="tab"
          aria-selected={view === value}
          onClick={() => onChange(value)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm transition-colors",
            view === value ? "bg-surface font-medium text-foreground shadow-sm" : "text-muted hover:text-foreground",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
