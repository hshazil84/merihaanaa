"use client";
// components/public/ReelsStrip.tsx
// 4 vertical 9:16 reel cards — play on hover via Cloudflare Stream iframe
// Horizontal scroll on mobile, 4-col grid on desktop

import { useRef, useState } from "react";
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

function formatDuration(seconds: number | null) {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function ReelCard({ reel }: { reel: Reel }) {
  const [hovered, setHovered] = useState(false);
  
  const streamEmbedUrl = `https://customer-hyktj7g4xsx8p15r.cloudflarestream.com/${reel.stream_video_id}/iframe?autoplay=true&muted=true&loop=true&controls=false&preload=none`;

  return (
    <div
      className="group relative flex-shrink-0 w-[38vw] md:w-auto"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link href={`/watch/${reel.slug}`} className="block">
        <div className="aspect-[9/16] overflow-hidden rounded-xl bg-[#1a1a1a] relative">

          {/* Thumbnail — shown by default */}
          {reel.thumbnail_url && (
            <img
              src={reel.thumbnail_url}
              alt={reel.title}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                hovered ? "opacity-0" : "opacity-100"
              }`}
            />
          )}

          {/* Cloudflare Stream iframe — loads on hover */}
          {hovered && (
            <iframe
              src={streamEmbedUrl}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
              allowFullScreen={false}
              style={{ border: "none" }}
            />
          )}

          {/* Play icon — shown when not hovered */}
          {!hovered && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg className="w-4 h-4 text-white fill-white ml-0.5" viewBox="0 0 24 24">
                  <polygon points="6,3 20,12 6,21" />
                </svg>
              </div>
            </div>
          )}

          {/* Bottom gradient + duration */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 via-transparent to-transparent p-3 pointer-events-none">
            {reel.duration_seconds && (
              <p className="font-body text-[10px] text-white/70 mb-1" dir="ltr">
                {formatDuration(reel.duration_seconds)}
              </p>
            )}
          </div>
        </div>

        {/* Title */}
        <p
          className="mt-2 text-sm line-clamp-2 leading-snug"
          style={{
            fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
            fontWeight: 400,
            color: "rgb(26, 26, 26)",
          }}
        >
          {reel.title}
        </p>

        {/* Category */}
        {reel.category && (
          <p
            className="text-[11px] mt-0.5"
            style={{
              fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
              color: "rgb(153, 153, 153)",
            }}
          >
            {reel.category.name}
          </p>
        )}
      </Link>
    </div>
  );
}

export default function ReelsStrip({ reels }: { reels: Reel[] }) {
  if (!reels?.length) return null;

  return (
    <section className="py-12" dir="rtl">
      <div className="max-w-7xl mx-auto px-6">

        {/* Section title */}
        <h2
          className="mb-8"
          style={{
            fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
            fontWeight: 400,
            fontSize: "30px",
            color: "rgb(26, 26, 26)",
            lineHeight: 1.5,
          }}
        >
          ވީޑިއޯ
        </h2>

        {/* Mobile: horizontal scroll | Desktop: 4-col grid */}
        <div
          className="flex gap-4 overflow-x-auto pb-2 md:pb-0 md:grid md:grid-cols-4 md:gap-6 md:overflow-visible no-scrollbar"
          style={{ scrollbarWidth: "none" }}
        >
          {reels.slice(0, 4).map((reel) => (
            <ReelCard key={reel.id} reel={reel} />
          ))}
        </div>

      </div>
    </section>
  );
}