import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { DefaultCategoryPage } from "./components/DefaultCategoryPage";
import { ReviewsCategoryPage } from "./components/ReviewsCategoryPage";
import { StoriesCategoryPage } from "./components/StoriesCategoryPage";
import { MeehunCategoryPage } from "./components/MeehunCategoryPage";

interface PageProps {
  params: { category: string };
  searchParams: { page?: string };
}

const PAGE_SIZE = 8;
const DEFAULT_PAGE_SIZE = 12;

export async function generateMetadata({ params }: PageProps) {
  const supabase = await createServerSupabaseClient();
  const { data: category } = await supabase
    .from("categories")
    .select("name, slug")
    .eq("slug", params.category)
    .single();
  if (!category) return { title: "ކެޓަގަރީ ނުލިބުނު" };
  return {
    title: category.name,
    description: `${category.name} - މެރިހާނާ`,
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));
  const supabase = await createServerSupabaseClient();

  const { data: category } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("slug", params.category)
    .single();

  if (!category) notFound();

  // MEEHUN
  if (category.slug === "meehun") {
    const { data: featuredArticle } = await supabase
      .from("articles")
      .select("id, title, slug, featured_image, published_at, tags, author:authors!author_id(full_name)")
      .eq("status", "published")
      .eq("category_id", category.id)
      .eq("homepage_featured", true)
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const featuredId = featuredArticle?.id ?? null;

    let mostReadQuery = supabase
      .from("articles")
      .select("id, title, slug, view_count, author:authors!author_id(full_name)")
      .eq("status", "published")
      .eq("category_id", category.id)
      .order("view_count", { ascending: false })
      .limit(5);
    if (featuredId) mostReadQuery = mostReadQuery.neq("id", featuredId);
    const { data: mostReadRaw } = await mostReadQuery;

    let recentQuery = supabase
      .from("articles")
      .select("id, title, slug, featured_image, published_at, tags, author:authors!author_id(full_name)")
      .eq("status", "published")
      .eq("category_id", category.id)
      .order("published_at", { ascending: false })
      .limit(5);
    if (featuredId) recentQuery = recentQuery.neq("id", featuredId);
    const { data: recentRaw } = await recentQuery;

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    let gridQuery = supabase
      .from("articles")
      .select("id, title, slug, excerpt, featured_image, reading_time_minutes, published_at, tags, author:authors!author_id(full_name)", { count: "exact" })
      .eq("status", "published")
      .eq("category_id", category.id)
      .order("published_at", { ascending: false })
      .range(from, to);
    if (featuredId) gridQuery = gridQuery.neq("id", featuredId);
    const { data: gridRaw, count } = await gridQuery;

    const mostRead: any[] = mostReadRaw ?? [];
    const recentArticles: any[] = recentRaw ?? [];
    const articles: any[] = gridRaw ?? [];

    return (
      <MeehunCategoryPage
        category={category}
        featuredArticle={featuredArticle ?? null}
        mostRead={mostRead}
        recentArticles={recentArticles}
        articles={articles}
        total={count ?? 0}
        totalPages={Math.ceil((count ?? 0) / PAGE_SIZE)}
        page={page}
      />
    );
  }

  // ALL OTHER CATEGORIES
  const from = (page - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;
  const isVaahaka = category.slug === "vaahaka";

  const { data: articles, count } = await supabase
    .from("articles")
    .select(
      isVaahaka
        ? "id, title, slug, excerpt, featured_image, cover_portrait_url, cover_type, cover_video_thumbnail, reading_time_minutes, published_at, review_score, review_subject, tags, author:authors!author_id(full_name)"
        : "id, title, slug, excerpt, featured_image, cover_type, cover_video_thumbnail, reading_time_minutes, published_at, review_score, review_subject, tags, author:authors!author_id(full_name)",
      { count: "exact" }
    )
    .eq("status", "published")
    .eq("category_id", category.id)
    .order("published_at", { ascending: false })
    .range(from, to);

  const allArticles = articles ?? [];
  const total = count ?? 0;
  const totalPages = Math.ceil(total / DEFAULT_PAGE_SIZE);

  if (category.slug === "vaahaka") {
    return <StoriesCategoryPage category={category} articles={allArticles} total={total} totalPages={totalPages} page={page} />;
  }

  if (category.slug === "raha") {
    return <ReviewsCategoryPage category={category} articles={allArticles} total={total} totalPages={totalPages} page={page} />;
  }

  return <DefaultCategoryPage category={category} articles={allArticles} total={total} totalPages={totalPages} page={page} />;
}
