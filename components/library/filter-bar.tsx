import Link from "next/link";
import { buildHref } from "@/lib/href";
import { DOMAIN_TAGS, INTENT_TAGS, type LibraryView } from "@/lib/posts";
import { RESOURCE_TYPES } from "@/lib/resources";
import { tagClass } from "@/lib/tags";
import { cn } from "@/lib/utils";

type Params = Record<string, string | undefined>;

function Pill({ href, active, activeClass, children }: { href: string; active: boolean; activeClass?: string; children: string }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1 text-sm transition-colors",
        active
          ? cn("border-transparent font-medium", activeClass ?? "bg-accent text-accent-foreground")
          : "border-border text-muted hover:bg-default hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

function Divider() {
  return <span aria-hidden className="mx-1 w-px shrink-0 self-stretch bg-separator" />;
}

/** Sticky pill row; clicking an active pill clears that filter. */
export function FilterBar({ params, view }: { params: Params; view: LibraryView }) {
  const toggle = (key: string, value: string) =>
    buildHref(params, { [key]: params[key] === value ? undefined : value, post: undefined });

  return (
    <nav
      aria-label="Filters"
      className="sticky top-0 z-10 -mx-4 flex gap-2 overflow-x-auto bg-background/90 px-4 py-3 backdrop-blur"
    >
      <Pill
        href={toggle("starred", "1")}
        active={params.starred === "1"}
        activeClass="bg-amber-400/20 text-amber-700 dark:text-amber-300"
      >
        ★ Starred
      </Pill>
      <Divider />
      {view === "resources" ? (
        RESOURCE_TYPES.map((type) => (
          <Pill key={type} href={toggle("type", type)} active={params.type === type}>
            {type}
          </Pill>
        ))
      ) : (
        <>
          {DOMAIN_TAGS.map((tag) => (
            <Pill key={tag} href={toggle("domain", tag)} active={params.domain === tag} activeClass={tagClass(tag)}>
              {tag}
            </Pill>
          ))}
          <Divider />
          {INTENT_TAGS.map((tag) => (
            <Pill key={tag} href={toggle("intent", tag)} active={params.intent === tag} activeClass={tagClass(tag)}>
              {tag}
            </Pill>
          ))}
        </>
      )}
    </nav>
  );
}
