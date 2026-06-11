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
        .eq("featured_on_music", true)
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
