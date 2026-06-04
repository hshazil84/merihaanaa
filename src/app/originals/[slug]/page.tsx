// src/app/originals/[slug]/page.tsx
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

const TYPE_LABELS: Record<string, string> = {
  documentary: "ޑޮކިއުމެންޓްރީ",
  profile:     "ޕްރޮފައިލް",
  episode:     "އެޕިސޯޑް",
  segment:     "ސެގްމެންޓް",
  interview:   "އިންޓަވިއު",
  short:       "ޝޯޓް",
};

function formatDuration(s: number | null) {
  if (!s) return null;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m} min ${sec} sec`;
}

async function getOriginal(slug: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("originals")
    .select("*, series:series!series_id(id, title, slug)")
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  return data;
}

async function getRelated(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("originals")
    .select("id, title, slug, thumbnail_url, duration_seconds, type")
    .eq("status", "published")
    .neq("id", id)
    .order("published_at", { ascending: false })
    .limit(8);
  return data ?? [];
}

export default async function OriginalsDetailPage({ params }: { params: { slug: string } }) {
  const original = await getOriginal(params.slug);
  if (!original) notFound();
  const related = await getRelated(original.id);
  const series = Array.isArray(original.series) ? original.series[0] : original.series;

  return (
    <div className="bg-black">
      {/* Hero — full viewport height */}
      <div className="relative w-full h-screen overflow-hidden">
        {original.thumbnail_url ? (
          <img src={original.thumbnail_url} alt={original.title} className="w-full h-full object-cover object-center" />
        ) : (
          <div className="w-full h-full bg-neutral-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

        {/* Content — bottom right, with enough room for mobile header */}
        <div className="absolute bottom-24 md:bottom-32 right-4 md:right-12 left-4 md:left-auto md:max-w-xl" dir="rtl">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-white/60 border border-white/10" style={{ fontFamily: "MVTypewriter, serif" }}>
              {TYPE_LABELS[original.type] ?? original.type}
            </span>
            {original.duration_seconds && (
              <span className="text-xs text-white/50 tabular-nums" dir="ltr">{formatDuration(original.duration_seconds)}</span>
            )}
            {series && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/20" style={{ fontFamily: "MVTypewriter, serif" }}>
                {series.title}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-xl md:text-4xl font-bold text-white leading-snug mb-3" style={{ fontFamily: "MVTypewriter, serif" }}>
            {original.title}
          </h1>

          {/* Description */}
          {original.description && (
            <p className="text-sm text-white/70 leading-relaxed mb-5 line-clamp-2 md:line-clamp-3" style={{ fontFamily: "MVTypewriter, serif" }}>
              {original.description}
            </p>
          )}

          {/* Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            {original.cloudflare_stream_id && (
              <Link
                href={`/originals/${original.slug}/watch`}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-white text-black font-bold text-sm hover:bg-neutral-200 transition-colors"
                style={{ fontFamily: "MVTypewriter, serif" }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                Watch
              </Link>
            )}
            <Link
              href={`/originals/${original.slug}`}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-colors border border-white/20"
              style={{ fontFamily: "MVTypewriter, serif" }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              މައުލޫމާތު
            </Link>
          </div>
        </div>
      </div>

      {/* Related videos */}
      {related.length > 0 && (
        <div className="pt-6 pb-10 px-4 md:px-12">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2" dir="rtl" style={{ fontFamily: "MVTypewriter, serif" }}>
            <span className="block w-1 h-4 bg-red-500 rounded-full" />
            އިތުރު ވިޑިއޯ
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x" style={{ scrollbarWidth: "none" }}>
            {related.map((item: any) => (
              <Link key={item.id} href={`/originals/${item.slug}/watch`}
                className="group flex-none w-[75vw] sm:w-[40vw] md:w-[24vw] lg:w-[18vw] snap-start">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-neutral-800">
                  {item.thumbnail_url ? (
                    <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full bg-neutral-800" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                  {item.duration_seconds && (
                    <div className="absolute bottom-1.5 right-1.5 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded tabular-nums">
                      {Math.floor(item.duration_seconds / 60)}:{String(item.duration_seconds % 60).padStart(2, "0")}
                    </div>
                  )}
                </div>
                <p className="mt-2 text-xs font-semibold text-neutral-200 line-clamp-2 group-hover:text-white transition-colors" dir="rtl" style={{ fontFamily: "MVTypewriter, serif" }}>
                  {item.title}
                </p>
                <p className="text-[10px] text-neutral-500 mt-0.5" dir="rtl" style={{ fontFamily: "MVTypewriter, serif" }}>
                  {TYPE_LABELS[item.type] ?? item.type}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
