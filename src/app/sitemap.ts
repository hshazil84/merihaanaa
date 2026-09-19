import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

// A plain, non-request-scoped Supabase client. sitemap.ts can run without a
// request context (e.g. at build time or on a background revalidation), so
// it must not depend on next/headers-based cookies() the way the app's
// normal server client does. Only public/published rows are ever queried
// here, so the anon key is sufficient.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://merihaanaa.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE_URL}/originals`, changeFrequency: "hourly", priority: 0.8 },
  ];

  // Category section pages, pulled from the categories table itself rather
  // than a hardcoded list — a category added later is picked up automatically.
  const { data: categories } = await supabase
    .from("categories")
    .select("slug")
    .eq("is_visible", true);

  for (const c of categories ?? []) {
    entries.push({ url: `${SITE_URL}/${c.slug}`, changeFrequency: "hourly", priority: 0.8 });
    // Assumes every category has an /archive route, matching the pattern
    // seen on the film and meehun pages — remove if that's not universal.
    entries.push({ url: `${SITE_URL}/${c.slug}/archive`, changeFrequency: "daily", priority: 0.5 });
  }

  // Individual articles.
  const { data: articles } = await supabase
    .from("articles")
    .select("slug, published_at, category:categories!category_id(slug)")
    .eq("status", "published");

  for (const a of articles ?? []) {
    const categorySlug = Array.isArray(a.category) ? a.category[0]?.slug : (a.category as any)?.slug;
    if (!categorySlug) continue;
    entries.push({
      url: `${SITE_URL}/${categorySlug}/${a.slug}`,
      lastModified: a.published_at ?? undefined,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  // Originals.
  const { data: originals } = await supabase
    .from("originals")
    .select("slug, published_at")
    .eq("status", "published");

  for (const o of originals ?? []) {
    entries.push({
      url: `${SITE_URL}/originals/${o.slug}`,
      lastModified: o.published_at ?? undefined,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  return entries;
}
