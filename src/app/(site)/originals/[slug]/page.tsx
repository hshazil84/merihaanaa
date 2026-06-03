// src/app/(site)/originals/[slug]/page.tsx
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

const CF_CUSTOMER_CODE = "hyktj7g4xsx8p15r";

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

async function getRelated(id: string, type: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("originals")
    .select("id, title, slug, thumbnail_url, duration_seconds, type")
    .eq("status", "published")
    .neq("id", id)
    .order("published_at", { ascending: false })
    .limit(6);
  return data ?? [];
}

export default async function OriginalsWatchPage({
  params,
}: {
  params: { slug: string };
}) {
  const original = await getOriginal(params.slug);
  if (!original) notFound();

  const related = await getRelated(original.id, original.type);

  const playerUrl = original.cloudflare_stream_id
    ? `https://customer-${CF_CUSTOMER_CODE}.cloudflarestream.com/${original.cloudflare_stream_id}/iframe?preload=true&poster=${encodeURIComponent(original.thumbnail_url ?? "")}`
    : null;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Player */}
      <div className="w-full aspect-video bg-neutral-900">
        {playerUrl ? (
          <iframe
            src={playerUrl}
            className="w-full h-full"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-neutral-500 text-sm" style={{ fontFamily: "MVTypewriter, serif" }}>
              ވިޑިއޯ ލިބޭ ގޮތެއް ނެތް
            </p>
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6">
        {/* Type pill */}
        <div className="flex items-center gap-2 mb-3" dir="rtl">
          <span
            className="text-[10px] px-2.5 py-1 rounded-full bg-white/10 text-white/60 border border-white/10"
            style={{ fontFamily: "MVTypewriter, serif" }}
          >
            {TYPE_LABELS[original.type] ?? original.type}
          </span>
          {original.series && (
            <Link
              href={`/originals`}
              className="text-[10px] px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/20 hover:bg-red-500/30 transition-colors"
              style={{ fontFamily: "MVTypewriter, serif" }}
            >
              {original.series.title}
            </Link>
          )}
        </div>

        {/* Title */}
        <h1
          className="text-xl md:text-2xl font-bold leading-snug mb-2"
          style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}
        >
          {original.title}
        </h1>

        {/* Duration */}
        {original.duration_seconds && (
          <p className="text-xs text-neutral-500 mb-5" dir="ltr">
            {formatDuration(original.duration_seconds)}
          </p>
        )}

        {/* Divider */}
        <div className="h-px bg-white/10 mb-5" />

        {/* Description */}
        {original.description && (
          <>
            <p
              className="text-[10px] text-neutral-500 uppercase tracking-widest mb-3"
              style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}
            >
              ތަފްސީލް
            </p>
            <p
              className="text-sm text-neutral-300 leading-relaxed mb-6"
              style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}
            >
              {original.description}
            </p>
            <div className="h-px bg-white/10 mb-6" />
          </>
        )}

        {/* Back to originals */}
        <Link
          href="/originals"
          className="inline-flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition-colors mb-8"
          style={{ fontFamily: "MVTypewriter, serif" }}
        >
          <svg className="w-3.5 h-3.5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          ހުރިހާ ވިޑިއޯ
        </Link>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 md:px-6 pb-16">
          <div className="h-px bg-white/10 mb-6" />
          <p
            className="text-[10px] text-neutral-500 uppercase tracking-widest mb-4"
            style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}
          >
            އިތުރު ވިޑިއޯ
          </p>
          <div className="space-y-3">
            {related.map((item: any) => (
              <Link
                key={item.id}
                href={`/originals/${item.slug}`}
                className="flex items-center gap-3 group"
              >
                {/* Thumbnail */}
                <div className="w-28 aspect-video rounded-lg overflow-hidden bg-neutral-800 flex-none relative">
                  {item.thumbnail_url ? (
                    <img
                      src={item.thumbnail_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                      </svg>
                    </div>
                  )}
                  {/* Play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  {/* Duration */}
                  {item.duration_seconds && (
                    <div className="absolute bottom-1 right-1 text-[9px] bg-black/70 text-white px-1 rounded">
                      {Math.floor(item.duration_seconds / 60)}:{String(item.duration_seconds % 60).padStart(2, "0")}
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0" dir="rtl">
                  <p
                    className="text-sm font-semibold text-neutral-100 line-clamp-2 leading-snug group-hover:text-white transition-colors"
                    style={{ fontFamily: "MVTypewriter, serif" }}
                  >
                    {item.title}
                  </p>
                  <p className="text-[10px] text-neutral-500 mt-1" style={{ fontFamily: "MVTypewriter, serif" }}>
                    {TYPE_LABELS[item.type] ?? item.type}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
