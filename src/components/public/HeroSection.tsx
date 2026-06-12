"use client";
// components/public/HeroSection.tsx
// Height = 100svh minus the in-flow CategoryBar (56px) below it,
// so hero + category bar exactly fill the first viewport.
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

  const coverPill = (
    <div
      className="inline-flex items-center font-body text-[10px] font-semibold tracking-widest uppercase px-3 py-1 mb-4 rounded-full"
      style={{ color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.45)" }}
    >
      ކަވަރ ސްޓޯރީ
    </div>
  );

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

      {/* Mobile — centered */}
      <div
        className={"absolute inset-0 z-10 px-6 flex flex-col items-center justify-center text-center md:hidden transition-all duration-700 delay-300 " +
          (loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}
      >
        {coverPill}
        <Link href={"/" + (article.category?.slug ?? "article") + "/" + article.slug} className="block">
          <h1
            className="font-display text-white leading-snug text-center"
            style={{ fontSize: "clamp(1.9rem, 5vw, 2.2rem)" }}
          >
            {article.title}
          </h1>
        </Link>
        {article.excerpt && (
          <p
            className="font-body text-white/70 leading-relaxed line-clamp-2 mt-3 text-center max-w-sm"
            style={{ fontSize: "0.96rem" }}
          >
            {article.excerpt}
          </p>
        )}
      </div>

      {/* Desktop — right half */}
      <div
        className={"hidden md:flex absolute top-0 bottom-0 right-0 z-10 w-1/2 flex-col items-center justify-center px-16 transition-all duration-700 delay-300 " +
          (loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}
      >
        {coverPill}
        <Link href={"/" + (article.category?.slug ?? "article") + "/" + article.slug} className="block">
          <h1
            className="font-display text-white leading-snug hover:opacity-80 transition-opacity text-center max-w-lg"
            style={{ fontSize: "clamp(2.2rem, 3.5vw, 2.75rem)", lineHeight: 1.2 }}
          >
            {article.title}
          </h1>
        </Link>
        {article.excerpt && (
          <p
            className="font-body text-white/60 leading-relaxed line-clamp-2 mt-4 text-center max-w-md"
            style={{ fontSize: "0.935rem" }}
          >
            {article.excerpt}
          </p>
        )}
      </div>
    </section>
  );
}
