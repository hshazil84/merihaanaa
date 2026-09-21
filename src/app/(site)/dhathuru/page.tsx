import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DhathuruCategoryPage } from "../DhathuruCategoryPage";

const VALID_TYPES = ["resort", "guesthouse", "liveaboard"] as const;
type DestType = (typeof VALID_TYPES)[number];

export default async function Page({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = createServerSupabaseClient();

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", "dhathuru")
    .single();

  if (!category) return notFound();

  const rawType = typeof searchParams.type === "string" ? searchParams.type : undefined;
  const activeType: DestType | null = VALID_TYPES.includes(rawType as DestType)
    ? (rawType as DestType)
    : null;

  let query = supabase
    .from("articles")
    .select(
      "id, title, slug, excerpt, featured_image, review_score, review_subject, review_area, review_type, reading_time_minutes, published_at, author:authors!author_id(full_name)"
    )
    .eq("status", "published")
    .eq("category_id", category.id);

  if (activeType) {
    query = query.eq("review_type", activeType);
  }

  const { data: articles } = await query
    .order("published_at", { ascending: false })
    .limit(9);

  const all = articles ?? [];
  const featured = all[0] ?? null;
  const gridItems = all.slice(1);

  return (
    <DhathuruCategoryPage
      category={category}
      featured={featured}
      articles={gridItems}
      activeType={activeType}
    />
  );
}
