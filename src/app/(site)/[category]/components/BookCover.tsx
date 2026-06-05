"use client";
import Link from "next/link";
import { formatDhivehiDate } from "@/lib/formatDhivehiDate";

interface BookCoverProps {
  article: {
    id: string;
    title: string;
    slug: string;
    cover_portrait_url?: string | null;
    featured_image?: string | null;
    published_at?: string | null;
    author?: { full_name: string } | null;
    reading_time_minutes?: number | null;
  };
  categorySlug: string;
}

export function BookCover({ article, categorySlug }: BookCoverProps) {
  const coverImage = article.cover_portrait_url || article.featured_image;

  return (
    <Link href={`/${categorySlug}/${article.slug}`} className="group block">
      <div
        className="relative transition-transform duration-100 ease-out group-hover:-translate-y-1 group-hover:scale-[1.03]"
        style={{
          aspectRatio: "3/4",
          borderRadius: "6px 2px 2px 6px",
          backgroundImage: coverImage
            ? `url(${coverImage})`
            : `linear-gradient(160deg, rgb(220,205,165), rgb(195,175,120))`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          boxShadow: [
            "inset 1px 1px 0 1px rgba(255,255,255,0.2)",
            "inset 0 0 0 1px rgba(0,0,0,0.1)",
            "4px 2px 4px 0 rgba(0,0,0,0.3)",
            "8px 8px 20px 0 rgba(0,0,0,0.2)",
          ].join(", "),
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = [
            "inset 1px 1px 0 1px rgba(255,255,255,0.2)",
            "inset 0 0 0 1px rgba(0,0,0,0.1)",
            "4px 4px 8px 0 rgba(0,0,0,0.3)",
            "12px 16px 30px 0 rgba(0,0,0,0.3)",
          ].join(", ");
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = [
            "inset 1px 1px 0 1px rgba(255,255,255,0.2)",
            "inset 0 0 0 1px rgba(0,0,0,0.1)",
            "4px 2px 4px 0 rgba(0,0,0,0.3)",
            "8px 8px 20px 0 rgba(0,0,0,0.2)",
          ].join(", ");
        }}
      >
        {/* Spine overlay — RTL, binding on right */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            backgroundImage: "linear-gradient(to left, rgba(0,0,0,0.2), rgba(255,255,255,0.3) 1%, transparent 6%, rgba(0,0,0,0.15) 8%, rgba(255,255,255,0.2) 9%, transparent 20%)",
            pointerEvents: "none",
          }}
        />

        {/* Parchment fallback */}
        {!coverImage && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "20px",
          }}>
            <span style={{ fontSize: "28px", marginBottom: "12px", opacity: 0.4 }}>📖</span>
            <p style={{
              fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
              fontWeight: 700, fontSize: "13px",
              color: "rgb(60,45,20)", lineHeight: 2,
              textAlign: "center", opacity: 0.8,
            }}>
              {article.title}
            </p>
          </div>
        )}

        {/* Hover read overlay */}
        <div
          className="absolute inset-0 transition-opacity duration-200 opacity-0 group-hover:opacity-100"
          style={{
            background: "linear-gradient(to top, rgba(40,28,8,0.75) 0%, transparent 55%)",
            borderRadius: "inherit",
            pointerEvents: "none",
          }}
        >
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p style={{
              fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
              fontSize: "11px", color: "rgb(240,230,200)", lineHeight: 1.8,
            }}>
              ކިޔާލާ →
            </p>
          </div>
        </div>

        {/* Date badge */}
        {article.published_at && (
          <div style={{
            position: "absolute", top: "10px", left: "10px",
            backgroundColor: "rgba(240,234,210,0.92)",
            borderRadius: "4px", padding: "2px 8px",
          }}>
            <span style={{
              fontFamily: '"MVTypewriter", sans-serif',
              fontSize: "9px", color: "rgb(100,80,30)", lineHeight: 2,
            }}>
              {formatDhivehiDate(article.published_at)}
            </span>
          </div>
        )}
      </div>

      {/* Below cover */}
      <div className="mt-3 px-1">
        <h3 className="line-clamp-2 group-hover:opacity-60 transition-opacity" style={{
          fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
          fontWeight: 700, fontSize: "13px",
          color: "rgb(50,35,10)", lineHeight: 2,
        }}>
          {article.title}
        </h3>
        <div className="flex items-center gap-2 mt-0.5">
          {article.author?.full_name && (
            <span style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "10px", color: "rgb(140,115,65)", lineHeight: 2 }}>
              {article.author.full_name}
            </span>
          )}
          {article.reading_time_minutes && (
            <span style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "10px", color: "rgb(160,135,85)", lineHeight: 2 }}>
              · {article.reading_time_minutes} މިނެޓު
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
