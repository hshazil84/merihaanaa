"use client";

import { useState } from "react";
import Link from "next/link";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  reading_time_minutes: number | null;
  published_at: string | null;
  tags: any[] | null;
  view_count?: number | null;
  category: { name: string; slug: string } | null;
  author?: { full_name: string } | null;
}

interface TopRead {
  id: string;
  title: string;
  slug: string;
  view_count: number | null;
}

interface CinemaEntry {
  id: string;
  chart_type: string;
  rank: number;
  title: string;
  status: string | null;
  article_id: string | null;
  featured_image: string | null;
  showing_date: string | null;
  performance: string | null;
  synopsis: string | null;
  trailer_url: string | null;
}

interface OTTEntry {
  id: string;
  rank: number;
  title_dv: string;
  title_en: string | null;
  platform: string;
  genre: string | null;
  season: number | null;
  episodes: number | null;
  rating: number | null;
  synopsis: string | null;
  poster_url: string | null;
  ott_instagram: string | null;
  article_id: string | null;
}

interface Props {
  articles: Article[];
  cinemaEntries: CinemaEntry[];
  ottEntries: OTTEntry[];
  topRead: TopRead[];
  categorySlug: string;
  totalCount: number;
  page: number;
}

const RED = "#ba2a31";
const FONT = '"MVTypewriter","Noto Sans Thaana",sans-serif';
const FONT_DISPLAY = '"SanguSuruhee","MVTypewriter","Noto Sans Thaana",sans-serif';
const BG = "#F5F3EF";
const BG_CARD = "#EBE8E1";
const TEXT = "rgb(26,26,26)";
const TEXT_MUTED = "rgb(140,138,132)";
const DIVIDER = "rgba(0,0,0,0.08)";

const PLATFORM_COLORS: Record<string, string> = {
  netflix:   "#E50914",
  apple:     "#555555",
  amazon:    "#00A8E0",
  videoclub: "#E87060",
  baiskoafu: "#1a1a2e",
};
const PLATFORM_LABELS: Record<string, string> = {
  netflix:   "Netflix",
  apple:     "Apple TV+",
  amazon:    "Prime Video",
  videoclub: "Video Club",
  baiskoafu: "Baiskoafu",
};

const CSS = [
  ".film-layout{display:grid;grid-template-columns:1fr 260px;gap:3rem;align-items:start;}",
  ".film-featured{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;align-items:start;}",
  ".film-3col{display:grid;grid-template-columns:1fr 1fr 1fr;gap:1.25rem;}",
  ".film-4col{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:1.25rem;}",
  ".lc2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}",
  ".lc3{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}",
  ".lc4{display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;}",
  "@media(max-width:1024px){.film-layout{grid-template-columns:1fr!important;}.film-sidebar-col{display:none!important;}.film-4col{grid-template-columns:1fr 1fr!important;}}",
  "@media(max-width:768px){.film-featured{grid-template-columns:1fr!important;}.film-3col{grid-template-columns:1fr 1fr!important;}}",
  "@media(max-width:480px){.film-3col,.film-4col{grid-template-columns:1fr!important;}}",
].join("");

function getYouTubeId(url: string) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return m ? m[1] : null;
}

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function getFirstTag(tags: any[] | null): string | null {
  if (!tags || !Array.isArray(tags) || tags.length === 0) return null;
  const raw = tags[0];
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && raw !== null) return raw.name ?? null;
  return null;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
      <div style={{ width: "3px", height: "14px", background: RED, borderRadius: "2px", flexShrink: 0 }} />
      <p style={{ fontFamily: FONT, fontSize: "11px", fontWeight: 700, color: TEXT, margin: 0, letterSpacing: "0.04em" }}>
        {children}
      </p>
    </div>
  );
}

function ArticleCard({ article, categorySlug }: { article: Article; categorySlug: string }) {
  const slug = article.category?.slug ?? categorySlug;
  const tag = getFirstTag(article.tags);
  return (
    <Link href={"/" + slug + "/" + article.slug} style={{ textDecoration: "none", display: "block" }}>
      <div style={{ aspectRatio: "4/3", overflow: "hidden", borderRadius: "8px", backgroundColor: BG_CARD, marginBottom: "10px" }}>
        {article.featured_image
          ? <img src={article.featured_image} alt={article.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }}
              onMouseOver={function(e) { (e.currentTarget as HTMLImageElement).style.transform = "scale(1.04)"; }}
              onMouseOut={function(e) { (e.currentTarget as HTMLImageElement).style.transform = "scale(1)"; }} />
          : <div style={{ width: "100%", height: "100%", backgroundColor: BG_CARD }} />
        }
      </div>
      {tag && (
        <span style={{ fontFamily: FONT, fontSize: "9px", fontWeight: 700, color: "white", background: RED, padding: "2px 8px", borderRadius: "20px", display: "inline-block", marginBottom: "5px", letterSpacing: "0.04em" }}>
          {tag}
        </span>
      )}
      <h3 style={{ fontFamily: FONT, fontWeight: 700, fontSize: "13px", color: TEXT, lineHeight: 1.9, margin: "0 0 4px" }} className="lc2">
        {article.title}
      </h3>
      {article.author && (
        <p style={{ fontFamily: FONT, fontSize: "10px", color: TEXT_MUTED, margin: 0, lineHeight: 2 }}>
          {article.author.full_name}
        </p>
      )}
    </Link>
  );
}

function CinemaModal({ entry, onClose }: { entry: CinemaEntry; onClose: () => void }) {
  const ytId = entry.trailer_url ? getYouTubeId(entry.trailer_url) : null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ background: "white", width: "100%", maxWidth: "520px", borderRadius: "20px 20px 0 0", overflow: "hidden", maxHeight: "90vh", overflowY: "auto" }}
        onClick={function(e) { e.stopPropagation(); }} dir="rtl">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "0.5px solid " + DIVIDER }}>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontFamily: FONT, fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px",
              background: entry.chart_type === "cinema_now" ? RED : "rgb(240,239,233)",
              color: entry.chart_type === "cinema_now" ? "white" : "rgb(100,100,100)" }}>
              {entry.chart_type === "cinema_now" ? "މިހާރު ދައްކަނީ" : "އަންނަނީ"}
            </span>
            {entry.performance === "hit" && <span style={{ fontSize: "13px" }}>{"🔥"}</span>}
            {entry.performance === "flop" && <span style={{ fontSize: "13px" }}>{"😞"}</span>}
            {entry.performance === "houseful" && (
              <span style={{ fontFamily: FONT, fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "20px", background: "#fef9c3", color: "#854d0e" }}>
                {"🎟 ހައުސްފުލް"}
              </span>
            )}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: TEXT_MUTED, padding: "4px" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div style={{ padding: "20px" }}>
          <div style={{ display: "flex", gap: "14px", marginBottom: "16px" }}>
            {entry.featured_image && (
              <div style={{ width: "88px", height: "120px", borderRadius: "8px", overflow: "hidden", flexShrink: 0, background: BG_CARD }}>
                <img src={entry.featured_image} alt={entry.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <h2 style={{ fontFamily: FONT, fontWeight: 700, fontSize: "17px", lineHeight: 1.7, margin: "0 0 6px", color: TEXT }}>{entry.title}</h2>
              {entry.showing_date && <p style={{ fontFamily: FONT, fontSize: "11px", color: TEXT_MUTED, margin: 0 }}>{formatDate(entry.showing_date)}</p>}
            </div>
          </div>
          {entry.synopsis && <p style={{ fontFamily: FONT, fontSize: "13px", color: "rgb(80,78,72)", lineHeight: 1.9, margin: "0 0 16px" }}>{entry.synopsis}</p>}
          {ytId && (
            <div style={{ borderRadius: "10px", overflow: "hidden", aspectRatio: "16/9", marginBottom: "16px" }}>
              <iframe src={"https://www.youtube.com/embed/" + ytId} style={{ width: "100%", height: "100%", border: "none", display: "block" }} allowFullScreen allow="autoplay; encrypted-media" />
            </div>
          )}
          {entry.article_id && (
            <div style={{ paddingTop: "12px", borderTop: "0.5px solid " + DIVIDER }}>
              <a href={"/film/" + entry.article_id} style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: RED, textDecoration: "none" }}>{"← ރިވިއު ކިޔާ"}</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OTTModal({ entry, onClose }: { entry: OTTEntry; onClose: () => void }) {
  const pm = PLATFORM_COLORS[entry.platform] ?? "#666";
  const pl = PLATFORM_LABELS[entry.platform] ?? entry.platform;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ background: "white", width: "100%", maxWidth: "520px", borderRadius: "20px 20px 0 0", overflow: "hidden", maxHeight: "90vh", overflowY: "auto" }}
        onClick={function(e) { e.stopPropagation(); }} dir="rtl">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "0.5px solid " + DIVIDER }}>
          <span style={{ fontFamily: "sans-serif", fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", background: pm, color: "white" }}>{pl}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: TEXT_MUTED, padding: "4px" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div style={{ padding: "20px" }}>
          <div style={{ display: "flex", gap: "14px", marginBottom: "16px" }}>
            {entry.poster_url && (
              <div style={{ width: "88px", height: "120px", borderRadius: "8px", overflow: "hidden", flexShrink: 0, background: BG_CARD }}>
                <img src={entry.poster_url} alt={entry.title_dv} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <h2 style={{ fontFamily: FONT, fontWeight: 700, fontSize: "17px", lineHeight: 1.7, margin: "0 0 4px", color: TEXT }}>{entry.title_dv}</h2>
              {entry.title_en && <p style={{ fontFamily: "sans-serif", fontSize: "12px", color: TEXT_MUTED, margin: "0 0 8px" }}>{entry.title_en}</p>}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
                {entry.genre && <span style={{ fontFamily: FONT, fontSize: "10px", color: TEXT_MUTED }}>{entry.genre}</span>}
                {entry.season && <span style={{ fontFamily: FONT, fontSize: "10px", color: TEXT_MUTED }}>{"S" + entry.season}</span>}
                {entry.episodes && <span style={{ fontFamily: FONT, fontSize: "10px", color: TEXT_MUTED }}>{entry.episodes + " eps"}</span>}
              </div>
              {entry.rating && (
                <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                  {[1,2,3,4,5].map(function(s) {
                    return <svg key={s} width="13" height="13" viewBox="0 0 24 24" fill={(entry.rating ?? 0) >= s ? RED : "none"} stroke={RED} strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
                  })}
                  <span style={{ fontFamily: FONT, fontSize: "10px", color: TEXT_MUTED, marginRight: "4px" }}>{entry.rating + "/5"}</span>
                </div>
              )}
            </div>
          </div>
          {entry.synopsis && <p style={{ fontFamily: FONT, fontSize: "13px", color: "rgb(80,78,72)", lineHeight: 1.9, margin: "0 0 16px" }}>{entry.synopsis}</p>}
          <div style={{ display: "flex", gap: "12px", paddingTop: "12px", borderTop: "0.5px solid " + DIVIDER }}>
            {entry.ott_instagram && <a href={entry.ott_instagram} target="_blank" rel="noopener noreferrer" style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: RED, textDecoration: "none" }}>{"← Instagram"}</a>}
            {entry.article_id && <a href={"/film/" + entry.article_id} style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: RED, textDecoration: "none" }}>{"← ރިވިއު ކިޔާ"}</a>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ cinemaEntries, ottEntries, topRead, categorySlug, onCinemaClick, onOTTClick }: {
  cinemaEntries: CinemaEntry[];
  ottEntries: OTTEntry[];
  topRead: TopRead[];
  categorySlug: string;
  onCinemaClick: (e: CinemaEntry) => void;
  onOTTClick: (e: OTTEntry) => void;
}) {
  return (
    <div style={{ paddingTop: "0.5rem" }}>

      {topRead.length > 0 && (
        <div style={{ marginBottom: "2rem", paddingBottom: "2rem", borderBottom: "0.5px solid " + DIVIDER }}>
          <SectionLabel>ގިނައިން ކިޔާ</SectionLabel>
          <div>
            {topRead.map(function(a, i) {
              return (
                <Link key={a.id} href={"/" + categorySlug + "/" + a.slug} style={{ textDecoration: "none", display: "flex", alignItems: "flex-start", gap: "10px", padding: "8px 0", borderBottom: i < topRead.length - 1 ? "0.5px solid " + DIVIDER : "none" }}>
                  <span style={{ fontFamily: "Georgia,serif", fontSize: "16px", fontWeight: 700, color: i < 2 ? RED : TEXT_MUTED, minWidth: "20px", lineHeight: 1.3, flexShrink: 0 }}>
                    {i + 1}
                  </span>
                  <p style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: TEXT, margin: 0, lineHeight: 1.7 }} className="lc2" dir="rtl">
                    {a.title}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {(cinemaEntries.length > 0 || ottEntries.length > 0) && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <div style={{ width: "3px", height: "18px", background: RED, borderRadius: "2px", flexShrink: 0 }} />
            <p style={{ fontFamily: FONT_DISPLAY, fontSize: "17px", fontWeight: 400, color: RED, margin: 0 }}>
              ފިލްމީ ޗާޓު
            </p>
          </div>
          <div style={{ height: "1px", background: "rgba(186,42,49,0.2)", marginBottom: "20px" }} />

          {cinemaEntries.length > 0 && (
            <div style={{ marginBottom: "2rem" }}>
              <p style={{ fontFamily: FONT, fontSize: "10px", fontWeight: 700, color: TEXT_MUTED, margin: "0 0 12px", letterSpacing: "0.05em" }}>
                ސިނަމާ · އޮލިމްޕަސް
              </p>
              <div>
                {cinemaEntries.map(function(entry, i) {
                  return (
                    <button key={entry.id} onClick={function() { onCinemaClick(entry); }}
                      style={{ display: "flex", gap: "10px", padding: "10px 0", borderBottom: i < cinemaEntries.length - 1 ? "0.5px solid " + DIVIDER : "none", alignItems: "flex-start", background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "right" }}>
                      {entry.featured_image ? (
                        <div style={{ width: "38px", height: "54px", borderRadius: "5px", overflow: "hidden", flexShrink: 0, background: BG_CARD }}>
                          <img src={entry.featured_image} alt={entry.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      ) : (
                        <div style={{ width: "38px", height: "54px", borderRadius: "5px", flexShrink: 0, background: BG_CARD }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontFamily: FONT, fontSize: "11px", fontWeight: 700, color: TEXT, margin: "0 0 5px", lineHeight: 1.5, textAlign: "right" }} dir="rtl">{entry.title}</p>
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                          <span style={{ fontFamily: FONT, fontSize: "9px", fontWeight: 700, padding: "1px 6px", borderRadius: "10px",
                            background: entry.chart_type === "cinema_now" ? RED : "rgb(240,239,233)",
                            color: entry.chart_type === "cinema_now" ? "white" : "rgb(100,100,100)" }}>
                            {entry.chart_type === "cinema_now" ? "މިހާރު" : "އަންނަނީ"}
                          </span>
                          {entry.performance === "hit" && <span style={{ fontSize: "11px" }}>{"🔥"}</span>}
                          {entry.performance === "flop" && <span style={{ fontSize: "11px" }}>{"😞"}</span>}
                          {entry.performance === "houseful" && <span style={{ fontFamily: FONT, fontSize: "9px", fontWeight: 700, padding: "1px 5px", borderRadius: "10px", background: "#fef9c3", color: "#854d0e" }}>{"🎟"}</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {cinemaEntries.length > 0 && ottEntries.length > 0 && (
            <div style={{ borderTop: "0.5px solid " + DIVIDER, marginBottom: "1.5rem" }} />
          )}

          {ottEntries.length > 0 && (
            <div>
              <p style={{ fontFamily: FONT, fontSize: "10px", fontWeight: 700, color: TEXT_MUTED, margin: "0 0 12px", letterSpacing: "0.05em" }}>
                {"OTT · Netflix · Apple · Video Club"}
              </p>
              <div>
                {ottEntries.map(function(entry, i) {
                  return (
                    <button key={entry.id} onClick={function() { onOTTClick(entry); }}
                      style={{ display: "flex", gap: "10px", padding: "10px 0", borderBottom: i < ottEntries.length - 1 ? "0.5px solid " + DIVIDER : "none", alignItems: "flex-start", background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "right" }}>
                      <span style={{ fontFamily: "Georgia,serif", fontSize: "14px", fontWeight: 700, color: i < 3 ? RED : TEXT_MUTED, minWidth: "18px", lineHeight: 1, paddingTop: "2px", flexShrink: 0 }}>{entry.rank}</span>
                      {entry.poster_url ? (
                        <div style={{ width: "38px", height: "54px", borderRadius: "5px", overflow: "hidden", flexShrink: 0, background: BG_CARD }}>
                          <img src={entry.poster_url} alt={entry.title_dv} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      ) : (
                        <div style={{ width: "38px", height: "54px", borderRadius: "5px", flexShrink: 0, background: BG_CARD }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontFamily: FONT, fontSize: "11px", fontWeight: 700, color: TEXT, margin: "0 0 5px", lineHeight: 1.5, textAlign: "right" }} dir="rtl">{entry.title_dv}</p>
                        <span style={{ fontFamily: "sans-serif", fontSize: "9px", fontWeight: 700, padding: "1px 5px", borderRadius: "4px", color: "white", background: PLATFORM_COLORS[entry.platform] ?? "#666" }}>
                          {PLATFORM_LABELS[entry.platform] ?? entry.platform}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FilmCategoryPage({ articles, cinemaEntries, ottEntries, topRead, categorySlug, totalCount, page }: Props) {
  const [selectedCinema, setSelectedCinema] = useState<CinemaEntry | null>(null);
  const [selectedOTT, setSelectedOTT] = useState<OTTEntry | null>(null);

  const featured   = articles[0] ?? null;
  const grid3      = articles.slice(1, 4);
  const trending   = articles.slice(4, 9);
  const grid4      = articles.slice(9, 13);
  const showSidebar = cinemaEntries.length > 0 || ottEntries.length > 0 || topRead.length > 0;
  const totalPages = Math.ceil(totalCount / 12);

  return (
    <div style={{ backgroundColor: BG, minHeight: "100vh" }} dir="rtl">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header style={{ maxWidth: "72rem", margin: "0 auto", padding: "2rem 1.5rem 1.5rem", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
          <span style={{ color: "rgba(0,0,0,0.18)", fontSize: "11px" }}>{"✦"}</span>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(2rem,5vw,3.5rem)", color: RED, lineHeight: 1.5, fontWeight: 400, margin: 0 }}>
            ފިލްމު
          </h1>
          <span style={{ color: "rgba(0,0,0,0.18)", fontSize: "11px" }}>{"✦"}</span>
        </div>
      </header>

      <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "0 1.5rem 4rem" }}>
        <div className={showSidebar ? "film-layout" : ""}>

          <div>

            {featured && (
              <>
                <div className="film-featured" style={{ marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      {getFirstTag(featured.tags) && (
                        <span style={{ fontFamily: FONT, fontSize: "10px", fontWeight: 700, color: RED, background: "transparent", border: "1.5px solid " + RED, padding: "4px 12px", borderRadius: "20px", display: "inline-block", marginBottom: "12px", letterSpacing: "0.05em", lineHeight: 1.6 }}>
                          {getFirstTag(featured.tags)}
                        </span>
                      )}
                      <Link href={"/" + (featured.category?.slug ?? categorySlug) + "/" + featured.slug}
                        style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: RED, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px", marginBottom: "16px", borderBottom: "1px solid " + RED, paddingBottom: "1px" }}>
                        {"މުޅި އާޓިކަލް ކިޔާލަން ←"}
                      </Link>
                      {featured.excerpt && (
                        <p style={{ fontFamily: FONT, fontSize: "14px", color: "rgb(60,58,52)", lineHeight: 2, margin: "0 0 16px" }} className="lc4">
                          {featured.excerpt}
                        </p>
                      )}
                    </div>
                    <div>
                      {featured.author && (
                        <p style={{ fontFamily: FONT, fontSize: "11px", color: TEXT_MUTED, margin: "0 0 3px" }}>
                          {featured.author.full_name}
                        </p>
                      )}
                      {featured.published_at && (
                        <p style={{ fontFamily: FONT, fontSize: "10px", color: TEXT_MUTED, margin: "0 0 3px" }}>
                          {formatDate(featured.published_at)}
                        </p>
                      )}
                      {featured.reading_time_minutes && (
                        <p style={{ fontFamily: FONT, fontSize: "10px", color: TEXT_MUTED, margin: 0 }}>
                          {featured.reading_time_minutes + " މިނެޓު"}
                        </p>
                      )}
                    </div>
                  </div>
                  <Link href={"/" + (featured.category?.slug ?? categorySlug) + "/" + featured.slug} style={{ textDecoration: "none", display: "block" }}>
                    <div style={{ aspectRatio: "1/1", overflow: "hidden", borderRadius: "10px", background: BG_CARD }}>
                      {featured.featured_image
                        ? <img src={featured.featured_image} alt={featured.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.6s ease" }}
                            onMouseOver={function(e) { (e.currentTarget as HTMLImageElement).style.transform = "scale(1.04)"; }}
                            onMouseOut={function(e) { (e.currentTarget as HTMLImageElement).style.transform = "scale(1)"; }} />
                        : <div style={{ width: "100%", height: "100%", background: BG_CARD }} />
                      }
                    </div>
                  </Link>
                </div>
                <div style={{ borderTop: "0.5px solid " + DIVIDER, marginBottom: "1.5rem" }} />
              </>
            )}

            {grid3.length > 0 && (
              <>
                <div className="film-3col" style={{ marginBottom: "1.5rem" }}>
                  {grid3.map(function(a) { return <ArticleCard key={a.id} article={a} categorySlug={categorySlug} />; })}
                </div>
                <div style={{ borderTop: "0.5px solid " + DIVIDER, marginBottom: "1.5rem" }} />
              </>
            )}

            {trending.length > 0 && (
              <>
                <SectionLabel>ފިލްމު ތެރޭ ޓްރެންޑިން</SectionLabel>
                <div style={{ marginBottom: "1.5rem" }}>
                  {trending.map(function(article, i) {
                    const tag = getFirstTag(article.tags);
                    return (
                      <Link key={article.id} href={"/" + (article.category?.slug ?? categorySlug) + "/" + article.slug} style={{ textDecoration: "none", display: "block" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 0", borderBottom: "0.5px solid " + DIVIDER }}>
                          <span style={{ fontFamily: "Georgia,serif", fontSize: "22px", fontWeight: 700, color: i < 2 ? RED : "rgb(200,197,190)", minWidth: "28px", lineHeight: 1 }}>
                            {i + 1}
                          </span>
                          <div style={{ width: "54px", height: "70px", borderRadius: "6px", overflow: "hidden", flexShrink: 0, background: BG_CARD }}>
                            {article.featured_image && <img src={article.featured_image} alt={article.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                          </div>
                          <div style={{ flex: 1 }}>
                            {tag && <span style={{ fontFamily: FONT, fontSize: "9px", fontWeight: 700, color: "white", background: RED, padding: "1px 7px", borderRadius: "10px", display: "inline-block", marginBottom: "4px" }}>{tag}</span>}
                            <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: "13px", lineHeight: 1.8, margin: "0 0 3px", color: TEXT }} className="lc2">{article.title}</p>
                            {article.author && <p style={{ fontFamily: FONT, fontSize: "10px", color: TEXT_MUTED, margin: 0 }}>{article.author.full_name}</p>}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
                <div style={{ borderTop: "0.5px solid " + DIVIDER, marginBottom: "1.5rem" }} />
              </>
            )}

            {grid4.length > 0 && (
              <>
                <div className="film-4col" style={{ marginBottom: "2rem" }}>
                  {grid4.map(function(a) { return <ArticleCard key={a.id} article={a} categorySlug={categorySlug} />; })}
                </div>
                {totalPages > 1 && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", paddingTop: "1rem", borderTop: "0.5px solid " + DIVIDER }}>
                    {page > 1 && (
                      <a href={"/" + categorySlug + "?page=" + (page - 1)}
                        style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: RED, textDecoration: "none", padding: "6px 14px", border: "0.5px solid " + RED, borderRadius: "6px" }}>
                        {"← ކުރީ"}
                      </a>
                    )}
                    <span style={{ fontFamily: FONT, fontSize: "12px", color: TEXT_MUTED }}>
                      {page + " / " + totalPages}
                    </span>
                    {page < totalPages && (
                      <a href={"/" + categorySlug + "?page=" + (page + 1)}
                        style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: RED, textDecoration: "none", padding: "6px 14px", border: "0.5px solid " + RED, borderRadius: "6px" }}>
                        {"ފަހަތް →"}
                      </a>
                    )}
                  </div>
                )}
              </>
            )}

          </div>

          {showSidebar && (
            <div className="film-sidebar-col" style={{ position: "sticky", top: "140px" }}>
              <Sidebar
                cinemaEntries={cinemaEntries}
                ottEntries={ottEntries}
                topRead={topRead}
                categorySlug={categorySlug}
                onCinemaClick={setSelectedCinema}
                onOTTClick={setSelectedOTT}
              />
            </div>
          )}

        </div>
      </div>

      {selectedCinema && <CinemaModal entry={selectedCinema} onClose={function() { setSelectedCinema(null); }} />}
      {selectedOTT && <OTTModal entry={selectedOTT} onClose={function() { setSelectedOTT(null); }} />}
    </div>
  );
}
