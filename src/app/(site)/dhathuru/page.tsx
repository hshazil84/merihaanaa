import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { DhathuruCategoryPage } from "../_components/DhathuruCategoryPage";

const FRONT_PAGE_SIZE = 9;

interface PageProps {
  searchParams: { type?: string };
}

export async function generateMetadata() {
  const supabase = await createServerSupabaseClient();
  const { data: category } = await supabase
    .from("categories")
    .select("name, slug")
    .eq("slug", "dhathuru")
    .single();
  if (!category) return { title: "ކެޓަގަރީ ނުލިބުނު" };
  return {
    title: category.name,
    description: category.name + " - މެރިހާނާ",
  };
}

export default async function DhathuruPage({ searchParams }: PageProps) {
  const supabase = await createServerSupabaseClient();

  const { data: category } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("slug", "dhathuru")
    .single();

  if (!category) notFound();

  const activeType = ["resort", "guesthouse", "liveaboard"].includes(searchParams.type ?? "")
    ? (searchParams.type as "resort" | "guesthouse" | "liveaboard")
    : null;

  let query = supabase
    .from("articles")
    .select(
      "id, title, slug, excerpt, featured_image, review_score, review_subject, review_area, review_type, reading_time_minutes, published_at, author:authors!author_id(full_name)"
    )
    .eq("status", "published")
    .eq("category_id", category.id)
    .order("published_at", { ascending: false })
    .limit(FRONT_PAGE_SIZE);

  if (activeType) query = query.eq("review_type", activeType);

  const { data: itemsRaw } = await query;
  const items = itemsRaw ?? [];

  const featured = items[0] ?? null;
  const gridItems = items.slice(1);

  return (
    <DhathuruCategoryPage
      category={category}
      featured={featured}
      articles={gridItems}
      activeType={activeType}
    />
  );
}
