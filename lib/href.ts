/**
 * Builds a "/?..." href from the current params plus updates. `undefined`
 * removes a key, so filters can be toggled off.
 */
export function buildHref(
  current: Record<string, string | undefined>,
  updates: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...current, ...updates })) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `/?${query}` : "/";
}
