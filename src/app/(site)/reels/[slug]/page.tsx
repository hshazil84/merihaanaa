"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChevronUp, ChevronDown, X, Volume2, VolumeX } from "lucide-react";

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
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
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

  const sendMuteCommand = useCallback((muteState: boolean) => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage(
      JSON.stringify({ event: "muted", data: muteState }),
      "https://iframe.cloudflarestream.com"
    );
  }, []);

  const toggleMute = useCallback(() => {
    const newMuted = !muted;
    setMuted(newMuted);
    sendMuteCommand(newMuted);
  }, [muted, sendMuteCommand]);

  const handleIframeLoad = useCallback(() => {
    if (muted) sendMuteCommand(true);
  }, [muted, sendMuteCommand]);

  const goTo = useCallback((index: number) => {
    if (index < 0 || index >= reels.length || transitioning) return;
    setTransitioning(true);
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
      else if (e.key === "m" || e.key === "M") toggleMute();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentIndex, goTo, toggleMute]);

  // Touch on the transparent overlay (not the iframe)
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

  const embedUrl = `https://iframe.cloudflarestream.com/${currentReel.stream_video_id}?autoplay=true&loop=true&controls=false&preload=auto`;

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden select-none">

      {/* iframe — full screen, normal pointer events so video plays */}
      <div
        className="absolute inset-0 transition-opacity duration-200"
        style={{ opacity: transitioning ? 0 : 1 }}
      >
        <iframe
          ref={iframeRef}
          key={currentReel.id}
          src={embedUrl}
          className="w-full h-full"
          style={{ border: "none", display: "block" }}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          onLoad={handleIframeLoad}
        />
      </div>

      {/* Transparent swipe overlay — sits on top of iframe edges only,
          covers left + right strips so swipes are captured without
          blocking the center video tap-to-play area */}
      <div
        className="absolute inset-0 z-10"
        style={{ pointerEvents: "none" }}
      />

      {/* Actual swipe capture strips on left and right edges */}
      <div
        className="absolute top-0 bottom-0 left-0 w-16 z-20"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      />
      <div
        className="absolute top-0 bottom-0 right-0 w-16 z-20"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      />
      {/* Top and bottom swipe strips */}
      <div
        className="absolute top-0 left-16 right-16 h-24 z-20"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      />
      <div
        className="absolute bottom-0 left-16 right-16 h-32 z-20"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      />

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
        <button
          onClick={toggleMute}
          className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted
            ? <VolumeX size={16} className="text-white" />
            : <Volume2 size={16} className="text-white" />
          }
        </button>
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

      {/* Up / Down navigation buttons */}
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
