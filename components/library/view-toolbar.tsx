"use client";

import { Columns2Icon, Columns3Icon } from "lucide-react";
import { SORT_LABELS, type SortOrder } from "@/lib/filter";
import type { Settings } from "@/lib/settings";
import { cn } from "@/lib/utils";

interface ViewToolbarProps {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
}

/** Sort + grid density; changes are remembered as this device's defaults. */
export function ViewToolbar({ settings, onChange }: ViewToolbarProps) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <label className="sr-only" htmlFor="sort">
        Sort
      </label>
      <select
        id="sort"
        value={settings.sort}
        onChange={(e) => onChange({ sort: e.target.value as SortOrder })}
        className="h-9 rounded-xl border border-border bg-surface px-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {(Object.keys(SORT_LABELS) as SortOrder[]).map((sort) => (
          <option key={sort} value={sort}>
            {SORT_LABELS[sort]}
          </option>
        ))}
      </select>
      <div role="group" aria-label="Columns" className="hidden rounded-xl bg-default p-1 lg:inline-flex">
        {([2, 3] as const).map((cols) => (
          <button
            key={cols}
            type="button"
            aria-pressed={settings.columns === cols}
            aria-label={`${cols} columns`}
            onClick={() => onChange({ columns: cols })}
            className={cn(
              "rounded-lg p-1.5 transition-colors",
              settings.columns === cols ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground",
            )}
          >
            {cols === 2 ? <Columns2Icon className="size-4" /> : <Columns3Icon className="size-4" />}
          </button>
        ))}
      </div>
    </div>
  );
}
