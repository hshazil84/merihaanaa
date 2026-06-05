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

async function getMeehunData(categoryId: string, categoryObj: any, page: number) {
  const supabase = await createServerSupabaseClient();

  const { data: featuredArticle } = await supabase
    .from("articles")
    .select("id, title, slug, excerpt, featured_image, reading_time_minutes, published_at, view_count, tags, author:authors!author_id(full_name)")
    .eq("status", "published")
    .eq("category_id", categoryId)
    .eq("is_featured", true)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const featuredId = featuredArticle?.id ?? null;

  let mostReadQuery = supabase
    .from("articles")
    .select("id, title, slug, view_count, author:authors!author_id(full_name)")
    .eq("status", "published")
    .eq("category_id", categoryId)
    .order("view_count", { ascending: false })
    .limit(5);
  if (featuredId) mostReadQuery = mostReadQuery.neq("id", featuredId);
  const { data: mostRead } = await mostReadQuery;

  let recentQuery = supabase
    .from("articles")
    .select("id, title, slug, published_at, tags, author:authors!author_id(full_name)")
    .eq("status", "published")
    .eq("category_id", categoryId)
    .order("published_at", { ascending: false })
    .limit(5);
  if (featuredId) recentQuery = recentQuery.neq("id", featuredId);
  const { data: recentArticles } = await recentQuery;

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  let gridQuery = supabase
    .from("articles")
    .select("id, title, slug, excerpt, featured_image, reading_time_minutes, published_at, tags, author:authors!author_id(full_name)", { count: "exact" })
    .eq("status", "published")
    .eq("category_id", categoryId)
    .order("published_at", { ascending: false })
    .range(from, to);
  if (featuredId) gridQuery = gridQuery.neq("id", featuredId);
  const { data: gridArticles, count } = await gridQuery;

  return {
    category: categoryObj,
    featuredArticle: featuredArticle ?? null,
    mostRead: (mostRead ?? []) as any[],
    recentArticles: (recentArticles ?? []) as any[],
    articles: (gridArticles ?? []) as any[],
    total: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
  };
}

async function getCategoryData(slug: string, page: number) {
  const supabase = await createServerSupabaseClient();

  const { data: category } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (!category) return null;

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

  if (params.category === "meehun") {
    const supabase = await createServerSupabaseClient();
    const { data: category } = await supabase
      .from("categories")
      .select("id, name, slug")
      .eq("slug", "meehun")
      .single();
    if (!category) notFound();
    const data = await getMeehunData(category.id, category, page);
    return (
      <MeehunCategoryPage
        category={data.category}
        featuredArticle={data.featuredArticle}
        mostRead={data.mostRead}
        recentArticles={data.recentArticles}
        articles={data.articles}
        total={data.total}
        totalPages={data.totalPages}
        page={page}
      />
    );
  }

  const data = await getCategoryData(params.category, page);
  if (!data) notFound();

  const { category, articles, total, totalPages } = data;

  if (category.slug === "vaahaka") {
    return <StoriesCategoryPage category={category} articles={articles} total={total} totalPages={totalPages} page={page} />;
  }

  if (category.slug === "raha") {
    return <ReviewsCategoryPage category={category} articles={articles} total={total} totalPages={totalPages} page={page} />;
  }

  return <DefaultCategoryPage category={category} articles={articles} total={total} totalPages={totalPages} page={page} />;
}
