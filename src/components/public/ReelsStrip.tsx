// src/components/public/ReelsStrip.tsx
import Link from "next/link";

interface Reel {
  id: string;
  title: string;
  slug: string;
  stream_video_id: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  category: { name: string; slug: string } | null;
}

interface ReelsStripProps {
  reels: Reel[];
}

function formatDuration(s: number | null) {
  if (!s) return null;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function ReelsStrip({ reels }: ReelsStripProps) {
  if (!reels || reels.length === 0) return null;

  return (
    <section className="py-10 md:py-14 bg-[#F5F3EF]">
      <div className="max-w-screen-xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6" dir="rtl">
          <div className="flex items-center gap-3">
            <span className="block w-1 h-6 bg-neutral-900 rounded-full" />
            <h2
              className="text-xl md:text-2xl font-bold tracking-wide text-neutral-900"
              style={{ fontFamily: "MVTypewriter, serif" }}
            >
              ރީލްސް
            </h2>
          </div>
          <Link
            href={`/reels/${reels[0].slug}`}
            className="text-sm text-neutral-400 hover:text-neutral-900 transition-colors flex items-center gap-1"
            style={{ fontFamily: "MVTypewriter, serif" }}
          >
            ހުރިހާ ރީލް
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        </div>

        {/* Horizontal scroll strip */}
        <div
          className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory md:justify-center"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {reels.map((reel) => (
            <Link
              key={reel.id}
              href={`/reels/${reel.slug}`}
              className="group flex-none w-[42vw] sm:w-[28vw] md:w-[16vw] snap-start"
            >
              {/* 9:16 thumbnail */}
              <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-neutral-200">
                {reel.thumbnail_url ? (
                  <img
                    src={reel.thumbnail_url}
                    alt={reel.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-neutral-300 flex items-center justify-center">
                    <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                    </svg>
                  </div>
                )}

                {/* Gradient + overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                {/* Play button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>

                {/* Duration */}
                {reel.duration_seconds && (
                  <div className="absolute top-2 left-2 text-[10px] text-white bg-black/60 px-1.5 py-0.5 rounded tabular-nums">
                    {formatDuration(reel.duration_seconds)}
                  </div>
                )}

                {/* Bottom overlay — title + category */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  {reel.category && (
                    <span
                      className="inline-block text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/60 border border-white/10 mb-1"
                      style={{ fontFamily: "MVTypewriter, serif" }}
                    >
                      {reel.category.name}
                    </span>
                  )}
                  <p
                    className="text-white text-xs font-semibold line-clamp-2 leading-snug"
                    style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}
                  >
                    {reel.title}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
