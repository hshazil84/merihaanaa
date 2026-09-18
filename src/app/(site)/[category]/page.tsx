import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { DefaultCategoryPage } from "./components/DefaultCategoryPage";
import { StoriesCategoryPage } from "./components/StoriesCategoryPage";

interface PageProps {
  params: { category: string };
  searchParams: { page?: string; section?: string; type?: string };
}

const DEFAULT_PAGE_SIZE = 12;
const SHORT_STORIES_PAGE_SIZE = 8;
const LONG_STORIES_PAGE_SIZE = 8;
const BOOK_REVIEWS_PAGE_SIZE = 8;
const STORIES_OVERVIEW_LIMIT = 4;

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
    description: category.name + " - މެރިހާނާ",
  };
}

async function hydrateSeries(supabase: any, seriesRaw: any[]) {
  return Promise.all(
    (seriesRaw ?? []).map(async (s: any) => {
      const [{ data: latest }, { count: chapterCount }, { data: firstChapter }] = await Promise.all([
        supabase
          .from("articles")
          .select("slug, chapter_number, published_at")
          .eq("status", "published")
          .eq("series_id", s.id)
          .order("chapter_number", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("articles")
          .select("id", { count: "exact", head: true })
          .eq("status", "published")
          .eq("series_id", s.id),
        supabase
          .from("articles")
          .select("slug, cover_portrait_url, featured_image")
          .eq("status", "published")
          .eq("series_id", s.id)
          .order("chapter_number", { ascending: true })
          .limit(1)
          .maybeSingle(),
      ]);
      return {
        ...s,
        latest_chapter:      latest?.chapter_number ?? null,
        latest_slug:         latest?.slug ?? null,
        first_slug:          (firstChapter as any)?.slug ?? null,
        latest_published_at: latest?.published_at ?? null,
        chapter_count:       chapterCount ?? 0,
        thumbnail:           s.thumbnail ?? (firstChapter as any)?.cover_portrait_url ?? (firstChapter as any)?.featured_image ?? null,
      };
    })
  );
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

  // ── VAAHAKA (Stories) ────────────────────────────────
  if (category.slug === "vaahaka") {
    const section = searchParams.section ?? (page > 1 ? "short" : undefined);

    if (section === "long") {
      const from = (page - 1) * LONG_STORIES_PAGE_SIZE;
      const to = from + LONG_STORIES_PAGE_SIZE - 1;
      const { data: seriesRaw, count } = await supabase
        .from("series")
        .select("id, title, slug, description, thumbnail, category_id", { count: "exact" })
        .eq("category_id", category.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .range(from, to);

      const seriesWithChapters = (await hydrateSeries(supabase, seriesRaw ?? []))
        .filter((s: any) => s.chapter_count > 0);
      const total = count ?? 0;

      return (
        <StoriesCategoryPage
          category={category}
          focusedSection="long"
          seriesList={seriesWithChapters}
          page={page}
          totalPages={Math.ceil(total / LONG_STORIES_PAGE_SIZE)}
        />
      );
    }

    if (section === "review") {
      const from = (page - 1) * BOOK_REVIEWS_PAGE_SIZE;
      const to = from + BOOK_REVIEWS_PAGE_SIZE - 1;
      const { data: reviewRaw, count } = await supabase
        .from("articles")
        .select("id, title, slug, featured_image, review_score, review_subject, excerpt, published_at, reading_time_minutes", { count: "exact" })
        .eq("status", "published")
        .eq("category_id", category.id)
        .filter("series_id", "is", null)
        .eq("is_book_review", true)
        .order("published_at", { ascending: false })
        .range(from, to);

      const total = count ?? 0;

      return (
        <StoriesCategoryPage
          category={category}
          focusedSection="review"
          bookReviews={reviewRaw ?? []}
          page={page}
          totalPages={Math.ceil(total / BOOK_REVIEWS_PAGE_SIZE)}
        />
      );
    }

    if (section === "short") {
      const from = (page - 1) * SHORT_STORIES_PAGE_SIZE;
      const to = from + SHORT_STORIES_PAGE_SIZE - 1;
      const { data: shortRaw, count } = await supabase
        .from("articles")
        .select("id, title, slug, cover_portrait_url, featured_image, reading_time_minutes, published_at, chapter_number, series_id, review_score, author:authors!author_id(full_name)", { count: "exact" })
        .eq("status", "published")
        .eq("category_id", category.id)
        .filter("series_id", "is", null)
        .eq("is_book_review", false)
        .order("published_at", { ascending: false })
        .range(from, to);

      const total = count ?? 0;

      return (
        <StoriesCategoryPage
          category={category}
          focusedSection="short"
          shortStories={shortRaw ?? []}
          page={page}
          totalPages={Math.ceil(total / SHORT_STORIES_PAGE_SIZE)}
        />
      );
    }

    const [
      { data: seriesRaw, count: seriesCount },
      { data: shortRaw, count: shortCount },
      { data: reviewRaw, count: reviewCount },
    ] = await Promise.all([
      supabase
        .from("series")
        .select("id, title, slug, description, thumbnail, category_id", { count: "exact" })
        .eq("category_id", category.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(STORIES_OVERVIEW_LIMIT),

      supabase
        .from("articles")
        .select("id, title, slug, cover_portrait_url, featured_image, reading_time_minutes, published_at, chapter_number, series_id, review_score, author:authors!author_id(full_name)", { count: "exact" })
        .eq("status", "published")
        .eq("category_id", category.id)
        .filter("series_id", "is", null)
        .eq("is_book_review", false)
        .order("published_at", { ascending: false })
        .limit(STORIES_OVERVIEW_LIMIT),

      supabase
        .from("articles")
        .select("id, title, slug, featured_image, review_score, review_subject, excerpt, published_at, reading_time_minutes", { count: "exact" })
        .eq("status", "published")
        .eq("category_id", category.id)
        .filter("series_id", "is", null)
        .eq("is_book_review", true)
        .order("published_at", { ascending: false })
        .limit(STORIES_OVERVIEW_LIMIT),
    ]);

    const seriesWithChapters = (await hydrateSeries(supabase, seriesRaw ?? []))
      .filter((s: any) => s.chapter_count > 0);

    return (
      <StoriesCategoryPage
        category={category}
        seriesList={seriesWithChapters}
        shortStories={shortRaw ?? []}
        bookReviews={reviewRaw ?? []}
        seriesTotal={seriesCount ?? 0}
        shortTotal={shortCount ?? 0}
        reviewTotal={reviewCount ?? 0}
        page={1}
        totalPages={1}
      />
    );
  }

  // ── ALL OTHER CATEGORIES ─────────────────────────────
  const from = (page - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;

  const { data: articles, count } = await supabase
    .from("articles")
    .select(
      "id, title, slug, excerpt, featured_image, cover_type, cover_video_thumbnail, reading_time_minutes, published_at, review_score, review_subject, tags, author:authors!author_id(full_name)",
      { count: "exact" }
    )
    .eq("status", "published")
    .eq("category_id", category.id)
    .order("published_at", { ascending: false })
    .range(from, to);

  const allArticles = articles ?? [];
  const total = count ?? 0;
  const totalPages = Math.ceil(total / DEFAULT_PAGE_SIZE);

  return <DefaultCategoryPage category={category} articles={allArticles} total={total} totalPages={totalPages} page={page} />;
}
