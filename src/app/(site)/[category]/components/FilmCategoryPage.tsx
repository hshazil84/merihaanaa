"use client";
// src/app/(site)/[category]/components/FilmCategoryPage.tsx

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
  category: { name: string; slug: string } | null;
  author?: { full_name: string } | null;
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

function getYouTubeId(url: string) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return m ? m[1] : null;
}

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
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
  return (
    <Link href={"/" + slug + "/" + article.slug} style={{ textDecoration: "none", display: "block" }}>
      <div style={{ aspectRatio: "3/4", overflow: "hidden", borderRadius: "8px", backgroundColor: BG_CARD, marginBottom: "10px" }}>
        {article.featured_image
          ? <img src={article.featured_image} alt={article.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }}
              onMouseOver={function(e) { (e.currentTarget as HTMLImageElement).style.transform = "scale(1.04)"; }}
              onMouseOut={function(e) { (e.currentTarget as HTMLImageElement).style.transform = "scale(1)"; }} />
          : <div style={{ width: "100%", height: "100%", backgroundColor: BG_CARD }} />
        }
      </div>
      {article.category && (
        <span style={{ fontFamily: FONT, fontSize: "9px", color: RED, fontWeight: 700, letterSpacing: "0.05em", display: "block", marginBottom: "3px" }}>
          {article.category.name}
        </span>
      )}
      <h3 style={{ fontFamily: FONT, fontWeight: 700, fontSize: "13px", color: TEXT, lineHeight: 1.9, margin: "0 0 4px" }}
        className="line-clamp-2">
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
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
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
              <h2 style={{ fontFamily: FONT, fontWeight: 700, fontSize: "17px", lineHeight: 1.7, margin: "0 0 6px", color: TEXT }}>
                {entry.title}
              </h2>
              {entry.showing_date && (
                <p style={{ fontFamily: FONT, fontSize: "11px", color: TEXT_MUTED, margin: 0 }}>
                  {formatDate(entry.showing_date)}
                </p>
              )}
            </div>
          </div>
          {entry.synopsis && (
            <p style={{ fontFamily: FONT, fontSize: "13px", color: "rgb(80,78,72)", lineHeight: 1.9, margin: "0 0 16px" }}>
              {entry.synopsis}
            </p>
          )}
          {ytId && (
            <div style={{ borderRadius: "10px", overflow: "hidden", aspectRatio: "16/9", marginBottom: "16px" }}>
              <iframe src={"https://www.youtube.com/embed/" + ytId} style={{ width: "100%", height: "100%", border: "none", display: "block" }}
                allowFullScreen allow="autoplay; encrypted-media" />
            </div>
          )}
          {entry.article_id && (
            <div style={{ paddingTop: "12px", borderTop: "0.5px solid " + DIVIDER }}>
              <a href={"/film/" + entry.article_id} style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: RED, textDecoration: "none" }}>
                ← ރިވިއު ކިޔާ
              </a>
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
          <span style={{ fontFamily: "sans-serif", fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", background: pm, color: "white" }}>
            {pl}
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: TEXT_MUTED, padding: "4px" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
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
              <h2 style={{ fontFamily: FONT, fontWeight: 700, fontSize: "17px", lineHeight: 1.7, margin: "0 0 4px", color: TEXT }}>
                {entry.title_dv}
              </h2>
              {entry.title_en && (
                <p style={{ fontFamily: "sans-serif", fontSize: "12px", color: TEXT_MUTED, margin: "0 0 8px" }}>{entry.title_en}</p>
              )}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
                {entry.genre && <span style={{ fontFamily: FONT, fontSize: "10px", color: TEXT_MUTED }}>{entry.genre}</span>}
                {entry.season && <span style={{ fontFamily: FONT, fontSize: "10px", color: TEXT_MUTED }}>{"S" + entry.season}</span>}
                {entry.episodes && <span style={{ fontFamily: FONT, fontSize: "10px", color: TEXT_MUTED }}>{entry.episodes + " eps"}</span>}
              </div>
              {entry.rating && (
                <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                  {[1,2,3,4,5].map(function(s) {
                    return (
                      <svg key={s} width="13" height="13" viewBox="0 0 24 24"
                        fill={(entry.rating ?? 0) >= s ? RED : "none"} stroke={RED} strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    );
                  })}
                  <span style={{ fontFamily: FONT, fontSize: "10px", color: TEXT_MUTED, marginRight: "4px" }}>{entry.rating + "/5"}</span>
                </div>
              )}
            </div>
          </div>
          {entry.synopsis && (
            <p style={{ fontFamily: FONT, fontSize: "13px", color: "rgb(80,78,72)", lineHeight: 1.9, margin: "0 0 16px" }}>
              {entry.synopsis}
            </p>
          )}
          <div style={{ display: "flex", gap: "12px", paddingTop: "12px", borderTop: "0.5px solid " + DIVIDER }}>
            {entry.ott_instagram && (
              <a href={entry.ott_instagram} target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: RED, textDecoration: "none" }}>
                ← Instagram
              </a>
            )}
            {entry.article_id && (
              <a href={"/film/" + entry.article_id}
                style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: RED, textDecoration: "none" }}>
                ← ރިވިއު ކިޔާ
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartSidebar({ cinemaEntries, ottEntries, onCinemaClick, onOTTClick }: {
  cinemaEntries: CinemaEntry[];
  ottEntries: OTTEntry[];
  onCinemaClick: (e: CinemaEntry) => void;
  onOTTClick: (e: OTTEntry) => void;
}) {
  return (
    <div style={{ borderRight: "0.5px solid " + DIVIDER, paddingRight: "1.5rem", paddingTop: "0.5rem" }}>

      {cinemaEntries.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <SectionLabel>ސިނަމާ</SectionLabel>
          <p style={{ fontFamily: FONT, fontSize: "10px", color: TEXT_MUTED, margin: "0 0 12px" }}>
            އޮލިމްޕަސް ސިނަމާ
          </p>
          <div>
            {cinemaEntries.map(function(entry, i) {
              return (
                <button key={entry.id}
                  onClick={function() { onCinemaClick(entry); }}
                  style={{ display: "flex", gap: "10px", padding: "10px 0", borderBottom: "0.5px solid " + DIVIDER, alignItems: "flex-start", background: "none", border_bottom: "none", cursor: "pointer", width: "100%", textAlign: "right" }}>
                  {entry.featured_image ? (
                    <div style={{ width: "38px", height: "54px", borderRadius: "5px", overflow: "hidden", flexShrink: 0, background: BG_CARD }}>
                      <img src={entry.featured_image} alt={entry.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  ) : (
                    <div style={{ width: "38px", height: "54px", borderRadius: "5px", flexShrink: 0, background: BG_CARD }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: FONT, fontSize: "11px", fontWeight: 700, color: TEXT, margin: "0 0 5px", lineHeight: 1.5, textAlign: "right" }} dir="rtl">
                      {entry.title}
                    </p>
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <span style={{
                        fontFamily: FONT, fontSize: "9px", fontWeight: 700, padding: "1px 6px", borderRadius: "10px",
                        background: entry.chart_type === "cinema_now" ? RED : "rgb(240,239,233)",
                        color: entry.chart_type === "cinema_now" ? "white" : "rgb(100,100,100)",
                      }}>
                        {entry.chart_type === "cinema_now" ? "މިހާރު" : "އަންނަނީ"}
                      </span>
                      {entry.performance === "hit" && <span style={{ fontSize: "11px" }}>{"🔥"}</span>}
                      {entry.performance === "flop" && <span style={{ fontSize: "11px" }}>{"😞"}</span>}
                      {entry.performance === "houseful" && (
                        <span style={{ fontFamily: FONT, fontSize: "9px", fontWeight: 700, padding: "1px 5px", borderRadius: "10px", background: "#fef9c3", color: "#854d0e" }}>
                          {"🎟"}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {cinemaEntries.length > 0 && ottEntries.length > 0 && (
        <div style={{ borderTop: "0.5px solid " + DIVIDER, marginBottom: "2rem" }} />
      )}

      {ottEntries.length > 0 && (
        <div>
          <SectionLabel>OTT ޓްރެންޑިން</SectionLabel>
          <p style={{ fontFamily: FONT, fontSize: "10px", color: TEXT_MUTED, margin: "0 0 12px" }}>
            {"Netflix · Apple · Video Club"}
          </p>
          <div>
            {ottEntries.map(function(entry, i) {
              return (
                <button key={entry.id}
                  onClick={function() { onOTTClick(entry); }}
                  style={{ display: "flex", gap: "10px", padding: "10px 0", borderBottom: i < ottEntries.length - 1 ? "0.5px solid " + DIVIDER : "none", alignItems: "flex-start", background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "right" }}>
                  <span style={{ fontFamily: "Georgia,serif", fontSize: "14px", fontWeight: 700, color: i < 3 ? RED : TEXT_MUTED, minWidth: "18px", lineHeight: 1, paddingTop: "2px" }}>
                    {entry.rank}
                  </span>
                  {entry.poster_url ? (
                    <div style={{ width: "38px", height: "54px", borderRadius: "5px", overflow: "hidden", flexShrink: 0, background: BG_CARD }}>
                      <img src={entry.poster_url} alt={entry.title_dv} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  ) : (
                    <div style={{ width: "38px", height: "54px", borderRadius: "5px", flexShrink: 0, background: BG_CARD }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: FONT, fontSize: "11px", fontWeight: 700, color: TEXT, margin: "0 0 5px", lineHeight: 1.5, textAlign: "right" }} dir="rtl">
                      {entry.title_dv}
                    </p>
                    <span style={{
                      fontFamily: "sans-serif", fontSize: "9px", fontWeight: 700, padding: "1px 5px",
                      borderRadius: "4px", color: "white", background: PLATFORM_COLORS[entry.platform] ?? "#666",
                    }}>
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
  );
}

export default function FilmCategoryPage({ articles, cinemaEntries, ottEntries, categorySlug, totalCount, page }: Props) {
  const [selectedCinema, setSelectedCinema] = useState<CinemaEntry | null>(null);
  const [selectedOTT, setSelectedOTT] = useState<OTTEntry | null>(null);

  const featured   = articles[0] ?? null;
  const grid3      = articles.slice(1, 4);
  const trending   = articles.slice(4, 9);
  const bottomGrid = articles.slice(9, 12);
  const showCharts = cinemaEntries.length > 0 || ottEntries.length > 0;

  return (
    <div style={{ backgroundColor: BG, minHeight: "100vh" }} dir="rtl">
      <style>{`
        .film-grid { display: grid; grid-template-columns: ${showCharts ? "1fr 200px" : "1fr"}; gap: 2.5rem; }
        .film-featured { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .film-3col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.25rem; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        @media (max-width: 768px) {
          .film-grid { grid-template-columns: 1fr !important; }
          .film-featured { grid-template-columns: 1fr !important; }
          .film-3col { grid-template-columns: 1fr 1fr !important; }
          .film-sidebar { display: none; }
        }
        @media (max-width: 480px) {
          .film-3col { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Header */}
      <header style={{ maxWidth: "72rem", margin: "0 auto", padding: "2rem 1.5rem 1.5rem", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
          <span style={{ color: "rgba(0,0,0,0.18)", fontSize: "11px" }}>✦</span>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(2rem,5vw,3.5rem)", color: RED, lineHeight: 1.5, fontWeight: 400, margin: 0 }}>
            ފިލްމު
          </h1>
          <span style={{ color: "rgba(0,0,0,0.18)", fontSize: "11px" }}>✦</span>
        </div>
      </header>

      <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "0 1.5rem 4rem" }}>
        <div className="film-grid">

          {/* Main content */}
          <div>

            {/* Featured */}
            {featured && (
              <>
                <div className="film-featured" style={{ marginBottom: "1.5rem" }}>
                  <div>
                    {featured.category && (
                      <span style={{ fontFamily: FONT, fontSize: "10px", color: RED, fontWeight: 700, letterSpacing: "0.05em", display: "block", marginBottom: "6px" }}>
                        {featured.category.name}
                      </span>
                    )}
                    <Link href={"/" + (featured.category?.slug ?? categorySlug) + "/" + featured.slug} style={{ textDecoration: "none" }}>
                      <h2 style={{ fontFamily: FONT, fontWeight: 700, fontSize: "clamp(1.1rem,2.5vw,1.4rem)", lineHeight: 1.8, margin: "0 0 10px", color: TEXT }}>
                        {featured.title}
                      </h2>
                    </Link>
                    {featured.excerpt && (
                      <p style={{ fontFamily: FONT, fontSize: "13px", color: "rgb(100,98,92)", lineHeight: 1.9, margin: "0 0 10px" }} className="line-clamp-3">
                        {featured.excerpt}
                      </p>
                    )}
                    {featured.author && (
                      <p style={{ fontFamily: FONT, fontSize: "11px", color: TEXT_MUTED, margin: 0 }}>
                        {featured.author.full_name}
                        {featured.reading_time_minutes ? " · " + featured.reading_time_minutes + " މިނެޓު" : ""}
                      </p>
                    )}
                  </div>
                  <Link href={"/" + (featured.category?.slug ?? categorySlug) + "/" + featured.slug} style={{ textDecoration: "none", display: "block" }}>
                    <div style={{ aspectRatio: "3/4", overflow: "hidden", borderRadius: "10px", background: BG_CARD }}>
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

            {/* 3-col grid */}
            {grid3.length > 0 && (
              <>
                <div className="film-3col" style={{ marginBottom: "1.5rem" }}>
                  {grid3.map(function(a) { return <ArticleCard key={a.id} article={a} categorySlug={categorySlug} />; })}
                </div>
                <div style={{ borderTop: "0.5px solid " + DIVIDER, marginBottom: "1.5rem" }} />
              </>
            )}

            {/* Trending */}
            {trending.length > 0 && (
              <>
                <SectionLabel>ފިލްމު ތެރޭ ޓްރެންޑިން</SectionLabel>
                <div style={{ marginBottom: "1.5rem" }}>
                  {trending.map(function(article, i) {
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
                            {article.category && (
                              <span style={{ fontFamily: FONT, fontSize: "9px", color: RED, fontWeight: 700, display: "block", marginBottom: "3px" }}>
                                {article.category.name}
                              </span>
                            )}
                            <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: "13px", lineHeight: 1.8, margin: "0 0 3px", color: TEXT }} className="line-clamp-2">
                              {article.title}
                            </p>
                            {article.author && (
                              <p style={{ fontFamily: FONT, fontSize: "10px", color: TEXT_MUTED, margin: 0 }}>
                                {article.author.full_name}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
                <div style={{ borderTop: "0.5px solid " + DIVIDER, marginBottom: "1.5rem" }} />
              </>
            )}

            {/* Bottom grid */}
            {bottomGrid.length > 0 && (
              <div className="film-3col">
                {bottomGrid.map(function(a) { return <ArticleCard key={a.id} article={a} categorySlug={categorySlug} />; })}
              </div>
            )}

          </div>

          {/* Sidebar */}
          {showCharts && (
            <div className="film-sidebar">
              <ChartSidebar
                cinemaEntries={cinemaEntries}
                ottEntries={ottEntries}
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
