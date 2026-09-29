import type { FoundResource } from "./resources";

const SHORTENER_HOSTS = new Set(["lnkd.in", "www.lnkd.in"]);
const RESOLVE_TIMEOUT_MS = 3000;
const HREF_IN_HTML = /href="(https?:\/\/[^"]+)"/i;

/**
 * LinkedIn wraps outbound links as lnkd.in short URLs. Follow one hop to the
 * real destination: either a redirect `Location`, or (for LinkedIn's "you are
 * leaving" interstitial) the first external href in the page. Falls back to
 * the short URL on any failure — never blocks a save.
 */
export async function resolveShortLink(url: string): Promise<string> {
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    return url;
  }
  if (!SHORTENER_HOSTS.has(host)) return url;

  try {
    const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(RESOLVE_TIMEOUT_MS) });
    const location = res.headers.get("location");
    if (location && !SHORTENER_HOSTS.has(new URL(location, url).hostname)) {
      return new URL(location, url).toString();
    }
    const html = await res.text();
    const match = html.match(HREF_IN_HTML);
    if (match && !/linkedin\.com|lnkd\.in/i.test(match[1])) return match[1];
  } catch {
    // Timeout or network error — keep the short link.
  }
  return url;
}

export async function resolveResourceLinks(resources: FoundResource[]): Promise<FoundResource[]> {
  const resolved = await Promise.all(
    resources.map(async (r) => ({ ...r, url: await resolveShortLink(r.url) })),
  );
  // Two short links can point to the same page.
  const seen = new Set<string>();
  return resolved.filter((r) => !seen.has(r.url) && seen.add(r.url));
}
