// src/app/api/views/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { article_id, fbclid } = await req.json();
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
      fbclid: fbclid ?? null,
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
      { data: topCountriesRaw },
      { data: deviceCountsRaw },
      { data: sourceCountsRaw },
      { data: topArticlesRaw },
    ] = await Promise.all([
      supabase.from("article_views").select("*", { count: "exact", head: true }),
      supabase.from("article_views").select("*", { count: "exact", head: true }).gte("viewed_at", todayStart),
      supabase.from("article_views").select("*", { count: "exact", head: true }).gte("viewed_at", weekStart),
      supabase.from("article_views").select("*", { count: "exact", head: true }).gte("viewed_at", monthStart),
      supabase.rpc("get_top_countries", { limit_count: 5 }),
      supabase.rpc("get_device_counts"),
      supabase.rpc("get_source_counts"),
      supabase.rpc("get_top_articles", { limit_count: 5 }),
    ]);

    const topCountries = (topCountriesRaw ?? []).map((r: any) => ({
      code: r.country_code,
      count: Number(r.count),
    }));

    const deviceCounts: Record<string, number> = { mobile: 0, desktop: 0, tablet: 0 };
    (deviceCountsRaw ?? []).forEach((r: any) => {
      if (r.device_type) deviceCounts[r.device_type] = Number(r.count);
    });

    const sourceCounts: Record<string, number> = {};
    (sourceCountsRaw ?? []).forEach((r: any) => {
      sourceCounts[r.source] = Number(r.count);
    });

    // Fetch article titles for top articles
    let topArticlesWithTitles: any[] = [];
    const topArticleIds = (topArticlesRaw ?? []).map((r: any) => ({ id: r.article_id, count: Number(r.views) }));
    if (topArticleIds.length > 0) {
      const { data: articles } = await supabase
        .from("articles")
        .select("id, title, category:categories!category_id(name)")
        .in("id", topArticleIds.map((a: any) => a.id));
      topArticlesWithTitles = topArticleIds.map(({ id, count }: any) => ({
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
      sourceCounts,
      topArticles: topArticlesWithTitles,
    });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
