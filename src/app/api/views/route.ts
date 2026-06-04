// src/app/api/views/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { article_id } = await req.json();
    if (!article_id) return NextResponse.json({ error: "article_id required" }, { status: 400 });

    const supabase = await createServerSupabaseClient();

    // Country from Vercel headers
    const country_code = req.headers.get("x-vercel-ip-country") ?? null;

    // Device type from user agent
    const ua = req.headers.get("user-agent") ?? "";
    let device_type = "desktop";
    if (/tablet|ipad/i.test(ua)) device_type = "tablet";
    else if (/mobile|android|iphone/i.test(ua)) device_type = "mobile";

    // Referrer
    const referrer = req.headers.get("referer") ?? null;

    await supabase.from("article_views").insert({
      article_id,
      country_code,
      device_type,
      referrer,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// GET — stats for dashboard
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [
      { count: total },
      { count: today },
      { count: week },
      { count: month },
      { data: byCountry },
      { data: byDevice },
      { data: topArticles },
    ] = await Promise.all([
      supabase.from("article_views").select("*", { count: "exact", head: true }),
      supabase.from("article_views").select("*", { count: "exact", head: true }).gte("viewed_at", todayStart),
      supabase.from("article_views").select("*", { count: "exact", head: true }).gte("viewed_at", weekStart),
      supabase.from("article_views").select("*", { count: "exact", head: true }).gte("viewed_at", monthStart),
      supabase.from("article_views").select("country_code").not("country_code", "is", null),
      supabase.from("article_views").select("device_type"),
      supabase.from("article_views").select("article_id").not("article_id", "is", null),
    ]);

    // Aggregate country counts
    const countryCounts: Record<string, number> = {};
    (byCountry ?? []).forEach((r: any) => {
      if (r.country_code) countryCounts[r.country_code] = (countryCounts[r.country_code] ?? 0) + 1;
    });
    const topCountries = Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([code, count]) => ({ code, count }));

    // Device split
    const deviceCounts: Record<string, number> = { mobile: 0, desktop: 0, tablet: 0 };
    (byDevice ?? []).forEach((r: any) => {
      if (r.device_type) deviceCounts[r.device_type] = (deviceCounts[r.device_type] ?? 0) + 1;
    });

    // Top articles by views
    const articleCounts: Record<string, number> = {};
    (topArticles ?? []).forEach((r: any) => {
      if (r.article_id) articleCounts[r.article_id] = (articleCounts[r.article_id] ?? 0) + 1;
    });
    const topArticleIds = Object.entries(articleCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({ id, count }));

    // Fetch article titles for top articles
    let topArticlesWithTitles: any[] = [];
    if (topArticleIds.length > 0) {
      const { data: articles } = await supabase
        .from("articles")
        .select("id, title, category:categories!category_id(name)")
        .in("id", topArticleIds.map(a => a.id));
      topArticlesWithTitles = topArticleIds.map(({ id, count }) => ({
        ...((articles ?? []).find((a: any) => a.id === id) ?? { id, title: "—" }),
        views: count,
      }));
    }

    return NextResponse.json({
      total: total ?? 0,
      today: today ?? 0,
      week: week ?? 0,
      month: month ?? 0,
      topCountries,
      deviceCounts,
      topArticles: topArticlesWithTitles,
    });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
