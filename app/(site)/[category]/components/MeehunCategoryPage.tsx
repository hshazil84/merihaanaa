import Link from "next/link";
import { Pagination } from "../Pagination";
import { formatDhivehiDate } from "@/lib/formatDhivehiDate";

const FONT_THAANA = '"MVTypewriter", "Noto Sans Thaana", sans-serif';
const FONT_DISPLAY = '"SanguSuruhee", "MVTypewriter", "Noto Sans Thaana", sans-serif';
const TEXT_PRIMARY = "rgb(26,26,26)";
const TEXT_MUTED = "rgb(160,158,152)";
const TEXT_SECONDARY = "rgb(100,98,92)";
const BG_PAGE = "#F5F3EF";
const BG_CARD = "#EBE8E1";
const DIVIDER = "rgba(0,0,0,0.1)";
const RED_TAG = "#9B2020";

function TagLabel({ tags }: { tags?: string[] | null }) {
  const tag = tags?.[0];
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

      {/* Page header */}
      <header style={{ maxWidth: "64rem", margin: "0 auto", padding: "3rem 1.5rem 2.5rem", textAlign: "center" }}>
        <h1 style={{
          fontFamily: FONT_DISPLAY,
          fontSize: "clamp(2.5rem, 6vw, 4rem)",
          color: TEXT_PRIMARY,
          lineHeight: 1.6,
          fontWeight: 400,
          margin: 0,
        }}>
          {category.name}
        </h1>
        <p style={{ fontFamily: FONT_THAANA, fontSize: "12px", color: TEXT_MUTED, lineHeight: 2, marginTop: "4px" }}>
          {total} ލިޔުން
        </p>
      </header>

      {/* 3-col strip */}
      <div style={{
        maxWidth: "72rem",
        margin: "0 auto",
        padding: "0 1.5rem",
        display: "grid",
        gridTemplateColumns: "200px 1fr 200px",
        gap: "2rem",
        alignItems: "start",
      }}>

        {/* LEFT: Recent articles */}
        <div>
          <p style={{ fontFamily: FONT_THAANA, fontSize: "10px", letterSpacing: "0.08em", color: TEXT_MUTED, marginBottom: "8px", fontWeight: 600 }}>
            ފަހުގެ ލިޔުންތައް
          </p>
          <div>
            {recentArticles.map((article, i) => (
              <Link
                key={article.id}
                href={`/${category.slug}/${article.slug}`}
                style={{ display: "block", padding: "8px 0", borderBottom: i < recentArticles.length - 1 ? `0.5px solid ${DIVIDER}` : "none", textDecoration: "none" }}
              >
                <TagLabel tags={article.tags} />
                <p style={{ fontFamily: FONT_THAANA, fontSize: "12px", color: TEXT_PRIMARY, lineHeight: 1.7, margin: "0 0 2px" }}
                  className="line-clamp-2">
                  {article.title}
                </p>
                <p style={{ fontFamily: FONT_THAANA, fontSize: "11px", color: TEXT_MUTED, margin: 0, lineHeight: 2 }}>
                  {article.author?.full_name}
                  {article.published_at && (
                    <> · {formatDhivehiDate(article.published_at)}</>
                  )}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* CENTER: Featured */}
        <div>
          <p style={{ fontFamily: FONT_THAANA, fontSize: "10px", letterSpacing: "0.08em", color: TEXT_MUTED, marginBottom: "8px", fontWeight: 600 }}>
            ފީޗަރ
          </p>
          {featuredArticle ? (
            <Link href={`/${category.slug}/${featuredArticle.slug}`} style={{ display: "block", textDecoration: "none" }} className="group">
              <div style={{ width: "100%", aspectRatio: "3/2", borderRadius: "12px", overflow: "hidden", backgroundColor: BG_CARD, marginBottom: "12px" }}>
                {featuredArticle.featured_image ? (
                  <img
                    src={featuredArticle.featured_image}
                    alt={featuredArticle.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    className="group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", backgroundColor: BG_CARD }} />
                )}
              </div>
              <TagLabel tags={featuredArticle.tags} />
              <h2
                className="group-hover:opacity-70 transition-opacity"
                style={{
                  fontFamily: FONT_THAANA,
                  fontSize: "clamp(1.1rem, 2.5vw, 1.4rem)",
                  fontWeight: 700,
                  color: TEXT_PRIMARY,
                  lineHeight: 1.9,
                  margin: "0 0 8px",
                }}
              >
                {featuredArticle.title}
              </h2>
              {featuredArticle.excerpt && (
                <p style={{ fontFamily: FONT_THAANA, fontSize: "13px", color: TEXT_SECONDARY, lineHeight: 1.9, margin: "0 0 10px" }}
                  className="line-clamp-3">
                  {featuredArticle.excerpt}
                </p>
              )}
              <p style={{ fontFamily: FONT_THAANA, fontSize: "12px", color: TEXT_MUTED, margin: 0, lineHeight: 2 }}>
                {featuredArticle.author?.full_name}
                {featuredArticle.reading_time_minutes && (
                  <> · {featuredArticle.reading_time_minutes} މިނެޓު</>
                )}
              </p>
            </Link>
          ) : (
            <p style={{ fontFamily: FONT_THAANA, fontSize: "13px", color: TEXT_MUTED }}>ފީޗަރ ލިޔުމެއް ނެތް</p>
          )}
        </div>

        {/* RIGHT: Most read */}
        <div>
          <p style={{ fontFamily: FONT_THAANA, fontSize: "10px", letterSpacing: "0.08em", color: TEXT_MUTED, marginBottom: "8px", fontWeight: 600 }}>
            އެންމެ ގިނައިން ކިޔާ
          </p>
          <div>
            {mostRead.map((article, i) => (
              <Link
                key={article.id}
                href={`/${category.slug}/${article.slug}`}
                style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "8px 0", borderBottom: i < mostRead.length - 1 ? `0.5px solid ${DIVIDER}` : "none", textDecoration: "none" }}
              >
                <span style={{
                  fontFamily: FONT_THAANA,
                  fontSize: "20px",
                  fontWeight: 500,
                  color: "rgba(0,0,0,0.15)",
                  lineHeight: 1,
                  minWidth: "20px",
                  flexShrink: 0,
                }}>
                  {i + 1}
                </span>
                <div>
                  <p style={{ fontFamily: FONT_THAANA, fontSize: "12px", color: TEXT_PRIMARY, lineHeight: 1.7, margin: "0 0 2px" }}
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

      </div>

      {/* Divider */}
      <div style={{ maxWidth: "72rem", margin: "2rem auto", padding: "0 1.5rem" }}>
        <div style={{ borderTop: `0.5px solid ${DIVIDER}` }} />
      </div>

      {/* Card grid */}
      {articles.length > 0 && (
        <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "0 1.5rem 4rem" }}>
          <p style={{ fontFamily: FONT_THAANA, fontSize: "10px", letterSpacing: "0.08em", color: TEXT_MUTED, marginBottom: "16px", fontWeight: 600 }}>
            ހުރިހާ ލިޔުންތައް
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/${category.slug}/${article.slug}`}
                style={{ textDecoration: "none" }}
                className="group block"
              >
                <div style={{ aspectRatio: "4/3", overflow: "hidden", borderRadius: "8px", backgroundColor: BG_CARD, marginBottom: "10px" }}>
                  {article.featured_image ? (
                    <img
                      src={article.featured_image}
                      alt={article.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      className="group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", backgroundColor: BG_CARD }} />
                  )}
                </div>
                <TagLabel tags={article.tags} />
                <h3
                  className="line-clamp-2 group-hover:opacity-70 transition-opacity"
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
                  {article.author?.full_name}
                  {article.reading_time_minutes && (
                    <> · {article.reading_time_minutes} މިނެޓު</>
                  )}
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
