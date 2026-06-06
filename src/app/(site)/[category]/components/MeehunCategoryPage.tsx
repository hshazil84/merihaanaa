import Link from "next/link";
import { Pagination } from "./Pagination";
import { formatDhivehiDate } from "@/lib/formatDhivehiDate";

const FONT_THAANA = '"MVTypewriter", "Noto Sans Thaana", sans-serif';
const FONT_DISPLAY = '"SanguSuruhee", "MVTypewriter", "Noto Sans Thaana", sans-serif';
const TEXT_PRIMARY = "rgb(26,26,26)";
const TEXT_MUTED = "rgb(160,158,152)";
const TEXT_SECONDARY = "rgb(100,98,92)";
const BG_PAGE = "#F5F3EF";
const BG_CARD = "#EBE8E1";
const DIVIDER = "rgba(0,0,0,0.08)";
const RED_TAG = "#E87060";

function getAuthorName(author: any): string {
  if (!author) return "";
  if (Array.isArray(author)) return author[0]?.full_name ?? "";
  return author.full_name ?? "";
}

function TagLabel({ tags }: { tags?: any }) {
  if (!tags || !Array.isArray(tags) || tags.length === 0) return null;
  const raw = tags[0];
  const tag = typeof raw === "string" ? raw : typeof raw === "object" && raw !== null ? (raw.name ?? null) : null;
  if (!tag) return null;
  return (
    <span style={{
      fontFamily: FONT_THAANA,
      fontSize: "10px",
      letterSpacing: "0.05em",
      color: RED_TAG,
      fontWeight: 600,
      display: "block",
      marginBottom: "3px",
    }}>
      {tag}
    </span>
  );
}

function MostReadPill({ rank }: { rank: number }) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "22px",
      height: "22px",
      borderRadius: "999px",
      background: "rgba(232,112,96,0.12)",
      border: "0.5px solid rgba(232,112,96,0.25)",
      fontFamily: "Georgia, serif",
      fontSize: "12px",
      fontWeight: 400,
      color: "rgba(232,112,96,0.85)",
      flexShrink: 0,
      marginTop: "2px",
    }}>
      {rank}
    </span>
  );
}

export function MeehunCategoryPage({
  category,
  featuredArticle,
  mostRead,
  recentArticles,
  articles,
  total,
  totalPages,
  page,
}: {
  category: any;
  featuredArticle: any;
  mostRead: any[];
  recentArticles: any[];
  articles: any[];
  total: number;
  totalPages: number;
  page: number;
}) {
  return (
    <div style={{ backgroundColor: BG_PAGE, minHeight: "100vh" }} dir="rtl">

      <style>{`
        .meehun-grid {
          display: grid;
          grid-template-columns: 200px 1fr 200px;
          gap: 2.5rem;
          align-items: start;
        }
        .meehun-col-left,
        .meehun-col-right {
          display: block;
        }
        .most-read-mobile {
          display: none;
        }
        .card-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }
        @media (max-width: 1024px) {
          .meehun-grid {
            grid-template-columns: 1fr;
            gap: 0;
          }
          .meehun-col-left,
          .meehun-col-right {
            display: none;
          }
          .most-read-mobile {
            display: block;
          }
          .card-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 480px) {
          .card-grid {
            grid-template-columns: 1fr;
          }
        }
        .most-read-scroll {
          display: flex;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          gap: 12px;
          padding-bottom: 4px;
        }
        .most-read-scroll::-webkit-scrollbar { display: none; }
        .most-read-scroll-item {
          flex-shrink: 0;
          width: 150px;
          padding-left: 12px;
          border-left: 0.5px solid rgba(0,0,0,0.08);
        }
        .most-read-scroll-item:first-child {
          border-left: none;
          padding-left: 0;
        }
        .recent-link:hover p { opacity: 0.65; }
        .card-link:hover img { transform: scale(1.05); }
        .featured-link:hover h2 { opacity: 0.7; }
      `}</style>

      {/* Page header */}
      <header style={{ maxWidth: "72rem", margin: "0 auto", padding: "0.75rem 1.5rem 1.25rem", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
          <span style={{ color: "rgba(0,0,0,0.18)", fontSize: "11px", letterSpacing: "0.15em" }}>✦ ✦</span>
          <h1 style={{
            fontFamily: FONT_DISPLAY,
            fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
            color: "#E87060",
            lineHeight: 1.5,
            fontWeight: 400,
            margin: 0,
          }}>
            {category.name}
          </h1>
          <span style={{ color: "rgba(0,0,0,0.18)", fontSize: "12px", letterSpacing: "0.25em" }}>✦ ✦</span>
        </div>
      </header>

      {/* 3-col strip */}
      <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "0 1.5rem" }} className="meehun-grid">

        {/* LEFT: Recent */}
        <div className="meehun-col-left">
          <p style={{ fontFamily: FONT_THAANA, fontSize: "10px", letterSpacing: "0.08em", color: TEXT_MUTED, marginBottom: "10px", fontWeight: 600 }}>
            ފަހުގެ ލިޔުންތައް
          </p>
          {recentArticles.map((article, i) => (
            <Link
              key={article.id}
              href={`/${category.slug}/${article.slug}`}
              className="recent-link"
              style={{ display: "block", padding: "9px 0", borderBottom: i < recentArticles.length - 1 ? `0.5px solid ${DIVIDER}` : "none", textDecoration: "none" }}
            >
              <TagLabel tags={article.tags} />
              <p style={{ fontFamily: FONT_THAANA, fontSize: "12px", color: TEXT_PRIMARY, lineHeight: 1.7, margin: "0 0 3px", transition: "opacity 0.2s" }}
                className="line-clamp-2">
                {article.title}
              </p>
              <p style={{ fontFamily: FONT_THAANA, fontSize: "11px", color: TEXT_MUTED, margin: 0, lineHeight: 2 }}>
                {getAuthorName(article.author)}
                {article.published_at && <> · {formatDhivehiDate(article.published_at)}</>}
              </p>
            </Link>
          ))}
        </div>

        {/* CENTER: Featured */}
        <div>
          {featuredArticle ? (
            <Link href={`/${category.slug}/${featuredArticle.slug}`} style={{ display: "block", textDecoration: "none" }} className="featured-link">
              <div style={{ width: "100%", aspectRatio: "3/2", borderRadius: "12px", overflow: "hidden", backgroundColor: BG_CARD, marginBottom: "14px" }}>
                {featuredArticle.featured_image ? (
                  <img
                    src={featuredArticle.featured_image}
                    alt={featuredArticle.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.7s ease" }}
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", backgroundColor: BG_CARD }} />
                )}
              </div>
              <TagLabel tags={featuredArticle.tags} />
              <h2 style={{
                fontFamily: FONT_THAANA,
                fontSize: "clamp(1.1rem, 2.5vw, 1.45rem)",
                fontWeight: 700,
                color: TEXT_PRIMARY,
                lineHeight: 1.9,
                margin: "0 0 8px",
                transition: "opacity 0.2s",
              }}>
                {featuredArticle.title}
              </h2>
              {featuredArticle.excerpt && (
                <p style={{ fontFamily: FONT_THAANA, fontSize: "13px", color: TEXT_SECONDARY, lineHeight: 1.9, margin: "0 0 10px" }}
                  className="line-clamp-3">
                  {featuredArticle.excerpt}
                </p>
              )}
              <p style={{ fontFamily: FONT_THAANA, fontSize: "12px", color: TEXT_MUTED, margin: 0, lineHeight: 2 }}>
                {getAuthorName(featuredArticle.author)}
                {featuredArticle.reading_time_minutes && <> · {featuredArticle.reading_time_minutes} މިނެޓު</>}
              </p>
            </Link>
          ) : (
            <p style={{ fontFamily: FONT_THAANA, fontSize: "13px", color: TEXT_MUTED }}>ފީޗަރ ލިޔުމެއް ނެތް</p>
          )}

          {/* Most read — mobile horizontal scroll */}
          {mostRead.length > 0 && (
            <div className="most-read-mobile" style={{ marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: `0.5px solid ${DIVIDER}` }}>
              <p style={{ fontFamily: FONT_THAANA, fontSize: "10px", letterSpacing: "0.08em", color: TEXT_MUTED, marginBottom: "12px", fontWeight: 600 }}>
                އެންމެ ގިނައިން ކިޔާ
              </p>
              <div className="most-read-scroll">
                {mostRead.map((article, i) => (
                  <Link
                    key={article.id}
                    href={`/${category.slug}/${article.slug}`}
                    className="most-read-scroll-item"
                    style={{ textDecoration: "none" }}
                  >
                    <div style={{ marginBottom: "6px" }}>
                      <MostReadPill rank={i + 1} />
                    </div>
                    <p style={{ fontFamily: FONT_THAANA, fontSize: "12px", color: TEXT_PRIMARY, lineHeight: 1.7, margin: "0 0 3px" }}
                      className="line-clamp-3">
                      {article.title}
                    </p>
                    {article.view_count != null && (
                      <p style={{ fontFamily: FONT_THAANA, fontSize: "11px", color: TEXT_MUTED, margin: 0, lineHeight: 2 }}>
                        {article.view_count.toLocaleString()} ކިޔާ
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Most read — desktop */}
        <div className="meehun-col-right">
          <p style={{ fontFamily: FONT_THAANA, fontSize: "10px", letterSpacing: "0.08em", color: TEXT_MUTED, marginBottom: "10px", fontWeight: 600 }}>
            އެންމެ ގިނައިން ކިޔާ
          </p>
          {mostRead.map((article, i) => (
            <Link
              key={article.id}
              href={`/${category.slug}/${article.slug}`}
              className="recent-link"
              style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "9px 0", borderBottom: i < mostRead.length - 1 ? `0.5px solid ${DIVIDER}` : "none", textDecoration: "none" }}
            >
              <MostReadPill rank={i + 1} />
              <div>
                <p style={{ fontFamily: FONT_THAANA, fontSize: "12px", color: TEXT_PRIMARY, lineHeight: 1.7, margin: "0 0 2px", transition: "opacity 0.2s" }}
                  className="line-clamp-2">
                  {article.title}
                </p>
                {article.view_count != null && (
                  <p style={{ fontFamily: FONT_THAANA, fontSize: "11px", color: TEXT_MUTED, margin: 0, lineHeight: 2 }}>
                    {article.view_count.toLocaleString()} ކިޔާ
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>

      </div>

      {/* Divider */}
      <div style={{ maxWidth: "72rem", margin: "2rem auto 1.5rem", padding: "0 1.5rem" }}>
        <div style={{ borderTop: `0.5px solid ${DIVIDER}` }} />
      </div>

      {/* Card grid */}
      {articles.length > 0 && (
        <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "0 1.5rem 4rem" }}>
          <p style={{ fontFamily: FONT_THAANA, fontSize: "10px", letterSpacing: "0.08em", color: TEXT_MUTED, marginBottom: "16px", fontWeight: 600 }}>
            ހުރިހާ ލިޔުންތައް
          </p>
          <div className="card-grid">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/${category.slug}/${article.slug}`}
                style={{ textDecoration: "none", display: "block" }}
                className="card-link"
              >
                <div style={{ aspectRatio: "4/3", overflow: "hidden", borderRadius: "8px", backgroundColor: BG_CARD, marginBottom: "10px" }}>
                  {article.featured_image ? (
                    <img
                      src={article.featured_image}
                      alt={article.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }}
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", backgroundColor: BG_CARD }} />
                  )}
                </div>
                <TagLabel tags={article.tags} />
                <h3
                  className="line-clamp-2"
                  style={{
                    fontFamily: FONT_THAANA,
                    fontWeight: 700,
                    fontSize: "13px",
                    color: TEXT_PRIMARY,
                    lineHeight: 1.9,
                    margin: "0 0 4px",
                  }}
                >
                  {article.title}
                </h3>
                <p style={{ fontFamily: FONT_THAANA, fontSize: "11px", color: TEXT_MUTED, margin: 0, lineHeight: 2 }}>
                  {getAuthorName(article.author)}
                  {article.reading_time_minutes && <> · {article.reading_time_minutes} މިނެޓު</>}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} categorySlug={category.slug} />
    </div>
  );
}
