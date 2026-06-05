import Link from "next/link";
import { formatDhivehiDate } from "../utils/formatDhivehiDate";

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
        className="relative transition-all duration-500 group-hover:scale-[1.02] group-hover:-translate-y-1"
        style={{
          aspectRatio: "2/3",
          borderRadius: "3px 5px 5px 3px",
          backgroundImage: coverImage
            ? `linear-gradient(to left, rgb(40, 10, 15) 3px, rgba(255,255,255,0.4) 5px, rgba(255,255,255,0.2) 7px, rgba(255,255,255,0.2) 10px, transparent 12px, transparent 16px, rgba(255,255,255,0.2) 17px, transparent 22px), url(${coverImage})`
            : `linear-gradient(to left, rgb(40, 10, 15) 3px, rgba(255,255,255,0.4) 5px, rgba(255,255,255,0.2) 7px, rgba(255,255,255,0.2) 10px, transparent 12px, transparent 16px, rgba(255,255,255,0.2) 17px, transparent 22px), linear-gradient(160deg, rgb(220,205,165), rgb(195,175,120))`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          boxShadow: "0 0 6px -1px rgba(0,0,0,0.5), inset 1px 1px 2px rgba(255,255,255,0.4)",
        }}
      >
        {/* Parchment fallback content — only shown when no image */}
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
              fontWeight: 700,
              fontSize: "13px",
              color: "rgb(60,45,20)",
              lineHeight: 2,
              textAlign: "center",
              opacity: 0.8,
            }}>
              {article.title}
            </p>
          </div>
        )}

        {/* Hover overlay */}
        <div
          className="absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
          style={{
            background: "linear-gradient(to top, rgba(40,28,8,0.75) 0%, transparent 55%)",
            borderRadius: "inherit",
          }}
        >
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p style={{
              fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
              fontSize: "11px",
              color: "rgb(240,230,200)",
              lineHeight: 1.8,
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
            borderRadius: "4px",
            padding: "2px 8px",
          }}>
            <span style={{
              fontFamily: '"MVTypewriter", sans-serif',
              fontSize: "9px",
              color: "rgb(100,80,30)",
              lineHeight: 2,
            }}>
              {formatDhivehiDate(article.published_at)}
            </span>
          </div>
        )}
      </div>

      {/* Below cover: title + meta */}
      <div className="mt-3 px-1">
        <h3 className="line-clamp-2 group-hover:opacity-60 transition-opacity" style={{
          fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
          fontWeight: 700,
          fontSize: "13px",
          color: "rgb(50,35,10)",
          lineHeight: 2,
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
