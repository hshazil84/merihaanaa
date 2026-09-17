import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import FilmCategoryPage from "../_components/FilmCategoryPage";
import { hasTag } from "@/lib/tags";

const ARTICLE_SELECT =
  "id, title, slug, excerpt, featured_image, cover_portrait_url, reading_time_minutes, published_at, tags, view_count, author:authors!author_id(full_name), category:categories!category_id(name, slug)";

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

  const { data: flaggedFeatured } = await supabase
    .from("articles")
    .select(ARTICLE_SELECT)
    .eq("status", "published")
    .eq("category_id", category.id)
    .eq("featured_on_film_category", true)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

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

  const nonReviewNews = (newsRaw ?? []).filter((a: any) => !hasTag(a.tags, "ރިވިއު"));
  const featured = flaggedFeatured ?? nonReviewNews[0] ?? null;
  const news = nonReviewNews.filter((a: any) => a.id !== featured?.id).slice(0, 3);
  const reviews = (reviewPool ?? []).filter((a: any) => hasTag(a.tags, "ރިވިއު")).slice(0, 8);

  return (
    <FilmCategoryPage
      featured={featured as any}
      articles={news as any[]}
      reviews={reviews as any[]}
      categorySlug={category.slug}
    />
  );
}
