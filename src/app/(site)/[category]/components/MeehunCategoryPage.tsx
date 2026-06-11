"use client";
import Link from "next/link";
import Image from "next/image";
import { Eye } from "lucide-react";
import { Pagination } from "./Pagination";

const FONT_THAANA = '"MVTypewriter", "Noto Sans Thaana", sans-serif';
const FONT_DISPLAY = '"SanguSuruhee", "MVTypewriter", "Noto Sans Thaana", sans-serif';
const TEXT_PRIMARY = "rgb(26,26,26)";
const TEXT_MUTED = "rgb(160,158,152)";
const TEXT_SECONDARY = "rgb(100,98,92)";
const BG_PAGE = "#F5F3EF";
const BG_CARD = "#EBE8E1";
const DIVIDER = "rgba(0,0,0,0.08)";
const CORAL = "#E87060";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

function getAuthorName(author: any): string {
  if (!author) return "";
  if (Array.isArray(author)) return author[0]?.full_name ?? "";
  return author.full_name ?? "";
}

function getAuthorAvatar(author: any): string | null {
  const av = Array.isArray(author) ? author[0]?.avatar : author?.avatar;
  if (!av) return null;
  if (av.startsWith("http")) return av;
  return SUPABASE_URL + "/storage/v1/object/public/avatars/" + av;
}

function TagLabel({ tags }: { tags?: any }) {
  if (!tags || !Array.isArray(tags) || tags.length === 0) return null;
  const raw = tags[0];
  const tag = typeof raw === "string" ? raw : typeof raw === "object" && raw !== null ? (raw.name ?? null) : null;
  if (!tag) return null;
  return (
    <span style={{ fontFamily: FONT_THAANA, fontSize: "10px", letterSpacing: "0.05em", color: CORAL, fontWeight: 600, display: "block", marginBottom: "4px" }}>
      {tag}
    </span>
  );
}

function MostReadPill({ rank }: { rank: number }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: "22px", height: "22px", borderRadius: "999px",
      background: "rgba(232,112,96,0.12)", border: "0.5px solid rgba(232,112,96,0.25)",
      fontFamily: "Georgia, serif", fontSize: "12px", fontWeight: 400,
      color: "rgba(232,112,96,0.85)", flexShrink: 0, marginTop: "2px",
    }}>
      {rank}
    </span>
  );
}

function ViewCount({ count }: { count: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontFamily: FONT_THAANA, fontSize: "11px", color: TEXT_MUTED, lineHeight: 1 }}>
      <Eye size={10} style={{ opacity: 0.5, flexShrink: 0 }} />
      {count.toLocaleString()}
    </span>
  );
}

function ColLabel({ children }: { children: string }) {
  return (
    <p style={{ fontFamily: FONT_THAANA, fontSize: "10px", letterSpacing: "0.08em", color: TEXT_MUTED, marginBottom: "14px", fontWeight: 600, borderRight: "2px solid " + CORAL, paddingRight: "8px" }}>
      {children}
    </p>
  );
}

function RecentArticleCard({ article, categorySlug, isLast }: { article: any; categorySlug: string; isLast: boolean }) {
  return (
    <Link
      href={"/" + categorySlug + "/" + article.slug}
      style={{ display: "block", textDecoration: "none", paddingBottom: isLast ? "0" : "14px", marginBottom: isLast ? "0" : "14px", borderBottom: isLast ? "none" : "0.5px solid " + DIVIDER, textAlign: "center" }}
      className="recent-card"
    >
      <div style={{ width: "88px", height: "88px", borderRadius: "999px", overflow: "hidden", backgroundColor: BG_CARD, margin: "0 auto 10px", position: "relative" }}>
        {article.featured_image ? (
          <Image src={article.featured_image} alt={article.title} fill sizes="88px" className="object-cover" />
        ) : (
          <div style={{ width: "100%", height: "100%", backgroundColor: BG_CARD }} />
        )}
      </div>
      <p style={{ fontFamily: FONT_THAANA, fontSize: "11px", color: TEXT_PRIMARY, lineHeight: 1.7, margin: 0 }} className="line-clamp-2">
        {article.title}
      </p>
    </Link>
  );
}

export function MeehunCategoryPage({
  category, featuredArticle, mostRead, recentArticles, articles, total, totalPages, page,
}: {
  category: any; featuredArticle: any; mostRead: any[]; recentArticles: any[];
  articles: any[]; total: number; totalPages: number; page: number;
}) {
  const authorName   = getAuthorName(featuredArticle?.author);
  const authorAvatar = getAuthorAvatar(featuredArticle?.author);

  return (
    <div style={{ backgroundColor: BG_PAGE, minHeight: "100vh" }} dir="rtl">
      <style>{`
        .meehun-grid {
          display: grid;
          grid-template-columns: 140px 1fr 200px;
          gap: 2.5rem;
          align-items: start;
        }
        .meehun-col-left, .meehun-col-center, .meehun-col-right { display: block; }
        .meehun-mobile-only { display: none; }
        .card-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }

        @media (max-width: 1024px) {
          .meehun-grid { display: block; }
          .meehun-col-left, .meehun-col-center, .meehun-col-right { display: none; }
          .meehun-mobile-only { display: block; }
          .card-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .card-grid { grid-template-columns: 1fr; }
        }
        .card-link:hover img { transform: scale(1.05); }
        .featured-link:hover .featured-title { opacity: 0.75; }
        .recent-card:hover p { opacity: 0.65; }
      `}</style>

      {/* Header */}
      <header style={{ maxWidth: "72rem", margin: "0 auto", padding: "2rem 1.5rem 1.5rem", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
          <span style={{ color: "rgba(0,0,0,0.18)", fontSize: "11px" }}>✦</span>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(2rem, 5vw, 3.5rem)", color: CORAL, lineHeight: 1.5, fontWeight: 400, margin: 0 }}>
            {category.name}
          </h1>
          <span style={{ color: "rgba(0,0,0,0.18)", fontSize: "11px" }}>✦</span>
        </div>
      </header>

      {/* Desktop: 3-col grid */}
      <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "0 1.5rem" }} className="meehun-grid">

        {/* LEFT: Recent circles */}
        <div className="meehun-col-left">
          {recentArticles.map((article, i) => (
            <RecentArticleCard key={article.id} article={article} categorySlug={category.slug} isLast={i === recentArticles.length - 1} />
          ))}
        </div>

        {/* CENTER: Featured with gradient overlay */}
        <div className="meehun-col-center">
          {featuredArticle ? (
            <Link href={"/" + category.slug + "/" + featuredArticle.slug} style={{ display: "block", textDecoration: "none", position: "relative" }} className="featured-link">
              <div style={{ width: "100%", aspectRatio: "3/2", borderRadius: "12px", overflow: "hidden", backgroundColor: BG_CARD, position: "relative" }}>
                {featuredArticle.featured_image ? (
                  <Image src={featuredArticle.featured_image} alt={featuredArticle.title} fill sizes="(max-width: 1024px) 100vw, 600px" className="object-cover" priority />
                ) : (
                  <div style={{ width: "100%", height: "100%", backgroundColor: BG_CARD }} />
                )}
                <div style={{ position: "absolute", inset: 0, borderRadius: "inherit", background: "linear-gradient(to top, rgba(10,8,6,0.88) 0%, rgba(10,8,6,0.55) 35%, rgba(10,8,6,0.0) 65%)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 20px 18px" }}>
                  <TagLabel tags={featuredArticle.tags} />
                  <h2 className="featured-title" style={{ fontFamily: FONT_THAANA, fontSize: "clamp(1rem, 2.2vw, 1.35rem)", fontWeight: 700, color: "rgba(255,255,255,0.95)", lineHeight: 1.8, margin: "0 0 10px", transition: "opacity 0.2s" }}>
                    {featuredArticle.title}
                  </h2>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {authorAvatar ? (
                      <div style={{ width: "26px", height: "26px", borderRadius: "50%", overflow: "hidden", flexShrink: 0, position: "relative", border: "1.5px solid rgba(255,255,255,0.4)" }}>
                        <Image src={authorAvatar} alt={authorName} fill sizes="26px" className="object-cover" />
                      </div>
                    ) : authorName ? (
                      <div style={{ width: "26px", height: "26px", borderRadius: "50%", flexShrink: 0, backgroundColor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontFamily: FONT_THAANA, fontSize: "10px", color: "rgba(255,255,255,0.8)" }}>{authorName[0]}</span>
                      </div>
                    ) : null}
                    <p style={{ fontFamily: FONT_THAANA, fontSize: "11px", color: "rgba(255,255,255,0.65)", margin: 0, lineHeight: 1 }}>
                      {authorName}{authorName && featuredArticle.reading_time_minutes ? " · " : ""}{featuredArticle.reading_time_minutes ? featuredArticle.reading_time_minutes + " މިނެޓު" : ""}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <p style={{ fontFamily: FONT_THAANA, fontSize: "13px", color: TEXT_MUTED }}>ފީޗަރ ލިޔުމެއް ނެތް</p>
          )}
        </div>

        {/* RIGHT: Most read */}
        <div className="meehun-col-right">
          <ColLabel>އެންމެ ގިނައިން ކިޔާ</ColLabel>
          {mostRead.map((article, i) => (
            <Link key={article.id} href={"/" + category.slug + "/" + article.slug} className="recent-card"
              style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "9px 0", borderBottom: i < mostRead.length - 1 ? "0.5px solid " + DIVIDER : "none", textDecoration: "none" }}>
              <MostReadPill rank={i + 1} />
              <div>
                <p style={{ fontFamily: FONT_THAANA, fontSize: "12px", color: TEXT_PRIMARY, lineHeight: 1.7, margin: "0 0 3px" }} className="line-clamp-2">
                  {article.title}
                </p>
                {article.view_count != null && <ViewCount count={article.view_count} />}
              </div>
            </Link>
          ))}
        </div>

      </div>

      {/* Mobile only */}
      <div className="meehun-mobile-only" style={{ maxWidth: "72rem", margin: "0 auto", padding: "0 1.5rem" }}>

        {/* Featured on mobile */}
        {featuredArticle && (
          <div style={{ marginTop: "1rem", background: "rgba(0,0,0,0.03)", borderRadius: "12px", padding: "10px" }}>
            <Link href={"/" + category.slug + "/" + featuredArticle.slug} style={{ display: "block", textDecoration: "none" }} className="featured-link">
              <div style={{ width: "100%", aspectRatio: "3/2", borderRadius: "8px", overflow: "hidden", backgroundColor: BG_CARD, position: "relative" }}>
                {featuredArticle.featured_image && (
                  <Image src={featuredArticle.featured_image} alt={featuredArticle.title} fill sizes="100vw" className="object-cover" priority />
                )}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,8,6,0.88) 0%, rgba(10,8,6,0.55) 35%, transparent 65%)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px" }}>
                  <h2 className="featured-title" style={{ fontFamily: FONT_THAANA, fontSize: "15px", fontWeight: 700, color: "rgba(255,255,255,0.95)", lineHeight: 1.8, margin: "0 0 8px", transition: "opacity 0.2s" }}>
                    {featuredArticle.title}
                  </h2>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {authorAvatar && (
                      <div style={{ width: "22px", height: "22px", borderRadius: "50%", overflow: "hidden", flexShrink: 0, position: "relative", border: "1.5px solid rgba(255,255,255,0.4)" }}>
                        <Image src={authorAvatar} alt={authorName} fill sizes="22px" className="object-cover" />
                      </div>
                    )}
                    <p style={{ fontFamily: FONT_THAANA, fontSize: "10px", color: "rgba(255,255,255,0.65)", margin: 0 }}>
                      {authorName}{authorName && featuredArticle.reading_time_minutes ? " · " : ""}{featuredArticle.reading_time_minutes ? featuredArticle.reading_time_minutes + " މިނެޓު" : ""}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Recent circles scroll — larger, tighter gap */}
        {recentArticles.length > 0 && (
          <div style={{ marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: "0.5px solid " + DIVIDER }}>
            <ColLabel>ފަހުގެ ލިޔުންތައް</ColLabel>
            <div style={{ display: "flex", flexDirection: "row", overflowX: "auto", overflowY: "hidden", WebkitOverflowScrolling: "touch" as any, scrollbarWidth: "none" as any, paddingBottom: "8px", gap: "12px" }}>
              {recentArticles.map((article) => (
                <Link
                  key={article.id}
                  href={"/" + category.slug + "/" + article.slug}
                  style={{ flex: "0 0 110px", textAlign: "center", textDecoration: "none" }}
                  className="recent-card"
                >
                  <div style={{ width: "110px", height: "110px", borderRadius: "999px", overflow: "hidden", backgroundColor: BG_CARD, margin: "0 auto 8px", position: "relative" }}>
                    {article.featured_image ? (
                      <Image src={article.featured_image} alt={article.title} fill sizes="110px" className="object-cover" />
                    ) : <div style={{ width: "100%", height: "100%", backgroundColor: BG_CARD }} />}
                  </div>
                  <p style={{ fontFamily: FONT_THAANA, fontSize: "11px", color: TEXT_PRIMARY, lineHeight: 1.6, margin: 0 }} className="line-clamp-2">
                    {article.title}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Most read scroll */}
        {mostRead.length > 0 && (
          <div style={{ marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: "0.5px solid " + DIVIDER }}>
            <ColLabel>އެންމެ ގިނައިން ކިޔާ</ColLabel>
            <div style={{ display: "flex", flexDirection: "row", overflowX: "auto", WebkitOverflowScrolling: "touch" as any, scrollbarWidth: "none" as any, paddingBottom: "8px", gap: "12px" }}>
              {mostRead.map((article) => (
                <Link
                  key={article.id}
                  href={"/" + category.slug + "/" + article.slug}
                  style={{ flex: "0 0 150px", textDecoration: "none" }}
                >
                  <div style={{ marginBottom: "6px" }}><MostReadPill rank={mostRead.indexOf(article) + 1} /></div>
                  <p style={{ fontFamily: FONT_THAANA, fontSize: "12px", color: TEXT_PRIMARY, lineHeight: 1.7, margin: "0 0 3px" }} className="line-clamp-3">
                    {article.title}
                  </p>
                  {article.view_count != null && <ViewCount count={article.view_count} />}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ maxWidth: "72rem", margin: "2rem auto 1.5rem", padding: "0 1.5rem" }}>
        <div style={{ borderTop: "0.5px solid " + DIVIDER }} />
      </div>

      {/* Card grid */}
      {articles.length > 0 && (
        <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "0 1.5rem 4rem" }}>
          <p style={{ fontFamily: FONT_THAANA, fontSize: "10px", letterSpacing: "0.08em", color: TEXT_MUTED, marginBottom: "16px", fontWeight: 600, borderRight: "2px solid " + CORAL, paddingRight: "8px" }}>
            ހުރިހާ ލިޔުންތައް
          </p>
          <div className="card-grid">
            {articles.map((article) => (
              <Link key={article.id} href={"/" + category.slug + "/" + article.slug} style={{ textDecoration: "none", display: "block" }} className="card-link">
                <div style={{ aspectRatio: "4/3", overflow: "hidden", borderRadius: "8px", backgroundColor: BG_CARD, marginBottom: "10px", position: "relative" }}>
                  {article.featured_image ? (
                    <Image src={article.featured_image} alt={article.title} fill sizes="(max-width: 480px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover" style={{ transition: "transform 0.5s ease" }} />
                  ) : <div style={{ width: "100%", height: "100%", backgroundColor: BG_CARD }} />}
                </div>
                <TagLabel tags={article.tags} />
                <h3 className="line-clamp-2" style={{ fontFamily: FONT_THAANA, fontWeight: 700, fontSize: "13px", color: TEXT_PRIMARY, lineHeight: 1.9, margin: "0 0 4px" }}>
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
