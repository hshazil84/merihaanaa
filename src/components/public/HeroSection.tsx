"use client";
// components/public/HeroSection.tsx
// Hero with bottom-center content (web + mobile) and legibility gradient.
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

interface HeroArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  cover_type: string | null;
  cover_video_thumbnail: string | null;
  category: { name: string; slug: string } | null;
  author: { full_name: string } | null;
}

export default function HeroSection({ article }: { article: HeroArticle }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setLoaded(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const image = article.featured_image || article.cover_video_thumbnail;

  return (
    <section
      className="relative w-full overflow-hidden bg-black h-[100svh] md:h-[calc(100svh-56px)]"
      style={{ minHeight: "560px" }}
    >
      {/* Full bleed image */}
      {image && (
        <div className="absolute inset-0 z-0">
          <Image
            src={image}
            alt={article.title}
            fill
            sizes="100vw"
            priority
            className={"object-cover transition-opacity duration-1000 " + (loaded ? "opacity-100" : "opacity-0")}
          />
        </div>
      )}

      {/* Bottom gradient for text legibility */}
      <div
        className="absolute inset-x-0 bottom-0 z-[5] pointer-events-none"
        style={{
          height: "55%",
          background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.3) 45%, transparent 100%)",
        }}
      />

      {/* Bottom-center content — web and mobile */}
      <div
        className={"absolute inset-x-0 bottom-0 z-10 px-6 pb-12 md:pb-16 flex flex-col items-center text-center transition-all duration-700 delay-300 " +
          (loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}
      >
        <div
          className="inline-flex items-center font-body text-[10px] font-semibold tracking-widest uppercase px-3 py-1 mb-4 rounded-full"
          style={{ color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.45)" }}
        >
          ކަވަރ ސްޓޯރީ
        </div>
        <Link href={"/" + (article.category?.slug ?? "article") + "/" + article.slug} className="block">
          <h1
            className="font-display text-white hover:opacity-80 transition-opacity text-center max-w-3xl"
            style={{ fontSize: "clamp(1.7rem, 3.5vw, 2.6rem)", lineHeight: 1.2 }}
          >
            {article.title}
          </h1>
        </Link>
        {article.excerpt && (
          <p
            className="font-body text-white/70 leading-relaxed line-clamp-2 mt-3 text-center max-w-xl"
            style={{ fontSize: "0.95rem" }}
          >
            {article.excerpt}
          </p>
        )}
      </div>
    </section>
  );
}
