"use client";
import Link from "next/link";
import Image from "next/image";
import { formatDhivehiDate } from "@/lib/formatDhivehiDate";

interface BookReviewCardProps {
  article: {
    id: string;
    title: string;
    slug: string;
    featured_image?: string | null;
    review_score?: number | null;
    review_subject?: string | null;
    excerpt?: string | null;
    published_at?: string | null;
    reading_time_minutes?: number | null;
  };
  categorySlug: string;
}

export function BookReviewCard({ article, categorySlug }: BookReviewCardProps) {
  return (
    <Link href={"/" + categorySlug + "/" + article.slug} className="group block">
      <div
        className="relative transition-transform duration-100 ease-out group-hover:-translate-y-1"
        style={{
          aspectRatio: "4/3",
          borderRadius: "8px",
          overflow: "hidden",
          background: "rgb(220,215,200)",
          boxShadow: "0 2px 6px 0 rgba(0,0,0,0.15)",
        }}
      >
        {article.featured_image ? (
          <Image
            src={article.featured_image}
            alt={article.title}
            fill
            sizes="(max-width: 768px) 45vw, 200px"
            className="object-cover"
          />
        ) : (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: "24px", opacity: 0.35 }}>{"📚"}</span>
          </div>
        )}

        {article.review_score != null && (
          <div
            className="absolute top-2 left-2 flex flex-col items-center justify-center rounded-lg"
            style={{
              width: "34px", height: "34px",
              backgroundColor: "rgba(26,26,26,0.85)", color: "rgb(249,248,245)",
              zIndex: 2,
            }}
          >
            <span style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "12px", fontWeight: 700, lineHeight: 1 }}>
              {article.review_score}
            </span>
            <span style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "7px", color: "rgb(200,198,192)", lineHeight: 1.2 }}>
              /5
            </span>
          </div>
        )}

        <div
          className="absolute inset-0 transition-opacity duration-200 opacity-0 group-hover:opacity-100"
          style={{
            background: "linear-gradient(to top, rgba(40,28,8,0.65) 0%, transparent 55%)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      </div>

      <div className="mt-3 px-1">
        {article.review_subject && (
          <p style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontSize: "10px", color: "rgb(140,115,65)", lineHeight: 1.8, marginBottom: "2px" }}>
            {article.review_subject}
          </p>
        )}
        <h3 className="line-clamp-2 group-hover:opacity-60 transition-opacity" style={{
          fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
          fontWeight: 700, fontSize: "13px",
          color: "rgb(50,35,10)", lineHeight: 2,
        }}>
          {article.title}
        </h3>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {article.published_at && (
            <span style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "10px", color: "rgb(140,115,65)", lineHeight: 2 }}>
              {formatDhivehiDate(article.published_at)}
            </span>
          )}
          {article.published_at && article.reading_time_minutes && (
            <span style={{ color: "rgb(160,135,85)", fontSize: "10px", lineHeight: 2 }}>{"·"}</span>
          )}
          {article.reading_time_minutes && (
            <span style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "10px", color: "rgb(160,135,85)", lineHeight: 2 }}>
              {article.reading_time_minutes + " މިނެޓު"}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
