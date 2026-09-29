// One distinct hue per tag (HeroUI only ships 5 semantic colors). Full class
// strings so Tailwind's scanner picks them up; soft tint + readable text in
// both themes.
const TAG_STYLES: Record<string, string> = {
  AI: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  Design: "bg-pink-500/15 text-pink-700 dark:text-pink-300",
  Data: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
  Coding: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  Development: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  Resources: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "Cool Build": "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  Learning: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  Inspiration: "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300",
};

const FALLBACK = "bg-default text-default-foreground";

export function tagClass(tag: string): string {
  return TAG_STYLES[tag] ?? FALLBACK;
}
