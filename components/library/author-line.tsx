import { Avatar } from "@heroui/react";
import { initials } from "@/lib/format";

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
    <div className="flex min-w-0 items-center gap-2.5 text-sm">
      <Avatar size={size} className={size === "sm" ? "size-8" : "size-10"}>
        {avatarUrl && <Avatar.Image src={avatarUrl} alt="" />}
        <Avatar.Fallback className="text-xs">{initials(name)}</Avatar.Fallback>
      </Avatar>
      <div className="flex min-w-0 flex-col leading-tight">
        {url ? (
          <a href={url} target="_blank" rel="noopener noreferrer" className="truncate font-medium hover:underline">
            {name}
          </a>
        ) : (
          <span className="truncate font-medium">{name}</span>
        )}
        {meta && <span className="text-xs text-muted">{meta}</span>}
      </div>
    </div>
  );
}
