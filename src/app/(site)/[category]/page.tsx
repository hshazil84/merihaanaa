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

async function getCategoryData(slug: string, page: number) {
  const supabase = await createServerSupabaseClient();

  const { data: category } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (!category) return null;

  if (slug === "meehun") {
    // Featured article (is_featured = true)
    const { data: featuredArticle } = await supabase
      .from("articles")
      .select(
        "id, title, slug, excerpt, featured_image, reading_time_minutes, published_at, view_count, author:authors!author_id(full_name)"
      )
      .eq("status", "published")
      .eq("category_id", category.id)
      .eq("is_featured", true)
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Most read (top 5 by view_count, excluding featured)
    const mostReadQuery = supabase
      .from("articles")
      .select(
        "id, title, slug, view_count, author:authors!author_id(full_name)"
      )
      .eq("status", "published")
      .eq("category_id", category.id)
      .order("view_count", { ascending: false })
      .limit(5);

    if (featuredArticle) {
      mostReadQuery.neq("id", featuredArticle.id);
    }

    const { data: mostRead } = await mostReadQuery;

    // Recent articles (latest 5, excluding featured)
    const recentQuery = supabase
      .from("articles")
      .select(
        "id, title, slug, published_at, tags, author:authors!author_id(full_name)"
      )
      .eq("status", "published")
      .eq("category_id", category.id)
      .order("published_at", { ascending: false })
      .limit(5);

    if (featuredArticle) {
      recentQuery.neq("id", featuredArticle.id);
    }

    const { data: recentArticles } = await recentQuery;

    // Paginated grid (8 per page, excluding featured)
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const gridQuery = supabase
      .from("articles")
      .select(
        "id, title, slug, excerpt, featured_image, reading_time_minutes, published_at, tags, author:authors!author_id(full_name)",
        { count: "exact" }
      )
      .eq("status", "published")
      .eq("category_id", category.id)
      .order("published_at", { ascending: false })
      .range(from, to);

    if (featuredArticle) {
      gridQuery.neq("id", featuredArticle.id);
    }

    const { data: gridArticles, count } = await gridQuery;
    
    return {
      category,
      featuredArticle: featuredArticle ?? null,
      mostRead: (mostRead ?? []) as any[],
      recentArticles: (recentArticles ?? []) as any[],
      articles: (gridArticles ?? []) as any[],
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
      isMeehun: true as const,
    };
  }

  // All other categories
  const from = (page - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;
  const isVaahaka = slug === "vaahaka";

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

  return {
    category,
    articles: articles ?? [],
    total: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / DEFAULT_PAGE_SIZE),
    isMeehun: false,
  };
}

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
  const data = await getCategoryData(params.category, page);
  if (!data) notFound();

  const { category, articles, total, totalPages } = data;

  if (category.slug === "meehun" && data.isMeehun) {
    return (
      <MeehunCategoryPage
        category={category}
        featuredArticle={data.featuredArticle}
        mostRead={data.mostRead}
        recentArticles={data.recentArticles}
        articles={articles}
        total={total}
        totalPages={totalPages}
        page={page}
      />
    );
  }

  if (category.slug === "vaahaka") {
    return <StoriesCategoryPage category={category} articles={articles} total={total} totalPages={totalPages} page={page} />;
  }

  if (category.slug === "raha") {
    return <ReviewsCategoryPage category={category} articles={articles} total={total} totalPages={totalPages} page={page} />;
  }

  return <DefaultCategoryPage category={category} articles={articles} total={total} totalPages={totalPages} page={page} />;
}
