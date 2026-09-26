import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

interface AuthorLineProps {
  name: string;
  url: string | null;
  avatarUrl: string | null;
  meta?: string;
  size?: "sm" | "md";
}

/** Avatar falls back to initials, which also covers broken/expired image URLs. */
export function AuthorLine({ name, url, avatarUrl, meta, size = "sm" }: AuthorLineProps) {
  return (
    <div className="flex min-w-0 items-center gap-2 text-sm">
      <Avatar className={cn(size === "sm" ? "size-6" : "size-9")}>
        {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
        <AvatarFallback className="text-[10px]">{initials(name)}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 items-baseline gap-1.5">
        {url ? (
          <a href={url} target="_blank" rel="noopener noreferrer" className="truncate font-medium hover:underline">
            {name}
          </a>
        ) : (
          <span className="truncate font-medium">{name}</span>
        )}
        {meta && <span className="shrink-0 text-muted-foreground">· {meta}</span>}
      </div>
    </div>
  );
}
