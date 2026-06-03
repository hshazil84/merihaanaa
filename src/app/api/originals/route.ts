// src/app/api/originals/route.ts
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from("originals")
    .select("id, title, slug, type, status, duration_seconds, thumbnail_url, published_at, series:series!series_id(id, title), episode_number, quality_cap", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, count });
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from("originals")
    .insert({
      title: body.title,
      slug: body.slug,
      description: body.description ?? null,
      thumbnail_url: body.thumbnail_url ?? null,
      cloudflare_stream_id: body.cloudflare_stream_id ?? null,
      duration_seconds: body.duration_seconds ?? null,
      type: body.type ?? "documentary",
      series_id: body.series_id ?? null,
      episode_number: body.episode_number ?? null,
      quality_cap: body.quality_cap ?? "auto",
      status: "draft",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const body = await req.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  if (fields.status === "published" && !fields.published_at) {
    fields.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("originals")
    .update(fields)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await supabase.from("originals").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
