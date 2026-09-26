import Link from "next/link";
import { buildHref } from "@/lib/href";
import { DOMAIN_TAGS, INTENT_TAGS } from "@/lib/posts";
import { cn } from "@/lib/utils";

type Params = Record<string, string | undefined>;

function Pill({ href, active, children }: { href: string; active: boolean; children: string }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1 text-sm transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

/** Sticky row of tag pills; clicking an active pill clears that filter. */
export function FilterBar({ params }: { params: Params }) {
  const toggle = (key: "domain" | "intent", tag: string) =>
    buildHref(params, { [key]: params[key] === tag ? undefined : tag, post: undefined });

  return (
    <nav
      aria-label="Filter by tag"
      className="sticky top-0 z-10 -mx-4 flex gap-2 overflow-x-auto bg-background/90 px-4 py-3 backdrop-blur"
    >
      {DOMAIN_TAGS.map((tag) => (
        <Pill key={tag} href={toggle("domain", tag)} active={params.domain === tag}>
          {tag}
        </Pill>
      ))}
      <span aria-hidden className="mx-1 w-px shrink-0 self-stretch bg-border" />
      {INTENT_TAGS.map((tag) => (
        <Pill key={tag} href={toggle("intent", tag)} active={params.intent === tag}>
          {tag}
        </Pill>
      ))}
    </nav>
  );
}
