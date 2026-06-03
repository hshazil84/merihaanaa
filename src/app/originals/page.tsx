// src/app/originals/page.tsx
import { createServerSupabaseClient } from "@/lib/supabase/server";
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

function formatDuration(s: number | null) {
  if (!s) return null;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

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

function OriginalCard({ item }: { item: any }) {
  return (
    <Link href={`/originals/${item.slug}`} className="group block flex-none">
      <div className="relative aspect-video rounded-xl overflow-hidden bg-neutral-900">
        {item.thumbnail_url ? (
          <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
            <svg className="w-10 h-10 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          </div>
        </div>
        {item.duration_seconds && (
          <div className="absolute bottom-2 left-2 text-[10px] text-white bg-black/60 px-1.5 py-0.5 rounded tabular-nums">
            {formatDuration(item.duration_seconds)}
          </div>
        )}
        <div className="absolute bottom-2 right-2">
          <span className="text-[10px] text-neutral-300 bg-white/10 backdrop-blur-sm px-1.5 py-0.5 rounded" style={{ fontFamily: "MVTypewriter, serif" }}>
            {TYPE_LABELS[item.type] ?? item.type}
          </span>
        </div>
      </div>
      <p className="mt-2 text-sm font-semibold text-neutral-100 line-clamp-2 leading-snug group-hover:text-white transition-colors" style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}>
        {item.title}
      </p>
      {item.series && (
        <p className="text-xs text-neutral-500 mt-0.5" style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}>{item.series.title}</p>
      )}
    </Link>
  );
}

export default async function OriginalsPage() {
  const { featured, grouped } = await getOriginalsData();
  const hasContent = featured || Object.keys(grouped).length > 0;

  return (
    <div className="pt-20 pb-16">
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
            <span className="inline-block text-xs px-2.5 py-1 rounded-full bg-white/10 text-white/70 mb-3 border border-white/10" style={{ fontFamily: "MVTypewriter, serif" }}>
              {TYPE_LABELS[featured.type] ?? featured.type}
            </span>
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-3 max-w-2xl leading-snug" style={{ fontFamily: "MVTypewriter, serif" }}>
              {featured.title}
            </h1>
            {featured.description && (
              <p className="text-sm md:text-base text-neutral-300 max-w-xl line-clamp-2 mb-5" style={{ fontFamily: "MVTypewriter, serif" }}>
                {featured.description}
              </p>
            )}
            <Link href={`/originals/${featured.slug}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-black text-sm font-semibold hover:bg-neutral-200 transition-colors"
              style={{ fontFamily: "MVTypewriter, serif" }}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              ބަލާ
            </Link>
          </div>
        </div>
      )}
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
