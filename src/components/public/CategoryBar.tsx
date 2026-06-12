"use client";
// components/public/CategoryBar.tsx
// In-flow category bar that sticks to the top once reached (New Yorker pattern).
// A sentinel above it tells us when it's stuck; logo + search fade in only then.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

interface Category { id: string; name: string; slug: string; }

export default function CategoryBar({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* 1px sentinel right above the bar — when it leaves the viewport, the bar is stuck */}
      <div ref={sentinelRef} style={{ height: "1px" }} />
      <nav
        aria-label="ކެޓަގަރީތައް"
        className="sticky top-0 z-40"
        style={{
          backgroundColor: "rgb(249,248,245)",
          borderBottom: "1px solid rgb(224,221,214)",
          height: "56px",
        }}
      >
        <div className="max-w-7xl mx-auto px-5 md:px-6 h-full flex items-center" dir="rtl">

          {/* Logo — fades in only when stuck */}
          <Link
            href="/"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className="flex items-center flex-shrink-0"
            style={{
              opacity: stuck ? 1 : 0,
              pointerEvents: stuck ? "auto" : "none",
              transition: "opacity 0.25s ease",
              marginLeft: "12px",
            }}
          >
            <Image src="/logo.svg" alt="މެރިހާނާ" width={32} height={32} className="object-contain" />
          </Link>

          {/* Categories — always visible, centered */}
          <div
            className="flex items-center justify-start md:justify-center gap-1 h-full overflow-x-auto no-scrollbar flex-1"
            style={{ scrollbarWidth: "none" }}
          >
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={"/" + cat.slug}
                target={cat.slug === "originals" ? "_blank" : undefined}
                rel={cat.slug === "originals" ? "noopener noreferrer" : undefined}
                className="whitespace-nowrap px-4 py-2 transition-colors hover:text-[rgb(26,26,26)]"
                style={{
                  fontFamily: "'MVTypewriter','MV Boli',sans-serif",
                  fontSize: "13px",
                  color: "rgb(153,153,153)",
                }}
              >
                {cat.name}
              </Link>
            ))}
          </div>

          {/* Search — fades in only when stuck */}
          <button
            type="button"
            aria-label="ހޯދާ"
            onClick={() => router.push("/search")}
            className="p-2 rounded-full hover:bg-black/5 transition-colors flex-shrink-0"
            style={{
              color: "rgb(26,26,26)",
              opacity: stuck ? 1 : 0,
              pointerEvents: stuck ? "auto" : "none",
              transition: "opacity 0.25s ease",
              marginRight: "12px",
            }}
          >
            <Search className="w-[16px] h-[16px]" />
          </button>

        </div>
      </nav>
    </>
  );
}
