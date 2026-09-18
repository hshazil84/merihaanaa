// src/app/originals/page.tsx
import OriginalCard from "./OriginalCard";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDuration } from "@/lib/format";
import Link from "next/link";

const TYPE_LABELS: Record<string, string> = {
  documentary: "ޑޮކިއުމެންޓްރީ",
  profile:     "ޕްރޮފައިލް",
  episode:     "އެޕިސޯޑް",
  segment:     "ސެގްމެންޓް",
  interview:   "އިންޓަވިއު",
  short:       "ޝޯޓް",
};

const TYPE_ORDER = ["documentary", "episode", "profile", "interview", "segment", "short"];

async function getOriginalsData() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("originals")
    .select("id, title, slug, thumbnail_url, duration_seconds, type, description, series:series!series_id(id, title)")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const all = data ?? [];
  const featured = all[0] ?? null;
  const grouped: Record<string, typeof all> = {};
  for (const item of all) {
    if (!grouped[item.type]) grouped[item.type] = [];
    grouped[item.type].push(item);
  }
  return { featured, grouped };
}

export default async function OriginalsPage() {
  const { featured, grouped } = await getOriginalsData();
  const hasContent = featured || Object.keys(grouped).length > 0;

  return (
    <div className="pb-16">
      {/* Hero featured */}
      {featured && (
        <div className="relative w-full aspect-[21/9] md:aspect-[3/1] overflow-hidden mb-10">
          {featured.thumbnail_url ? (
            <img src={featured.thumbnail_url} alt={featured.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-neutral-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12" dir="rtl">
            {/* Metadata line */}
            <div className="flex items-center gap-2 mb-3 text-sm text-white/60">
              <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-white/70 border border-white/10" style={{ fontFamily: "MVTypewriter, serif" }}>
                {TYPE_LABELS[featured.type] ?? featured.type}
              </span>
              {featured.duration_seconds && (
                <>
                  <span className="text-white/30">•</span>
                  <span dir="ltr" className="tabular-nums">{formatDuration(featured.duration_seconds)}</span>
                </>
              )}
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 max-w-2xl leading-snug" dir="auto" style={{ fontFamily: "MVTypewriter, serif" }}>
              {featured.title}
            </h1>
            {featured.description && (
              <p className="text-sm md:text-base text-neutral-300 max-w-xl line-clamp-2 mb-5" dir="auto" style={{ fontFamily: "MVTypewriter, serif" }}>
                {featured.description}
              </p>
            )}
            <div className="flex items-center gap-3" dir="ltr">
              <Link href={`/originals/${featured.slug}/watch`}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-white text-black text-sm font-bold hover:bg-neutral-200 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                Watch
              </Link>
              <Link href={`/originals/${featured.slug}`}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-colors border border-white/20">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Info
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Rows */}
      <div className="px-4 md:px-8 space-y-10">
        {!hasContent && (
          <div className="text-center py-24 text-neutral-600" style={{ fontFamily: "MVTypewriter, serif" }}>ވިޑިއޯ ނެތް</div>
        )}
        {TYPE_ORDER.filter(t => grouped[t]?.length > 0).map((typeKey) => (
          <section key={typeKey}>
            <div className="flex items-center gap-3 mb-4" dir="rtl">
              <span className="block w-1 h-5 bg-red-500 rounded-full" />
              <h2 className="text-lg font-bold text-white" style={{ fontFamily: "MVTypewriter, serif" }}>
                {TYPE_LABELS[typeKey]}
              </h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory" style={{ scrollbarWidth: "none" }}>
              {grouped[typeKey].map((item: any) => (
                <div key={item.id} className="flex-none w-[80vw] sm:w-[44vw] md:w-[30vw] lg:w-[22vw] snap-start">
                  <OriginalCard item={item} />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
