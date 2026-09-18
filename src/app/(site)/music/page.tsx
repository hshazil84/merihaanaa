import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import MusicCategoryPage from "../_components/MusicCategoryPage";

const ARTICLE_SELECT =
  "id, title, slug, excerpt, featured_image, reading_time_minutes, published_at, tags, view_count, author:authors!author_id(full_name), category:categories!category_id(name, slug)";

export async function generateMetadata() {
  const supabase = await createServerSupabaseClient();
  const { data: category } = await supabase
    .from("categories")
    .select("name, slug")
    .eq("slug", "music")
    .single();
  if (!category) return { title: "ކެޓަގަރީ ނުލިބުނު" };
  return {
    title: category.name,
    description: category.name + " - މެރިހާނާ",
  };
}

export default async function MusicPage() {
  const supabase = await createServerSupabaseClient();

  const { data: category } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("slug", "music")
    .single();

  if (!category) notFound();

  const { data: articlesRaw } = await supabase
    .from("articles")
    .select(ARTICLE_SELECT)
    .eq("status", "published")
    .eq("category_id", category.id)
    .order("published_at", { ascending: false })
    .limit(4);

  const articles = articlesRaw ?? [];

  return (
    <MusicCategoryPage
      featured={articles[0] ?? null}
      articles={articles.slice(1, 4)}
      categorySlug={category.slug}
    />
  );
}
