// app/api/search/route.ts
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("articles")
    .select("id, title, slug, category:categories!category_id(name, slug)")
    .eq("status", "published")
    .or(`title.ilike.%${q}%,excerpt.ilike.%${q}%`)
    .order("published_at", { ascending: false })
    .limit(8);

  return NextResponse.json({ results: data ?? [] });
}
