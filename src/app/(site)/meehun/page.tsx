import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { MeehunCategoryPage } from "../_components/MeehunCategoryPage";

const RECENT_COUNT = 3;
const TEASER_GRID_COUNT = 8;

export async function generateMetadata() {
  const supabase = await createServerSupabaseClient();
  const { data: category } = await supabase
    .from("categories")
    .select("name, slug")
    .eq("slug", "meehun")
    .single();
  if (!category) return { title: "ކެޓަގަރީ ނުލިބުނު" };
  return {
    title: category.name,
    description: category.name + " - މެރިހާނާ",
  };
}

export default async function MeehunPage() {
  const supabase = await createServerSupabaseClient();

  const { data: category } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("slug", "meehun")
    .single();

  if (!category) notFound();

  // Featured is always the latest published article — no manual flag.
  const { data: featuredArticle } = await supabase
    .from("articles")
    .select(
      "id, title, slug, excerpt, featured_image, reading_time_minutes, published_at, view_count, tags, author:authors!author_id(full_name, avatar)"
    )
    .eq("status", "published")
    .eq("category_id", category.id)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const featuredId = featuredArticle?.id ?? null;

  let recentQuery = supabase
    .from("articles")
    .select("id, title, slug, featured_image, published_at, tags, author:authors!author_id(full_name)")
    .eq("status", "published")
    .eq("category_id", category.id)
    .order("published_at", { ascending: false })
    .limit(RECENT_COUNT);
  if (featuredId) recentQuery = recentQuery.neq("id", featuredId);
  const { data: recentRaw } = await recentQuery;

  const excludeIds = [featuredId, ...(recentRaw ?? []).map((a: any) => a.id)].filter(Boolean) as string[];

  let gridQuery = supabase
    .from("articles")
    .select("id, title, slug, excerpt, featured_image, published_at, tags")
    .eq("status", "published")
    .eq("category_id", category.id)
    .order("published_at", { ascending: false })
    .limit(TEASER_GRID_COUNT);
  if (excludeIds.length > 0) {
    gridQuery = gridQuery.not("id", "in", "(" + excludeIds.join(",") + ")");
  }
  const { data: gridRaw } = await gridQuery;

  return (
    <MeehunCategoryPage
      category={category}
      featuredArticle={featuredArticle ?? null}
      recentArticles={recentRaw ?? []}
      articles={gridRaw ?? []}
    />
  );
}
