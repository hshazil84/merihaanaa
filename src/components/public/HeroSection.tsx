"use client";
// components/public/HeroSection.tsx
import Link from "next/link";
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
  useEffect(() => { setLoaded(true); }, []);
  const image = article.featured_image || article.cover_video_thumbnail;

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ height: "100svh", minHeight: "600px" }}
    >
      {/* Full bleed image — no gradient */}
      {image && (
        <div className="absolute inset-0">
          <img
            src={image}
            alt={article.title}
            className={`w-full h-full object-cover transition-opacity duration-1000 ${loaded ? "opacity-100" : "opacity-0"}`}
          />
        </div>
      )}

      {/* Mobile content — centered in viewport */}
      <div className={`
        absolute inset-0 px-6 flex flex-col items-center justify-center text-center md:hidden
        transition-all duration-700 delay-300
        ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
      `}>
        {/* Cover story pill */}
        <div className="inline-flex items-center font-body text-[10px] font-semibold tracking-widest uppercase px-3 py-1 mb-4 rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)" }}>
          ކަވަރ ސްޓޯރީ
        </div>

        {article.category && (
          <Link href={`/${article.category.slug}`}
            className="inline-flex items-center font-body text-[10px] font-semibold text-white/80 border border-white/30 rounded-full px-3 py-1 mb-4 w-fit">
            {article.category.name}
          </Link>
        )}

        <Link href={`/${article.category?.slug ?? "article"}/${article.slug}`} className="block">
          <h1 className="font-display text-2xl text-white leading-snug text-center">
            {article.title}
          </h1>
        </Link>

        {article.excerpt && (
          <p className="font-body text-sm text-white/70 leading-relaxed line-clamp-2 mt-3 text-center max-w-sm">
            {article.excerpt}
          </p>
        )}
      </div>

      {/* Desktop content — right half */}
      <div className={`
        hidden md:flex absolute top-0 bottom-0 right-0 w-1/2
        flex-col items-center justify-center px-16
        transition-all duration-700 delay-300
        ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
      `}>
        {/* Cover story pill */}
        <div className="inline-flex items-center font-body text-[10px] font-semibold tracking-widest uppercase px-3 py-1 mb-4 rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)" }}>
          ކަވަރ ސްޓޯރީ
        </div>

        {article.category && (
          <Link href={`/${article.category.slug}`}
            className="inline-flex items-center font-body text-[10px] font-semibold text-white/80 border border-white/30 rounded-full px-3 py-1 mb-6 hover:border-white/60 transition-colors backdrop-blur-sm w-fit">
            {article.category.name}
          </Link>
        )}

        <Link href={`/${article.category?.slug ?? "article"}/${article.slug}`} className="block">
          <h1 className="font-display text-4xl text-white leading-snug hover:opacity-80 transition-opacity text-center max-w-lg">
            {article.title}
          </h1>
        </Link>

        {article.excerpt && (
          <p className="font-body text-sm text-white/60 leading-relaxed line-clamp-2 mt-4 text-center max-w-md">
            {article.excerpt}
          </p>
        )}
      </div>
    </section>
  );
}
