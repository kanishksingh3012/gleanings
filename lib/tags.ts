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

// Custom tags get a stable hue picked from the tag's name.
const CUSTOM_STYLES = [
  "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  "bg-lime-500/15 text-lime-700 dark:text-lime-300",
  "bg-teal-500/15 text-teal-700 dark:text-teal-300",
  "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300",
  "bg-purple-500/15 text-purple-700 dark:text-purple-300",
];

export function tagClass(tag: string): string {
  if (TAG_STYLES[tag]) return TAG_STYLES[tag];
  let hash = 0;
  for (const char of tag.toLowerCase()) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return CUSTOM_STYLES[hash % CUSTOM_STYLES.length];
}

/** Trims, collapses whitespace and caps length; "" means not a usable tag. */
export function cleanTag(tag: string): string {
  return tag.trim().replace(/\s+/g, " ").slice(0, 30);
}
