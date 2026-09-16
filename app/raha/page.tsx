import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ReviewsCategoryPage } from "@/components/category-pages/ReviewsCategoryPage";

const RAHA_PAGE_SIZE = 9;

interface PageProps {
  searchParams: { page?: string; type?: string };
}

export async function generateMetadata() {
  const supabase = await createServerSupabaseClient();
  const { data: category } = await supabase
    .from("categories")
    .select("name, slug")
    .eq("slug", "raha")
    .single();
  if (!category) return { title: "ކެޓަގަރީ ނުލިބުނު" };
  return {
    title: category.name,
    description: category.name + " - މެރިހާނާ",
  };
}

export default async function RahaPage({ searchParams }: PageProps) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));
  const supabase = await createServerSupabaseClient();

  const { data: category } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("slug", "raha")
    .single();

  if (!category) notFound();

  const activeType = ["cafe", "restaurant", "recipe"].includes(searchParams.type ?? "")
    ? (searchParams.type as "cafe" | "restaurant" | "recipe")
    : null;

  const from = (page - 1) * RAHA_PAGE_SIZE;
  const to = from + RAHA_PAGE_SIZE - 1;

  let query = supabase
    .from("articles")
    .select(
      "id, title, slug, excerpt, featured_image, review_score, review_subject, review_area, review_type, reading_time_minutes, published_at, author:authors!author_id(full_name)",
      { count: "exact" }
    )
    .eq("status", "published")
    .eq("category_id", category.id)
    .order("published_at", { ascending: false })
    .range(from, to);

  if (activeType) query = query.eq("review_type", activeType);

  const { data: itemsRaw, count } = await query;
  const items = itemsRaw ?? [];
  const total = count ?? 0;

  const featured = page === 1 && items.length > 0 ? items[0] : null;
  const gridItems = page === 1 && items.length > 0 ? items.slice(1) : items;

  return (
    <ReviewsCategoryPage
      category={category}
      featured={featured}
      articles={gridItems}
      total={total}
      totalPages={Math.ceil(total / RAHA_PAGE_SIZE)}
      page={page}
      activeType={activeType}
    />
  );
}
