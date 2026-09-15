import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { DefaultCategoryPage } from "./components/DefaultCategoryPage";
import { ReviewsCategoryPage } from "./components/ReviewsCategoryPage";
import { StoriesCategoryPage } from "./components/StoriesCategoryPage";
import { MeehunCategoryPage } from "./components/MeehunCategoryPage";
import FilmCategoryPage from "./components/FilmCategoryPage";
import MusicCategoryPage from "./components/MusicCategoryPage";

interface PageProps {
  params: { category: string };
  searchParams: { page?: string; section?: string };
}

const PAGE_SIZE = 8;
const DEFAULT_PAGE_SIZE = 12;
const SHORT_STORIES_PAGE_SIZE = 8;
const LONG_STORIES_PAGE_SIZE = 8;
const BOOK_REVIEWS_PAGE_SIZE = 8;
// Items shown per row on the /vaahaka overview before a "see all" link appears.
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

  // ── MEEHUN ──────────────────────────────────────────
  if (category.slug === "meehun") {
    const { data: featuredArticle } = await supabase
      .from("articles")
      .select("id, title, slug, excerpt, featured_image, reading_time_minutes, published_at, view_count, tags, author:authors!author_id(full_name, avatar)")
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
      .limit(3);
    if (featuredId) recentQuery = recentQuery.neq("id", featuredId);
    const { data: recentRaw } = await recentQuery;

    const excludeIds = [
      featuredId,
      ...(recentRaw ?? []).map((a: any) => a.id),
    ].filter(Boolean) as string[];

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let gridQuery = supabase
      .from("articles")
      .select("id, title, slug, excerpt, featured_image, reading_time_minutes, published_at, tags, author:authors!author_id(full_name)", { count: "exact" })
      .eq("status", "published")
      .eq("category_id", category.id)
      .order("published_at", { ascending: false })
      .range(from, to);

    if (excludeIds.length > 0) {
      gridQuery = gridQuery.not("id", "in", "(" + excludeIds.join(",") + ")");
    }

    const { data: gridRaw, count } = await gridQuery;

    return (
      <MeehunCategoryPage
        category={category}
        featuredArticle={featuredArticle ?? null}
        mostRead={mostReadRaw ?? []}
        recentArticles={recentRaw ?? []}
        articles={gridRaw ?? []}
        total={count ?? 0}
        totalPages={Math.ceil((count ?? 0) / PAGE_SIZE)}
        page={page}
      />
    );
  }

  // ── FILM ─────────────────────────────────────────────
  if (category.slug === "film") {
    const from = (page - 1) * DEFAULT_PAGE_SIZE;
    const to = from + DEFAULT_PAGE_SIZE - 1;

    const [
      { data: articles, count },
      { data: cinemaRaw },
      { data: ottRaw },
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
        .from("charts")
        .select("*")
        .in("chart_type", ["cinema_now", "cinema_upcoming"])
        .order("rank", { ascending: true }),
      supabase
        .from("chart_series")
        .select("*")
        .eq("is_active", true)
        .order("rank", { ascending: true }),
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
        cinemaEntries={(cinemaRaw ?? []) as any[]}
        ottEntries={(ottRaw ?? []) as any[]}
        topRead={(topReadRaw ?? []) as any[]}
        featuredOriginal={featuredOriginal as any}
        categorySlug={category.slug}
        totalCount={count ?? 0}
        page={page}
      />
    );
  }

  // ── MUSIC ─────────────────────────────────────────────
  if (category.slug === "music") {
    const from = (page - 1) * DEFAULT_PAGE_SIZE;
    const to = from + DEFAULT_PAGE_SIZE - 1;

    const [
      { data: articles, count },
      { data: trendingRaw },
      { data: eventsRaw },
      { data: featuredOriginal },
    ] = await Promise.all([
      supabase
        .from("articles")
        .select(
          "id, title, slug, excerpt, featured_image, reading_time_minutes, published_at, tags, view_count, author:authors!author_id(full_name), category:categories!category_id(name, slug)",
          { count: "exact" }
        )
        .eq("status", "published")
        .eq("category_id", category.id)
        .order("published_at", { ascending: false })
        .range(from, to),
      supabase
        .from("charts")
        .select("*")
        .eq("chart_type", "music_trending")
        .order("rank", { ascending: true }),
      supabase
        .from("charts")
        .select("*")
        .eq("chart_type", "music_event")
        .order("showing_date", { ascending: true }),
      supabase
        .from("originals")
        .select("id, title, slug, description, thumbnail_url, cloudflare_stream_id, duration_seconds, type")
        .eq("featured_on_film", true)
        .eq("status", "published")
        .limit(1)
        .maybeSingle(),
    ]);

    return (
      <MusicCategoryPage
        articles={(articles ?? []) as any[]}
        trendingSongs={(trendingRaw ?? []) as any[]}
        musicEvents={(eventsRaw ?? []) as any[]}
        featuredOriginal={featuredOriginal as any}
        categorySlug={category.slug}
        totalCount={count ?? 0}
        page={page}
      />
    );
  }

  // ── VAAHAKA (Stories) ────────────────────────────────
  if (category.slug === "vaahaka") {
    // Legacy links pointed at /vaahaka?page=N for what used to be the only
    // paginated list (short stories). If a page beyond 1 arrives with no
    // explicit section, keep those links working by treating it as the
    // short-stories view.
    const section = searchParams.section ?? (page > 1 ? "short" : undefined);

    // ── Focused: one section, fully paginated ──
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

      const seriesWithChapters = await hydrateSeries(supabase, seriesRaw ?? []);
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

    // ── Overview: 4 of each, with see-all links ──
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

    const seriesWithChapters = await hydrateSeries(supabase, seriesRaw ?? []);

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

  if (category.slug === "raha") {
    return <ReviewsCategoryPage category={category} articles={allArticles} total={total} totalPages={totalPages} page={page} />;
  }

  return <DefaultCategoryPage category={category} articles={allArticles} total={total} totalPages={totalPages} page={page} />;
}
