// src/app/api/views/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { article_id, fbclid, referrer: clientReferrer } = await req.json();
    if (!article_id) return NextResponse.json({ error: "article_id required" }, { status: 400 });

    const supabase = await createServerSupabaseClient();

    const country_code = req.headers.get("x-vercel-ip-country") ?? null;

    const ua = req.headers.get("user-agent") ?? "";
    let device_type = "desktop";
    if (/tablet|ipad/i.test(ua)) device_type = "tablet";
    else if (/mobile|android|iphone/i.test(ua)) device_type = "mobile";

    const referrer = clientReferrer || null;

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

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);

    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prevWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const prevMonthStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [
      { count: total },
      { count: today },
      { count: yesterday },
      { count: week },
      { count: prevWeek },
      { count: month },
      { count: prevMonth },
      { data: topCountriesRaw },
      { data: deviceCountsRaw },
      { data: sourceCountsRaw },
      { data: topArticlesRaw },
      { data: vaahakaStatsRaw },
      { data: vaahakaTopArticlesRaw },
    ] = await Promise.all([
      supabase.from("article_views").select("*", { count: "exact", head: true }),
      supabase.from("article_views").select("*", { count: "exact", head: true }).gte("viewed_at", todayStart.toISOString()),
      supabase.from("article_views").select("*", { count: "exact", head: true }).gte("viewed_at", yesterdayStart.toISOString()).lt("viewed_at", todayStart.toISOString()),
      supabase.from("article_views").select("*", { count: "exact", head: true }).gte("viewed_at", weekStart.toISOString()),
      supabase.from("article_views").select("*", { count: "exact", head: true }).gte("viewed_at", prevWeekStart.toISOString()).lt("viewed_at", weekStart.toISOString()),
      supabase.from("article_views").select("*", { count: "exact", head: true }).gte("viewed_at", monthStart.toISOString()),
      supabase.from("article_views").select("*", { count: "exact", head: true }).gte("viewed_at", prevMonthStart.toISOString()).lt("viewed_at", monthStart.toISOString()),
      supabase.rpc("get_top_countries", { limit_count: 5 }),
      supabase.rpc("get_device_counts"),
      supabase.rpc("get_source_counts"),
      supabase.rpc("get_top_articles", { limit_count: 5 }),
      supabase.rpc("get_category_view_stats", { category_slug_param: "vaahaka" }),
      supabase.rpc("get_top_articles_by_category", { category_slug_param: "vaahaka", limit_count: 5 }),
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

    let vaahakaTopArticlesWithTitles: any[] = [];
    const vaahakaTopIds = (vaahakaTopArticlesRaw ?? []).map((r: any) => ({ id: r.article_id, count: Number(r.views) }));
    if (vaahakaTopIds.length > 0) {
      const { data: vArticles } = await supabase
        .from("articles")
        .select("id, title")
        .in("id", vaahakaTopIds.map((a: any) => a.id));
      vaahakaTopArticlesWithTitles = vaahakaTopIds.map(({ id, count }: any) => ({
        ...((vArticles ?? []).find((a: any) => a.id === id) ?? { id, title: "—" }),
        views: count,
      }));
    }

    const vaahakaRow = vaahakaStatsRaw?.[0] ?? { total: 0, today: 0, week: 0, month: 0 };
    const vaahakaStats = {
      total: Number(vaahakaRow.total ?? 0),
      today: Number(vaahakaRow.today ?? 0),
      week: Number(vaahakaRow.week ?? 0),
      month: Number(vaahakaRow.month ?? 0),
      topArticles: vaahakaTopArticlesWithTitles,
    };

    return NextResponse.json({
      total: total ?? 0,
      today: today ?? 0,
      yesterday: yesterday ?? 0,
      week: week ?? 0,
      prevWeek: prevWeek ?? 0,
      month: month ?? 0,
      prevMonth: prevMonth ?? 0,
      topCountries,
      deviceCounts,
      sourceCounts,
      topArticles: topArticlesWithTitles,
      vaahakaStats,
    });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
