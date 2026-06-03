// src/app/originals/[slug]/watch/page.tsx
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

const CF_CUSTOMER_CODE = "hyktj7g4xsx8p15r";

async function getOriginal(slug: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("originals")
    .select("id, title, slug, cloudflare_stream_id, thumbnail_url, type, episode_number, series:series!series_id(title)")
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  return data;
}

export default async function OriginalsWatchPage({ params }: { params: { slug: string } }) {
  const original = await getOriginal(params.slug);
  if (!original || !original.cloudflare_stream_id) notFound();

  const playerUrl = `https://customer-${CF_CUSTOMER_CODE}.cloudflarestream.com/${original.cloudflare_stream_id}/iframe?autoplay=true&preload=true${original.thumbnail_url ? `&poster=${encodeURIComponent(original.thumbnail_url)}` : ""}`;

  const subtitle = original.series
    ? `${original.series.title}${original.episode_number ? ` · E${original.episode_number}` : ""}`
    : null;

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
        <Link href={`/originals/${original.slug}`} className="text-white/60 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="text-center">
          <p className="text-sm font-semibold text-white" style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}>
            {original.title}
          </p>
          {subtitle && (
            <p className="text-xs text-neutral-400 mt-0.5" style={{ fontFamily: "MVTypewriter, serif" }}>
              {subtitle}
            </p>
          )}
        </div>
        <div className="w-5" />
      </div>

      {/* Player — fills remaining height */}
      <div className="flex-1 flex items-center justify-center px-0 md:px-8 pb-8">
        <div className="w-full max-w-5xl aspect-video bg-neutral-900 rounded-none md:rounded-xl overflow-hidden">
          <iframe
            src={playerUrl}
            className="w-full h-full"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        </div>
      </div>

      {/* Breadcrumb below player */}
      <div className="px-6 pb-6 flex items-center gap-1.5 text-xs text-neutral-600" dir="ltr">
        <Link href="/originals" className="hover:text-neutral-400 transition-colors" style={{ fontFamily: "MVTypewriter, serif" }}>
          އޮރިޖިނަލްސް
        </Link>
        <span>/</span>
        <Link href={`/originals/${original.slug}`} className="hover:text-neutral-400 transition-colors" style={{ fontFamily: "MVTypewriter, serif" }}>
          {original.title}
        </Link>
        <span>/</span>
        <span className="text-neutral-500" style={{ fontFamily: "MVTypewriter, serif" }}>ބަލަނީ</span>
      </div>
    </div>
  );
}
