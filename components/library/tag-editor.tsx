"use client";

import { XIcon } from "lucide-react";
import { useId, useState } from "react";
import { cleanTag, tagClass } from "@/lib/tags";
import { cn } from "@/lib/utils";

interface TagEditorProps {
  tags: string[];
  suggestions: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

/** Removable tag chips plus an input that assigns an existing tag or creates a new one. */
export function TagEditor({ tags, suggestions, onChange, placeholder = "Add a tag…" }: TagEditorProps) {
  const [draft, setDraft] = useState("");
  const listId = useId();
  const has = (tag: string) => tags.some((t) => t.toLowerCase() === tag.toLowerCase());

  function add() {
    const tag = cleanTag(draft);
    setDraft("");
    if (!tag || has(tag)) return;
    // Reuse an existing tag's casing so "ai" doesn't become a second "AI".
    onChange([...tags, suggestions.find((s) => s.toLowerCase() === tag.toLowerCase()) ?? tag]);
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((tag) => (
        <span key={tag} className={cn("inline-flex items-center gap-1 rounded-full py-0.5 pr-1 pl-2.5 text-xs font-medium", tagClass(tag))}>
          {tag}
          <button
            type="button"
            aria-label={`Remove ${tag}`}
            onClick={() => onChange(tags.filter((t) => t !== tag))}
            className="rounded-full p-0.5 opacity-60 hover:opacity-100"
          >
            <XIcon className="size-3" />
          </button>
        </span>
      ))}
      <input
        list={listId}
        value={draft}
        placeholder={placeholder}
        aria-label="Add a tag"
        maxLength={30}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
        className="min-w-28 flex-1 rounded-full border border-dashed border-border bg-transparent px-2.5 py-0.5 text-xs outline-none focus:border-accent"
      />
      <datalist id={listId}>
        {suggestions.filter((s) => !has(s)).map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </div>
  );
}
