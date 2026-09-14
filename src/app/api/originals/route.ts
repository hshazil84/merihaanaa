// src/app/api/originals/route.ts
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Columns a client is allowed to write.
const WRITABLE = [
  "title",
  "slug",
  "description",
  "thumbnail_url",
  "cloudflare_stream_id",
  "duration_seconds",
  "type",
  "series_id",
  "season_number",
  "episode_number",
  "quality_cap",
  "status",
  "scheduled_at",
  "published_at",
  "featured_on_film",
] as const;

function pickWritable(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const key of WRITABLE) {
    if (key in body) out[key] = body[key];
  }
  return out;
}

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from("originals")
    .select(
      "id, title, slug, description, type, status, duration_seconds, thumbnail_url, cloudflare_stream_id, published_at, scheduled_at, series:series!series_id(id, title), series_id, season_number, episode_number, quality_cap",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, count });
}

export async function POST(req: NextRequest) {
  // Use admin client so RLS read-restrictions don't block the inserted row return
  const supabase = createAdminClient();
  const body = await req.json().catch(() => ({}));

  if (!body.title || !body.slug) {
    return NextResponse.json({ error: "title and slug required" }, { status: 400 });
  }

  const fields = pickWritable(body);

  if (!fields.status) fields.status = "draft";
  if (!fields.type) fields.type = "documentary";
  if (!fields.quality_cap) fields.quality_cap = "auto";
  if (fields.status === "published" && !fields.published_at) {
    fields.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("originals")
    .insert(fields)
    .select()
    .maybeSingle();

  if (error) {
    console.error("originals insert failed:", error);
    return NextResponse.json({ error: error.message, details: error.details }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Failed to insert record" }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest) {
  const supabase = createAdminClient();
  const body = await req.json().catch(() => ({}));
  const { id } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const fields = pickWritable(body);

  if (fields.status === "published" && !fields.published_at) {
    fields.published_at = new Date().toISOString();
  }

  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: "no writable fields provided" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("originals")
    .update(fields)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("originals update failed:", error);
    return NextResponse.json({ error: error.message, details: error.details }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await supabase.from("originals").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
