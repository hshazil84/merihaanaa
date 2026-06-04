"use client";
import Link from "next/link";

interface Original {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  type: string;
}

interface OriginalsStripProps {
  originals: Original[];
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const TYPE_LABELS: Record<string, string> = {
  documentary: "ޑޮކިއުމެންޓްރީ",
  profile:     "ޕްރޮފައިލް",
  episode:     "އެޕިސޯޑް",
  segment:     "ސެގްމެންޓް",
  interview:   "އިންޓަވިއު",
  short:       "ޝޯޓް",
};

export default function OriginalsStrip({ originals }: OriginalsStripProps) {
  if (!originals || originals.length === 0) return null;

  return (
    <section className="bg-black py-10 md:py-14">
      <div className="max-w-screen-xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="block w-1 h-6 bg-red-500 rounded-full" />
            <h2 className="text-white text-xl md:text-2xl font-bold tracking-wide" style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}>
              އޮރިޖިނަލްސް
            </h2>
          </div>
          <Link
            href="/originals"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-neutral-400 hover:text-white transition-colors flex items-center gap-1"
            style={{ fontFamily: "MVTypewriter, serif" }}
          >
            ހުރިހާ ވިޑިއޯ
            <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Strip */}
        <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {originals.map((original) => (
            <div
              key={original.id}
              className="group flex-none w-[72vw] sm:w-[46vw] md:w-[calc(40%-12px)] snap-start relative"
            >
              <Link
                href={`/originals/${original.slug}/watch`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="relative aspect-video rounded-lg overflow-hidden bg-neutral-900">
                  {original.thumbnail_url ? (
                    <img src={original.thumbnail_url} alt={original.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                      <svg className="w-10 h-10 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  {/* Play button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center transition-all duration-200 group-hover:bg-white/30 group-hover:scale-110">
                      <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                  </div>
                  {/* Info button */}
                  <Link
                    href={`/originals/${original.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </Link>
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white text-sm font-semibold line-clamp-2 leading-snug mb-1" style={{ direction: "rtl", fontFamily: "MVTypewriter, serif" }}>
                      {original.title}
                    </p>
                    <div className="flex items-center gap-2">
                      {original.type && (
                        <span className="text-[10px] text-neutral-300 bg-white/10 px-1.5 py-0.5 rounded" style={{ direction: "rtl", fontFamily: "MVTypewriter, serif" }}>
                          {TYPE_LABELS[original.type] ?? original.type}
                        </span>
                      )}
                      {original.duration_seconds && (
                        <span className="text-[10px] text-neutral-400">{formatDuration(original.duration_seconds)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
