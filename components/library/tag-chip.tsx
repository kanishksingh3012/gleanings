import { tagClass } from "@/lib/tags";
import { cn } from "@/lib/utils";

export function TagChip({ tag }: { tag: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", tagClass(tag))}>
      {tag}
    </span>
  );
}

export function TagList({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <TagChip key={tag} tag={tag} />
      ))}
    </div>
  );
}
