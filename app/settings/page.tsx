"use client";

import { ArrowLeftIcon } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { SORT_LABELS, type SortOrder } from "@/lib/filter";
import { useSettings, type Settings } from "@/lib/settings";
import { cn } from "@/lib/utils";

interface Option<T> {
  value: T;
  label: string;
}

function Segmented<T extends string | number>({
  label,
  description,
  value,
  options,
  onChange,
}: {
  label: string;
  description: string;
  value: T | undefined;
  options: Option<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-separator py-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted">{description}</span>
      </div>
      <div role="radiogroup" aria-label={label} className="inline-flex shrink-0 flex-wrap rounded-xl bg-default p-1">
        {options.map((option) => (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm transition-colors",
              value === option.value ? "bg-surface font-medium text-foreground shadow-sm" : "text-muted hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { settings, update } = useSettings();
  const { theme, setTheme } = useTheme();
  const set = <K extends keyof Settings>(key: K) => (value: Settings[K]) => update({ [key]: value } as Partial<Settings>);

  return (
    <div className="mx-auto flex w-full max-w-reading flex-col gap-2 px-4 py-10">
      <Link href="/" className="mb-4 flex items-center gap-1.5 self-start text-sm text-muted hover:text-foreground">
        <ArrowLeftIcon className="size-4" /> Back to library
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <p className="text-sm text-muted">Saved on this device.</p>

      <div className="mt-4 flex flex-col">
        <Segmented
          label="Theme"
          description="Match your system, or pick one."
          value={theme}
          onChange={setTheme}
          options={[
            { value: "system", label: "System" },
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
          ]}
        />
        <Segmented
          label="Columns"
          description="Cards per row on wide screens."
          value={settings.columns}
          onChange={set("columns")}
          options={[
            { value: 2, label: "2" },
            { value: 3, label: "3" },
          ]}
        />
        <Segmented
          label="Default sort"
          description="How posts and resources are ordered."
          value={settings.sort}
          onChange={set("sort")}
          options={(Object.keys(SORT_LABELS) as SortOrder[]).map((value) => ({ value, label: SORT_LABELS[value] }))}
        />
        <Segmented
          label="Card density"
          description="Compact shows one line of each summary."
          value={settings.density}
          onChange={set("density")}
          options={[
            { value: "comfortable", label: "Comfortable" },
            { value: "compact", label: "Compact" },
          ]}
        />
        <Segmented
          label="Start on"
          description="What opens first when you visit."
          value={settings.startView}
          onChange={set("startView")}
          options={[
            { value: "library", label: "Library" },
            { value: "resources", label: "Resources" },
            { value: "starred", label: "Starred" },
          ]}
        />
      </div>
    </div>
  );
}
