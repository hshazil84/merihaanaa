// app/(site)/[category]/page.tsx

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { DefaultCategoryPage } from "./components/DefaultCategoryPage";
import { ReviewsCategoryPage } from "./components/ReviewsCategoryPage";
import { StoriesCategoryPage } from "./components/StoriesCategoryPage";

interface PageProps {
  params: { category: string };
  searchParams: { page?: string };
}

const PAGE_SIZE = 12;

async function getCategoryData(slug: string, page: number) {
  const supabase = await createServerSupabaseClient();

  const { data: category } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (!category) return null;

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

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
    totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
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

  if (category.slug === "vaahaka") {
    return <StoriesCategoryPage category={category} articles={articles} total={total} totalPages={totalPages} page={page} />;
  }

  if (category.slug === "raha") {
    return <ReviewsCategoryPage category={category} articles={articles} total={total} totalPages={totalPages} page={page} />;
  }

  return <DefaultCategoryPage category={category} articles={articles} total={total} totalPages={totalPages} page={page} />;
}
