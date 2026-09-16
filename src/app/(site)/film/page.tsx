import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import FilmCategoryPage from "@/components/category-pages/FilmCategoryPage";

const DEFAULT_PAGE_SIZE = 12;

interface PageProps {
  searchParams: { page?: string };
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

export default async function FilmPage({ searchParams }: PageProps) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));
  const supabase = await createServerSupabaseClient();

  const { data: category } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("slug", "film")
    .single();

  if (!category) notFound();

  const from = (page - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;

  const [
    { data: articles, count },
    { data: topReadRaw },
    { data: featuredOriginal },
  ] = await Promise.all([
    supabase
      .from("articles")
      .select(
        "id, title, slug, excerpt, featured_image, cover_portrait_url, reading_time_minutes, published_at, tags, view_count, author:authors!author_id(full_name), category:categories!category_id(name, slug)",
        { count: "exact" }
      )
      .eq("status", "published")
      .eq("category_id", category.id)
      .order("published_at", { ascending: false })
      .range(from, to),
    supabase
      .from("articles")
      .select("id, title, slug, view_count")
      .eq("status", "published")
      .eq("category_id", category.id)
      .order("view_count", { ascending: false })
      .limit(5),
    supabase
      .from("originals")
      .select("id, title, slug, description, thumbnail_url, cloudflare_stream_id, duration_seconds, type")
      .eq("featured_on_film", true)
      .eq("status", "published")
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <FilmCategoryPage
      articles={(articles ?? []) as any[]}
      topRead={(topReadRaw ?? []) as any[]}
      featuredOriginal={featuredOriginal as any}
      categorySlug={category.slug}
      totalCount={count ?? 0}
      page={page}
    />
  );
}
