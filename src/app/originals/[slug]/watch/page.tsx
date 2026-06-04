// src/app/originals/[slug]/watch/page.tsx
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

const CF_CUSTOMER_CODE = "hyktj7g4xsx8p15r";

async function getOriginal(slug: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("originals")
    .select("id, title, slug, cloudflare_stream_id, thumbnail_url, type, episode_number, season_number, series:series!series_id(title)")
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  return data;
}

export default async function OriginalsWatchPage({ params }: { params: { slug: string } }) {
  const original = await getOriginal(params.slug);
  if (!original || !original.cloudflare_stream_id) notFound();

  const series = Array.isArray(original.series) ? original.series[0] : original.series;

  const episodeLabel = series
    ? [
        series.title,
        original.season_number ? `S${original.season_number}` : null,
        original.episode_number ? `E${original.episode_number}` : null,
      ].filter(Boolean).join(" · ")
    : null;

  const playerUrl = `https://customer-${CF_CUSTOMER_CODE}.cloudflarestream.com/${original.cloudflare_stream_id}/iframe?autoplay=true&preload=true${original.thumbnail_url ? `&poster=${encodeURIComponent(original.thumbnail_url)}` : ""}`;

  return (
    <div className="min-h-screen bg-black flex flex-col">

      {/* Top bar — title centered, back left, home right */}
      <div className="flex-none flex items-center justify-between px-5 py-4">
        {/* Back */}
        <Link href={`/originals/${original.slug}`}
          className="text-white/50 hover:text-white transition-colors p-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        {/* Title center */}
        <div className="flex-1 text-center px-4">
          {episodeLabel && (
            <p className="text-[10px] text-white/40 mb-0.5" style={{ fontFamily: "MVTypewriter, serif" }}>
              {episodeLabel}
            </p>
          )}
          <p className="text-sm font-semibold text-white line-clamp-1" style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}>
            {original.title}
          </p>
        </div>

        {/* Originals link */}
        <Link href="/originals"
          className="text-white/50 hover:text-white transition-colors text-xs"
          style={{ fontFamily: "MVTypewriter, serif" }}>
          އޮރިޖިނަލްސް
        </Link>
      </div>

      {/* Player — full width 16:9 */}
      <div className="flex-none w-full aspect-video bg-neutral-950">
        <iframe
          src={playerUrl}
          className="w-full h-full"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>

      {/* Info below player */}
      <div className="flex-1 px-5 md:px-8 py-6" dir="rtl">
        <h1 className="text-lg md:text-xl font-bold text-white mb-2 leading-snug" style={{ fontFamily: "MVTypewriter, serif" }}>
          {original.title}
        </h1>
        {episodeLabel && (
          <p className="text-sm text-white/40" style={{ fontFamily: "MVTypewriter, serif" }}>
            {episodeLabel}
          </p>
        )}
      </div>

    </div>
  );
}
