/**
 * Substring match, not exact equality — a tag like "ފިލްމު ރިވިއު" (film
 * review) should still count as a review even though it isn't the bare
 * "ރިވިއު" string. Tags are stored as JSONB (either raw strings or
 * {name: string} objects), so both shapes are handled here.
 */
export function hasTag(tags: any[] | null, name: string): boolean {
  if (!tags || !Array.isArray(tags)) return false;
  const needle = name.toLowerCase();
  return tags.some(function (raw) {
    const val = typeof raw === "string" ? raw : raw && typeof raw === "object" ? raw.name : null;
    return typeof val === "string" && val.toLowerCase().includes(needle);
  });
}

/** First tag in the list, normalized to a plain string, or null if empty. */
export function getFirstTag(tags: any[] | null): string | null {
  if (!tags || !Array.isArray(tags) || tags.length === 0) return null;
  const raw = tags[0];
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && raw !== null) return raw.name ?? null;
  return null;
}
