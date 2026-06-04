// src/app/originals/[slug]/watch/page.tsx
// Server component — fetches data, passes to client

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import WatchPageClient from "./WatchPageClient";

async function getOriginal(slug: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("originals")
    .select("id, title, slug, cloudflare_stream_id, thumbnail_url, type, episode_number, season_number, description, duration_seconds, series:series!series_id(id, title)")
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  return data;
}

async function getEpisodes(seriesId: string, currentId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("originals")
    .select("id, title, slug, thumbnail_url, duration_seconds, episode_number, season_number")
    .eq("status", "published")
    .eq("series_id", seriesId)
    .order("season_number", { ascending: true, nullsFirst: true })
    .order("episode_number", { ascending: true, nullsFirst: true });
  return data ?? [];
}

export default async function WatchPage({ params }: { params: { slug: string } }) {
  const original = await getOriginal(params.slug);
  if (!original || !original.cloudflare_stream_id) notFound();

  const series = Array.isArray(original.series) ? original.series[0] : original.series;
  const episodes = series ? await getEpisodes(series.id, original.id) : [];

  return <WatchPageClient original={original as any} episodes={episodes} />;
}
