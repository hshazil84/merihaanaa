import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import FilmCategoryPage from "../_components/FilmCategoryPage";

const ARTICLE_SELECT =
  "id, title, slug, excerpt, featured_image, cover_portrait_url, reading_time_minutes, published_at, tags, view_count, author:authors!author_id(full_name), category:categories!category_id(name, slug)";

function hasTag(tags: any[] | null, name: string): boolean {
  if (!tags || !Array.isArray(tags)) return false;
  return tags.some(function (raw) {
    const val = typeof raw === "string" ? raw : raw && typeof raw === "object" ? raw.name : null;
    return typeof val === "string" && val.toLowerCase() === name.toLowerCase();
  });
}

export async function generateMetadata() {
  const supabase = await createServerSupabaseClient();
  const { data: category } = await supabase
    .from("categories")
    .select("name, slug")
    .eq("slug", "film")
    .single();
  if (!category) return { title: "ކެޓަގަރީ ނުލިބުނު" };
  return {
    title: category.name,
    description: category.name + " - މެރިހާނާ",
  };
}

export default async function FilmPage() {
  const supabase = await createServerSupabaseClient();

  const { data: category } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("slug", "film")
    .single();

  if (!category) notFound();

  // Two separate reads: the news band needs the latest non-review articles,
  // the review strip needs the latest tagged reviews. Tags live in JSONB so
  // the review filter happens in JS over a wider window.
  const [{ data: newsRaw }, { data: reviewPool }] = await Promise.all([
    supabase
      .from("articles")
      .select(ARTICLE_SELECT)
      .eq("status", "published")
      .eq("category_id", category.id)
      .order("published_at", { ascending: false })
      .limit(24),
    supabase
      .from("articles")
      .select(ARTICLE_SELECT)
      .eq("status", "published")
      .eq("category_id", category.id)
      .order("published_at", { ascending: false })
      .limit(200),
  ]);

  const news = (newsRaw ?? []).filter((a: any) => !hasTag(a.tags, "ރިވިއު")).slice(0, 4);
  const reviews = (reviewPool ?? []).filter((a: any) => hasTag(a.tags, "ރިވިއު")).slice(0, 8);

  return (
    <FilmCategoryPage
      articles={news as any[]}
      reviews={reviews as any[]}
      categorySlug={category.slug}
    />
  );
}
