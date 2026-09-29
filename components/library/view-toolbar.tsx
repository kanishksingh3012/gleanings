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
const CHEVRON = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`;

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
        // Own chevron with room to breathe — the native arrow hugs the right edge.
        style={{ backgroundImage: CHEVRON }}
        className="h-9 appearance-none rounded-xl border border-border bg-surface bg-[length:14px] bg-[position:right_10px_center] bg-no-repeat pr-8 pl-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
