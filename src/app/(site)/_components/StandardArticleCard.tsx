import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";

interface StandardArticleCardProps {
  href: string;
  title: string;
  excerpt?: string | null;
  featuredImage?: string | null;
  badgeLabel?: string | null;
  eyebrow?: string | null;
  imageOverlayTopStart?: ReactNode;
  imageOverlayTopEnd?: ReactNode;
  imageSizes?: string;
}

function PinIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function StandardArticleCard({
  href,
  title,
  excerpt,
  featuredImage,
  badgeLabel,
  eyebrow,
  imageOverlayTopStart,
  imageOverlayTopEnd,
  imageSizes = "(max-width: 768px) 68vw, 25vw",
}: StandardArticleCardProps) {
  return (
    <Link href={href} className="group block">
      <div className="aspect-[4/3] overflow-hidden mb-3 rounded-lg bg-[#e8e5de] relative">
        {featuredImage && (
          <Image
            src={featuredImage}
            alt={title}
            fill
            sizes={imageSizes}
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
        {imageOverlayTopStart && (
          <div style={{ position: "absolute", top: 8, insetInlineStart: 8 }}>{imageOverlayTopStart}</div>
        )}
        {imageOverlayTopEnd && (
          <div style={{ position: "absolute", top: 8, insetInlineEnd: 8 }}>{imageOverlayTopEnd}</div>
        )}
      </div>
      {badgeLabel && (
        <div className="mb-2">
          <span
            className="inline-flex items-center justify-center text-[10px] px-2.5 py-1 rounded-full border"
            style={{
              fontFamily: "'MVTypewriter', 'MV Boli', sans-serif",
              color: "rgb(100, 100, 100)",
              borderColor: "rgb(210, 207, 200)",
              backgroundColor: "rgb(240, 239, 233)",
              lineHeight: 1,
              transform: "translateY(-2px)",
            }}
          >
            {badgeLabel}
          </span>
        </div>
      )}
      {eyebrow && (
        <p
          className="mb-1 flex items-center gap-1"
          style={{
            fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
            fontWeight: 700,
            fontSize: "11px",
            color: "rgb(140, 138, 132)",
          }}
        >
          <PinIcon />
          {eyebrow}
        </p>
      )}
      <h3
        className="leading-none line-clamp-2"
        style={{
          fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
          fontWeight: 700,
          fontSize: "16px",
          color: "rgb(26, 26, 26)",
          lineHeight: 2,
        }}
      >
        {title}
      </h3>
      {excerpt && (
        <p
          className="mt-1.5 text-sm line-clamp-2"
          style={{
            fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
            fontWeight: 400,
            color: "rgb(100, 100, 100)",
            lineHeight: 2,
          }}
        >
          {excerpt}
        </p>
      )}
    </Link>
  );
}
