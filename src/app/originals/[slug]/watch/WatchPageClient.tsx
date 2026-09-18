"use client";
// src/app/originals/[slug]/watch/page.tsx
// Note: needs to be client component for episodes panel state
// Data fetching handled via props from a server wrapper

import { useEffect, useState } from "react";
import Link from "next/link";

const CF_CUSTOMER_CODE = "hyktj7g4xsx8p15r";

interface Original {
  id: string;
  title: string;
  slug: string;
  cloudflare_stream_id: string;
  thumbnail_url: string | null;
  type: string;
  episode_number: number | null;
  season_number: number | null;
  description: string | null;
  duration_seconds: number | null;
  series: { id: string; title: string } | null;
}

interface Episode {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  episode_number: number | null;
  season_number: number | null;
}

function formatDuration(s: number | null) {
  if (!s) return null;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function EpisodesPanel({
  open,
  onClose,
  series,
  episodes,
  currentSlug,
}: {
  open: boolean;
  onClose: () => void;
  series: { id: string; title: string } | null;
  episodes: Episode[];
  currentSlug: string;
}) {
  return (
    <>
      {/* Backdrop */}
      {open && <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />}

      {/* Panel */}
      <div
        className="fixed top-0 right-0 bottom-0 z-50 w-80 bg-neutral-900 flex flex-col transition-transform duration-300 ease-in-out"
        style={{ transform: open ? "translateX(0)" : "translateX(100%)" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="text-sm font-bold text-white" dir="auto" style={{ fontFamily: "MVTypewriter, serif" }}>
            {series?.title ?? "އެޕިސޯޑްތައް"}
          </h2>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {episodes.length === 0 ? (
            <div className="p-5 text-center text-white/40 text-sm" style={{ fontFamily: "MVTypewriter, serif" }}>
              އެޕިސޯޑް ނެތް
            </div>
          ) : (
            <div className="py-2">
              {episodes.map((ep) => {
                const isCurrent = ep.slug === currentSlug;
                return (
                  <Link
                    key={ep.id}
                    href={`/originals/${ep.slug}/watch`}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                      isCurrent ? "bg-white/10" : "hover:bg-white/5"
                    }`}
                  >
                    {/* Episode number */}
                    <div className="w-6 flex-none text-center">
                      {isCurrent ? (
                        <div className="w-2 h-2 rounded-full bg-white mx-auto" />
                      ) : (
                        <span className="text-xs text-white/40 tabular-nums">
                          {ep.episode_number ?? "—"}
                        </span>
                      )}
                    </div>

                    {/* Thumbnail */}
                    <div className="w-20 aspect-video rounded-md overflow-hidden bg-neutral-800 flex-none">
                      {ep.thumbnail_url ? (
                        <img src={ep.thumbnail_url} alt={ep.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-neutral-700 flex items-center justify-center">
                          <svg className="w-4 h-4 text-neutral-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0" dir="rtl">
                      <p className={`text-xs font-semibold line-clamp-2 leading-snug ${isCurrent ? "text-white" : "text-white/80"}`}
                        dir="auto" style={{ fontFamily: "MVTypewriter, serif" }}>
                        {ep.title}
                      </p>
                      {ep.duration_seconds && (
                        <p className="text-[10px] text-white/40 mt-0.5 tabular-nums">
                          {formatDuration(ep.duration_seconds)}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function WatchPageClient({
  original,
  episodes,
}: {
  original: Original;
  episodes: Episode[];
}) {
  const [episodesOpen, setEpisodesOpen] = useState(false);
  const series = Array.isArray(original.series) ? original.series[0] : original.series;

  const episodeLabel = [
    series?.title,
    original.season_number ? `S${original.season_number}` : null,
    original.episode_number ? `E${original.episode_number}` : null,
  ].filter(Boolean).join(" · ");

  const playerUrl = `https://customer-${CF_CUSTOMER_CODE}.cloudflarestream.com/${original.cloudflare_stream_id}/iframe?autoplay=true&preload=true${original.thumbnail_url ? `&poster=${encodeURIComponent(original.thumbnail_url)}` : ""}`;

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex-none flex items-center justify-between px-4 py-3 z-30 relative">
        <Link
          href={`/originals/${original.slug}`}
          className="text-white/50 hover:text-white transition-colors p-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        {/* Title center */}
        <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
          {episodeLabel && (
            <p className="text-[10px] text-white/40 mb-0.5" dir="auto" style={{ fontFamily: "MVTypewriter, serif" }}>
              {episodeLabel}
            </p>
          )}
          <p className="text-sm font-semibold text-white line-clamp-1 max-w-xs" dir="auto" style={{ fontFamily: "MVTypewriter, serif" }}>
            {original.title}
          </p>
        </div>

        {/* Episodes button — only if has series */}
        {series && episodes.length > 0 ? (
          <button
            onClick={() => setEpisodesOpen(true)}
            className="text-white/50 hover:text-white transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>
        ) : (
          <div className="w-7" />
        )}
      </div>

      {/* Player — fills remaining space */}
      <div className="flex-1 relative">
        <iframe
          src={playerUrl}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>

      {/* Episodes panel */}
      <EpisodesPanel
        open={episodesOpen}
        onClose={() => setEpisodesOpen(false)}
        series={series}
        episodes={episodes}
        currentSlug={original.slug}
      />
    </div>
  );
}
