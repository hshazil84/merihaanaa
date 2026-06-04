"use client";
// src/app/(site)/reels/[slug]/page.tsx

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const CF_CUSTOMER_CODE = "hyktj7g4xsx8p15r";

interface Reel {
  id: string;
  title: string;
  slug: string;
  stream_video_id: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  category: { name: string; slug: string } | null;
}

export default function ReelWatchPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [reels, setReels] = useState<Reel[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(true);
  const touchStartY = useRef<number>(0);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("reels")
        .select("id, title, slug, stream_video_id, thumbnail_url, duration_seconds, category:categories!category_id(name, slug)")
        .eq("status", "published")
        .eq("homepage_featured", true)
        .order("published_at", { ascending: false });
      const all = data ?? [];
      setReels(all);
      const idx = all.findIndex((r: Reel) => r.slug === params.slug);
      setCurrentIndex(idx >= 0 ? idx : 0);
      setLoading(false);
    }
    load();
  }, []);

  const goTo = useCallback((index: number) => {
    if (index < 0 || index >= reels.length) return;
    setCurrentIndex(index);
    router.replace(`/reels/${reels[index].slug}`, { scroll: false });
  }, [reels, router]);

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goTo(currentIndex + 1);
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goTo(currentIndex - 1);
      if (e.key === "Escape") router.push("/");
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentIndex, goTo, router]);

  // Touch swipe
  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    const diff = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goTo(currentIndex + 1);
      else goTo(currentIndex - 1);
    }
  }

  const current = reels[currentIndex];

  const playerUrl = current
    ? `https://customer-${CF_CUSTOMER_CODE}.cloudflarestream.com/${current.stream_video_id}/iframe?autoplay=true&muted=${muted ? "true" : "false"}&loop=true&preload=true${current.thumbnail_url ? `&poster=${encodeURIComponent(current.thumbnail_url)}` : ""}`
    : null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 bg-black flex items-center justify-center"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Back button */}
      <Link
        href="/"
        className="absolute top-4 left-4 z-30 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </Link>

      {/* Mute button */}
      <button
        onClick={() => setMuted(!muted)}
        className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white transition-colors"
      >
        {muted ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0 0l-4-4m4 4l4-4M9 9H5a1 1 0 00-1 1v4a1 1 0 001 1h4l5 5V4L9 9z" />
          </svg>
        )}
      </button>

      {/* Prev arrow — desktop */}
      {currentIndex > 0 && (
        <button
          onClick={() => goTo(currentIndex - 1)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white transition-colors hidden md:flex"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Next arrow — desktop */}
      {currentIndex < reels.length - 1 && (
        <button
          onClick={() => goTo(currentIndex + 1)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white transition-colors hidden md:flex"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* 9:16 player container */}
      <div className="relative h-full md:h-[90vh] aspect-[9/16] bg-neutral-950 overflow-hidden rounded-none md:rounded-2xl">
        {playerUrl && (
          <iframe
            key={current.id}
            src={playerUrl}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        )}

        {/* Lower-third overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none">
          {current.category && (
            <span
              className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60 border border-white/10 mb-2"
              style={{ fontFamily: "MVTypewriter, serif" }}
            >
              {current.category.name}
            </span>
          )}
          <p
            className="text-white text-sm font-semibold leading-snug line-clamp-2"
            style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}
          >
            {current.title}
          </p>
        </div>

        {/* Reel counter */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1">
          {reels.slice(0, 8).map((_, i) => (
            <div
              key={i}
              className={`h-0.5 rounded-full transition-all ${
                i === currentIndex ? "w-4 bg-white" : "w-1.5 bg-white/30"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Mobile swipe hint — shown briefly */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 md:hidden pointer-events-none">
        {currentIndex < reels.length - 1 && (
          <div className="flex flex-col items-center gap-1 text-white/30 animate-bounce">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
