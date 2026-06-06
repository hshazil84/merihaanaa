"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChevronUp, ChevronDown, X, Play } from "lucide-react";

interface Reel {
  id: string;
  title: string;
  slug: string;
  stream_video_id: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  category: { name: string; slug: string } | null;
}

function formatDuration(secs: number | null) {
  if (!secs) return "";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ReelPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const slug = params.slug as string;

  const [reels, setReels] = useState<Reel[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [played, setPlayed] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const videoContainerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("reels")
        .select("id, title, slug, stream_video_id, thumbnail_url, duration_seconds, category:categories!category_id(name, slug)")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(50);

      if (!data) return;
      setReels(data as unknown as Reel[]);
      const idx = data.findIndex((r: any) => r.slug === slug);
      setCurrentIndex(idx >= 0 ? idx : 0);
      setLoading(false);
    }
    load();
  }, [slug]);

  const currentReel = reels[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < reels.length - 1;

  // Inject iframe directly in click handler — preserves user gesture for sound
  const handlePlay = useCallback(() => {
    const container = videoContainerRef.current;
    const reel = reels[currentIndex];
    if (!container || !reel) return;

    const posterParam = reel.thumbnail_url
      ? `&poster=${encodeURIComponent(reel.thumbnail_url)}`
      : "";

    const iframe = document.createElement("iframe");
    iframe.src = `https://iframe.cloudflarestream.com/${reel.stream_video_id}?autoplay=true&muted=false&loop=true&controls=false${posterParam}`;
    iframe.style.cssText = "position:absolute;inset:0;width:100%;height:100%;border:none;display:block;";
    iframe.allow = "autoplay; fullscreen; picture-in-picture";
    iframe.allowFullscreen = true;

    container.innerHTML = "";
    container.appendChild(iframe);
    setPlayed(true);
  }, [reels, currentIndex]);

  const goTo = useCallback((index: number) => {
    if (index < 0 || index >= reels.length || transitioning) return;
    setTransitioning(true);
    setPlayed(false);
    // Clear iframe immediately
    if (videoContainerRef.current) videoContainerRef.current.innerHTML = "";
    setTimeout(() => {
      setCurrentIndex(index);
      const newSlug = reels[index]?.slug;
      if (newSlug) window.history.replaceState(null, "", `/reels/${newSlug}`);
      setTransitioning(false);
    }, 180);
  }, [reels, transitioning]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") goTo(currentIndex - 1);
      else if (e.key === "ArrowDown") goTo(currentIndex + 1);
      else if (e.key === "Escape") router.back();
      else if (e.key === " " || e.key === "Enter") handlePlay();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentIndex, goTo, handlePlay]);

  // Touch swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;
    const deltaX = Math.abs((touchStartX.current ?? 0) - e.changedTouches[0].clientX);
    if (Math.abs(deltaY) > 60 && Math.abs(deltaY) > deltaX * 1.5) {
      if (deltaY > 0) goTo(currentIndex + 1);
      else goTo(currentIndex - 1);
    }
    touchStartY.current = null;
    touchStartX.current = null;
  }, [currentIndex, goTo]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentReel) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <p className="text-white/60 text-sm" style={{ fontFamily: "MVTypewriter, serif" }}>
          ވީޑިއޯ ނުލިބުނު
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden select-none">

      {/* Video container — thumbnail + click to play, then iframe injected here */}
      <div
        ref={videoContainerRef}
        className="absolute inset-0 transition-opacity duration-200"
        style={{ opacity: transitioning ? 0 : 1 }}
      >
        {/* Thumbnail shown until user clicks play */}
        {currentReel.thumbnail_url && (
          <img
            src={currentReel.thumbnail_url}
            alt={currentReel.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
      </div>

      {/* Click to play overlay — full screen tap area */}
      {!played && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer"
          onClick={handlePlay}
          onTouchStart={handleTouchStart}
          onTouchEnd={(e) => {
            // If it was a tap (not a swipe), play
            if (touchStartY.current !== null) {
              const deltaY = Math.abs(touchStartY.current - e.changedTouches[0].clientY);
              const deltaX = Math.abs((touchStartX.current ?? 0) - e.changedTouches[0].clientX);
              if (deltaY < 10 && deltaX < 10) {
                handlePlay();
                return;
              }
            }
            handleTouchEnd(e);
          }}
        >
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
            <Play size={28} className="text-white ml-1" fill="white" />
          </div>
        </div>
      )}

      {/* Swipe strips when video is playing */}
      {played && (
        <>
          <div className="absolute top-0 bottom-0 left-0 w-16 z-20" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} />
          <div className="absolute top-0 bottom-0 right-0 w-16 z-20" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} />
          <div className="absolute top-0 left-16 right-16 h-24 z-20" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} />
          <div className="absolute bottom-0 left-16 right-16 h-32 z-20" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} />
        </>
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0 pointer-events-none z-20">
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-black/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-56 bg-gradient-to-t from-black/80 to-transparent" />
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4 z-30">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm"
          aria-label="Close"
        >
          <X size={18} className="text-white" />
        </button>
        <p className="text-white/60 text-xs" style={{ fontFamily: "MVTypewriter, serif" }}>
          {currentIndex + 1} / {reels.length}
        </p>
        <div className="w-9 h-9" />
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-10 z-30" dir="rtl">
        {currentReel.category && (
          <span
            className="inline-block text-[10px] px-2.5 py-1 rounded-full bg-white/15 text-white/80 mb-2 backdrop-blur-sm"
            style={{ fontFamily: "MVTypewriter, serif" }}
          >
            {currentReel.category.name}
          </span>
        )}
        <h1
          className="text-white text-base font-semibold leading-snug line-clamp-2 mb-1"
          style={{ fontFamily: "MVTypewriter, serif" }}
        >
          {currentReel.title}
        </h1>
        {currentReel.duration_seconds && (
          <p className="text-white/40 text-xs" style={{ fontFamily: "MVTypewriter, serif" }}>
            {formatDuration(currentReel.duration_seconds)}
          </p>
        )}
      </div>

      {/* Up / Down navigation */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-30">
        <button
          onClick={() => goTo(currentIndex - 1)}
          disabled={!hasPrev}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center disabled:opacity-20 transition-all hover:bg-black/60 active:scale-95"
          aria-label="Previous reel"
        >
          <ChevronUp size={20} className="text-white" />
        </button>
        <button
          onClick={() => goTo(currentIndex + 1)}
          disabled={!hasNext}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center disabled:opacity-20 transition-all hover:bg-black/60 active:scale-95"
          aria-label="Next reel"
        >
          <ChevronDown size={20} className="text-white" />
        </button>
      </div>

      {/* Progress dots */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-30">
        {reels
          .slice(Math.max(0, currentIndex - 3), Math.min(reels.length, currentIndex + 4))
          .map((r, i) => {
            const actualIndex = Math.max(0, currentIndex - 3) + i;
            const isActive = actualIndex === currentIndex;
            return (
              <button
                key={r.id}
                onClick={() => goTo(actualIndex)}
                className="rounded-full transition-all"
                style={{
                  width: isActive ? "6px" : "4px",
                  height: isActive ? "6px" : "4px",
                  background: isActive ? "white" : "rgba(255,255,255,0.35)",
                }}
                aria-label={`Go to reel ${actualIndex + 1}`}
              />
            );
          })}
      </div>
    </div>
  );
}
