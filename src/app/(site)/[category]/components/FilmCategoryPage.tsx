"use client";

import { useState } from "react";
import Link from "next/link";

interface Article {
  id: string; title: string; slug: string; excerpt: string | null;
  featured_image: string | null; reading_time_minutes: number | null;
  published_at: string | null; tags: any[] | null; view_count?: number | null;
  category: { name: string; slug: string } | null;
  author?: { full_name: string } | null;
}
interface CinemaEntry {
  id: string; chart_type: string; rank: number; title: string;
  status: string | null; article_id: string | null; featured_image: string | null;
  showing_date: string | null; performance: string | null;
  synopsis: string | null; trailer_url: string | null;
}
interface OTTEntry {
  id: string; rank: number; title_dv: string; title_en: string | null;
  platform: string; genre: string | null; season: number | null;
  episodes: number | null; rating: number | null; synopsis: string | null;
  poster_url: string | null; ott_instagram: string | null; article_id: string | null;
}
interface FeaturedOriginal {
  id: string; title: string; slug: string; description: string | null;
  thumbnail_url: string | null; cloudflare_stream_id: string | null;
  duration_seconds: number | null; type: string | null;
}
interface Props {
  articles: Article[]; cinemaEntries: CinemaEntry[]; ottEntries: OTTEntry[];
  topRead: any[]; featuredOriginal: FeaturedOriginal | null;
  categorySlug: string; totalCount: number; page: number;
}

const RED = "#ba2a31";
const FONT = '"MVTypewriter","Noto Sans Thaana",sans-serif';
const FONT_DISPLAY = '"SanguSuruhee","MVTypewriter","Noto Sans Thaana",sans-serif';
const BG = "#F5F3EF";
const BG_CARD = "#EBE8E1";
const TEXT = "rgb(26,26,26)";
const TEXT_MUTED = "rgb(140,138,132)";
const DIVIDER = "rgba(0,0,0,0.07)";
const SHADOW = "0 4px 20px rgba(0,0,0,0.07), 0 12px 40px rgba(0,0,0,0.10)";
const CF = "https://customer-hyktj7g4xsx8p15r.cloudflarestream.com";

const PCOLORS: Record<string, string> = { netflix: "#E50914", apple: "#555555", amazon: "#00A8E0", videoclub: "#E87060", baiskoafu: "#1a1a2e" };
const PLABELS: Record<string, string> = { netflix: "Netflix", apple: "Apple TV+", amazon: "Prime Video", videoclub: "Video Club", baiskoafu: "Baiskoafu" };

const CSS = [
  ".film-layout{display:grid;grid-template-columns:1fr 240px;gap:3rem;align-items:start;}",
  ".film-featured{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;align-items:start;}",
  ".film-3col{display:grid;grid-template-columns:1fr 1fr 1fr;gap:1.25rem;}",
  ".film-4col{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:1.25rem;}",
  ".film-trending-grid{display:grid;grid-template-columns:1fr 1fr;gap:2rem;align-items:start;}",
  ".lc2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}",
  ".lc4{display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;}",
  ".sheet-overlay{position:fixed;inset:0;z-index:50;background:rgba(0,0,0,0.55);display:flex;align-items:flex-end;justify-content:center;}",
  ".sheet-inner{background:white;width:100%;max-width:520px;border-radius:20px 20px 0 0;overflow:hidden;max-height:90vh;overflow-y:auto;}",
  "@media(min-width:768px){.sheet-overlay{align-items:center!important;}.sheet-inner{border-radius:16px!important;max-height:82vh!important;}}",
  "@media(max-width:1024px){.film-layout{grid-template-columns:1fr!important;}.film-sidebar-col{display:none!important;}.film-4col{grid-template-columns:1fr 1fr!important;}.film-trending-grid{grid-template-columns:1fr!important;}}",
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
function formatDuration(s: number | null) {
  if (!s) return null;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m + ":" + (sec < 10 ? "0" : "") + sec;
}
function getFirstTag(tags: any[] | null): string | null {
  if (!tags || !Array.isArray(tags) || tags.length === 0) return null;
  const raw = tags[0];
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && raw !== null) return raw.name ?? null;
  return null;
}

function ModalClose({ onClose }: { onClose: () => void }) {
  return (
    <button onClick={onClose}
      style={{ background: "rgba(0,0,0,0.06)", border: "none", cursor: "pointer", color: "rgb(100,98,92)", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 0 }}>
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
    </button>
  );
}

function CinemaModal({ entry, onClose }: { entry: CinemaEntry; onClose: () => void }) {
  const ytId = entry.trailer_url ? getYouTubeId(entry.trailer_url) : null;
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-inner" onClick={function(e) { e.stopPropagation(); }} dir="rtl">
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: "32px", height: "3px", borderRadius: "2px", background: "rgba(0,0,0,0.1)" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 20px 12px" }}>
          <ModalClose onClose={onClose} />
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <span style={{ fontFamily: FONT, fontSize: "10px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px",
              background: entry.chart_type === "cinema_now" ? RED : "rgb(240,239,233)",
              color: entry.chart_type === "cinema_now" ? "white" : "rgb(80,78,72)" }}>
              {entry.chart_type === "cinema_now" ? "މިހާރު ދައްކަނީ" : "އަންނަނީ"}
            </span>
            {entry.performance === "hit" && <span style={{ fontSize: "14px" }}>{"🔥"}</span>}
            {entry.performance === "flop" && <span style={{ fontSize: "14px" }}>{"😞"}</span>}
            {entry.performance === "houseful" && <span style={{ fontFamily: FONT, fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "20px", background: "#fef9c3", color: "#854d0e" }}>{"🎟 ހައުސްފުލް"}</span>}
          </div>
        </div>
        <div style={{ height: "0.5px", background: DIVIDER, margin: "0 20px" }} />
        <div style={{ display: "flex", gap: "16px", padding: "20px", alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontFamily: FONT, fontWeight: 700, fontSize: "20px", lineHeight: 1.7, margin: "0 0 5px", color: TEXT }} dir="rtl">{entry.title}</h2>
            {entry.showing_date && <p style={{ fontFamily: "system-ui,sans-serif", fontSize: "12px", color: TEXT_MUTED, margin: "0 0 14px", opacity: 0.7 }}>{formatDate(entry.showing_date)}</p>}
            {entry.synopsis && <p style={{ fontFamily: FONT, fontSize: "13px", color: "rgb(80,78,72)", lineHeight: 1.9, margin: "0 0 16px" }} dir="rtl">{entry.synopsis}</p>}
            {entry.article_id && (
              <a href={"/film/" + entry.article_id} style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: RED, textDecoration: "none", borderBottom: "1px solid rgba(186,42,49,0.3)", paddingBottom: "1px" }}>{"ރިވިއު ކިޔާ ←"}</a>
            )}
          </div>
          {entry.featured_image && (
            <div style={{ width: "96px", height: "96px", borderRadius: "10px", overflow: "hidden", flexShrink: 0, background: BG_CARD, boxShadow: SHADOW }}>
              <img src={entry.featured_image} alt={entry.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}
        </div>
        {ytId && (
          <div style={{ padding: "0 20px 20px" }}>
            <div style={{ height: "0.5px", background: DIVIDER, marginBottom: "16px" }} />
            <div style={{ borderRadius: "12px", overflow: "hidden", aspectRatio: "16/9" }}>
              <iframe src={"https://www.youtube.com/embed/" + ytId} style={{ width: "100%", height: "100%", border: "none", display: "block" }} allowFullScreen allow="autoplay; encrypted-media" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OTTModal({ entry, onClose }: { entry: OTTEntry; onClose: () => void }) {
  const pm = PCOLORS[entry.platform] ?? "#666";
  const pl = PLABELS[entry.platform] ?? entry.platform;
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-inner" onClick={function(e) { e.stopPropagation(); }} dir="rtl">
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: "32px", height: "3px", borderRadius: "2px", background: "rgba(0,0,0,0.1)" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 20px 12px" }}>
          <ModalClose onClose={onClose} />
          <span style={{ fontFamily: "system-ui,sans-serif", fontSize: "11px", fontWeight: 700, padding: "4px 12px", borderRadius: "20px", background: pm, color: "white" }}>{pl}</span>
        </div>
        <div style={{ height: "0.5px", background: DIVIDER, margin: "0 20px" }} />
        <div style={{ display: "flex", gap: "16px", padding: "20px", alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontFamily: FONT, fontWeight: 700, fontSize: "20px", lineHeight: 1.7, margin: "0 0 4px", color: TEXT }} dir="rtl">{entry.title_dv}</h2>
            {entry.title_en && <p style={{ fontFamily: "system-ui,sans-serif", fontSize: "12px", color: TEXT_MUTED, margin: "0 0 10px", opacity: 0.7 }}>{entry.title_en}</p>}
            <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", alignItems: "center", marginBottom: "10px" }}>
              {entry.genre && <span style={{ fontFamily: FONT, fontSize: "10px", color: TEXT_MUTED, background: "rgba(0,0,0,0.04)", padding: "2px 8px", borderRadius: "6px" }}>{entry.genre}</span>}
              {entry.season && <span style={{ fontFamily: "system-ui,sans-serif", fontSize: "10px", color: TEXT_MUTED, background: "rgba(0,0,0,0.04)", padding: "2px 8px", borderRadius: "6px" }}>{"S" + entry.season}</span>}
              {entry.episodes && <span style={{ fontFamily: "system-ui,sans-serif", fontSize: "10px", color: TEXT_MUTED, background: "rgba(0,0,0,0.04)", padding: "2px 8px", borderRadius: "6px" }}>{entry.episodes + " eps"}</span>}
            </div>
            {entry.rating && (
              <div style={{ display: "flex", alignItems: "center", gap: "3px", marginBottom: "12px" }}>
                {[1,2,3,4,5].map(function(s) {
                  return <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill={(entry.rating ?? 0) >= s ? RED : "none"} stroke={RED} strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
                })}
                <span style={{ fontFamily: FONT, fontSize: "11px", color: TEXT_MUTED, marginRight: "4px" }}>{entry.rating + "/5"}</span>
              </div>
            )}
            {entry.synopsis && <p style={{ fontFamily: FONT, fontSize: "13px", color: "rgb(80,78,72)", lineHeight: 1.9, margin: "0 0 16px" }} dir="rtl">{entry.synopsis}</p>}
            <div style={{ display: "flex", gap: "12px" }}>
              {entry.ott_instagram && <a href={entry.ott_instagram} target="_blank" rel="noopener noreferrer" style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: RED, textDecoration: "none", borderBottom: "1px solid rgba(186,42,49,0.3)", paddingBottom: "1px" }}>{"Instagram ←"}</a>}
              {entry.article_id && <a href={"/film/" + entry.article_id} style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: RED, textDecoration: "none", borderBottom: "1px solid rgba(186,42,49,0.3)", paddingBottom: "1px" }}>{"ރިވިއު ←"}</a>}
            </div>
          </div>
          {entry.poster_url && (
            <div style={{ width: "96px", height: "132px", borderRadius: "10px", overflow: "hidden", flexShrink: 0, background: BG_CARD, boxShadow: SHADOW }}>
              <img src={entry.poster_url} alt={entry.title_dv} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CinemaSidebar({ entries, onEntryClick }: { entries: CinemaEntry[]; onEntryClick: (e: CinemaEntry) => void }) {
  const [idx, setIdx] = useState(0);
  const nowShowing = entries.filter(function(e) { return e.chart_type === "cinema_now"; });
  const upcoming   = entries.filter(function(e) { return e.chart_type === "cinema_upcoming"; });
  const carousel   = nowShowing.length > 0 ? nowShowing : entries;
  const active     = carousel[Math.min(idx, carousel.length - 1)];
  if (!active) return null;

  return (
    <div style={{ background: "white", border: "0.5px solid rgba(0,0,0,0.07)", borderRadius: "16px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>

      {/* Header */}
      <div style={{ padding: "12px 16px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "5px" }}>
          {carousel.length > 1 && carousel.map(function(_, i) {
            return <button key={i} onClick={function() { setIdx(i); }}
              style={{ height: "5px", width: i === idx ? "18px" : "5px", borderRadius: "3px", background: i === idx ? RED : "rgba(0,0,0,0.12)", border: "none", cursor: "pointer", transition: "width 0.25s ease", padding: 0 }} />;
          })}
        </div>
        <p style={{ fontFamily: FONT, fontSize: "11px", fontWeight: 700, color: RED, margin: 0 }}>ސިނަމާ</p>
      </div>

      <div style={{ height: "0.5px", background: "rgba(0,0,0,0.05)", margin: "0 16px" }} />

      {/* 1:1 Poster */}
      <button onClick={function() { onEntryClick(active); }}
        style={{ display: "block", width: "100%", background: "none", border: "none", cursor: "pointer", padding: "14px 16px 10px" }}>
        <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", borderRadius: "10px", overflow: "hidden", background: BG_CARD, boxShadow: SHADOW, marginBottom: "10px" }}>
          {active.featured_image
            ? <img src={active.featured_image} alt={active.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ width: "100%", height: "100%", background: BG_CARD }} />
          }
          {/* Overlay badge */}
          <div style={{ position: "absolute", top: "8px", right: "8px", display: "flex", gap: "4px" }}>
            <span style={{ fontFamily: FONT, fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "10px",
              background: active.chart_type === "cinema_now" ? RED : "rgba(0,0,0,0.55)",
              color: "white", backdropFilter: "blur(4px)" }}>
              {active.chart_type === "cinema_now" ? "މިހާރު ދައްކަނީ" : "އަންނަނީ"}
            </span>
          </div>
          {/* Performance overlay */}
          {active.performance && (
            <div style={{ position: "absolute", top: "8px", left: "8px" }}>
              {active.performance === "hit" && <span style={{ fontSize: "16px" }}>{"🔥"}</span>}
              {active.performance === "flop" && <span style={{ fontSize: "16px" }}>{"😞"}</span>}
              {active.performance === "houseful" && <span style={{ fontFamily: FONT, fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "10px", background: "rgba(254,249,195,0.9)", color: "#854d0e" }}>{"🎟"}</span>}
            </div>
          )}
        </div>
        <p style={{ fontFamily: FONT, fontSize: "13px", fontWeight: 700, color: TEXT, margin: "0 0 3px", lineHeight: 1.5, textAlign: "right" }} dir="rtl">{active.title}</p>
        {active.showing_date && (
          <p style={{ fontFamily: "system-ui,sans-serif", fontSize: "11px", color: TEXT_MUTED, margin: "0 0 6px", textAlign: "right", opacity: 0.75 }}>{formatDate(active.showing_date)}</p>
        )}
        <p style={{ fontFamily: FONT, fontSize: "10px", fontWeight: 700, color: RED, margin: 0, textAlign: "right" }}>{"ތަފްސީލު ←"}</p>
      </button>

      {/* Upcoming strip */}
      {upcoming.length > 0 && (
        <>
          <div style={{ height: "0.5px", background: "rgba(0,0,0,0.05)", margin: "0 16px" }} />
          <div style={{ padding: "10px 16px 12px", display: "flex", alignItems: "center", gap: "10px" }}>
            <p style={{ fontFamily: FONT, fontSize: "9px", fontWeight: 700, color: TEXT_MUTED, margin: 0, flexShrink: 0 }}>ކުރިއަށް</p>
            <div style={{ display: "flex", gap: "7px" }}>
              {upcoming.slice(0, 3).map(function(e) {
                return (
                  <button key={e.id} onClick={function() { onEntryClick(e); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "5px", overflow: "hidden", background: BG_CARD, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                      {e.featured_image && <img src={e.featured_image} alt={e.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function OTTSidebar({ entries, onEntryClick }: { entries: OTTEntry[]; onEntryClick: (e: OTTEntry) => void }) {
  if (!entries.length) return null;
  return (
    <div style={{ background: "white", border: "0.5px solid rgba(0,0,0,0.07)", borderRadius: "16px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
      <div style={{ padding: "12px 16px 10px" }}>
        <p style={{ fontFamily: FONT, fontSize: "11px", fontWeight: 700, color: RED, margin: 0 }}>ޓްރެންޑިންގ އޯޓީޓީ ކޮންޓެންޓް</p>
      </div>
      <div style={{ height: "0.5px", background: "rgba(0,0,0,0.05)", margin: "0 16px" }} />

      {/* 3-col poster grid */}
      <div style={{ padding: "12px 16px 14px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
        {entries.slice(0, 6).map(function(entry, i) {
          const pm = PCOLORS[entry.platform] ?? "#666";
          const pl = PLABELS[entry.platform] ?? entry.platform;
          return (
            <button key={entry.id} onClick={function() { onEntryClick(entry); }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "right" }}>
              <div style={{ position: "relative", width: "100%", aspectRatio: "3/4", borderRadius: "8px", overflow: "hidden", background: BG_CARD, boxShadow: SHADOW, marginBottom: "5px" }}>
                {entry.poster_url
                  ? <img src={entry.poster_url} alt={entry.title_dv} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", background: BG_CARD }} />
                }
                {/* Rank badge */}
                <div style={{ position: "absolute", top: "5px", right: "5px", width: "18px", height: "18px", borderRadius: "50%", background: i < 3 ? RED : "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: "Georgia,serif", fontSize: "9px", fontWeight: 700, color: "white", lineHeight: 1 }}>{entry.rank}</span>
                </div>
                {/* Platform badge bottom */}
                <div style={{ position: "absolute", bottom: "5px", left: "5px" }}>
                  <span style={{ fontFamily: "system-ui,sans-serif", fontSize: "8px", fontWeight: 700, padding: "1px 5px", borderRadius: "3px", background: pm, color: "white" }}>{pl}</span>
                </div>
              </div>
              <p style={{ fontFamily: FONT, fontSize: "10px", fontWeight: 700, color: TEXT, margin: 0, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} dir="rtl">
                {entry.title_dv}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
      <div style={{ width: "3px", height: "14px", background: RED, borderRadius: "2px", flexShrink: 0 }} />
      <p style={{ fontFamily: FONT, fontSize: "11px", fontWeight: 700, color: TEXT, margin: 0, letterSpacing: "0.04em" }}>{children}</p>
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
      {tag && <span style={{ fontFamily: FONT, fontSize: "9px", fontWeight: 700, color: RED, border: "1px solid " + RED, padding: "2px 8px", borderRadius: "20px", display: "inline-block", marginBottom: "5px" }}>{tag}</span>}
      <h3 style={{ fontFamily: FONT, fontWeight: 700, fontSize: "13px", color: TEXT, lineHeight: 1.9, margin: "0 0 4px" }} className="lc2">{article.title}</h3>
      {article.author && <p style={{ fontFamily: FONT, fontSize: "10px", color: TEXT_MUTED, margin: 0 }}>{article.author.full_name}</p>}
    </Link>
  );
}

export default function FilmCategoryPage({ articles, cinemaEntries, ottEntries, featuredOriginal, categorySlug, totalCount, page }: Props) {
  const [selectedCinema, setSelectedCinema] = useState<CinemaEntry | null>(null);
  const [selectedOTT, setSelectedOTT]       = useState<OTTEntry | null>(null);

  const featured   = articles[0] ?? null;
  const grid3      = articles.slice(1, 4);
  const trending   = articles.slice(4, 9);
  const grid4      = articles.slice(9, 13);
  const showSidebar = cinemaEntries.length > 0 || ottEntries.length > 0;
  const totalPages = Math.ceil(totalCount / 12);

  return (
    <div style={{ backgroundColor: BG, minHeight: "100vh" }} dir="rtl">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header style={{ maxWidth: "72rem", margin: "0 auto", padding: "2rem 1.5rem 1.5rem", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
          <span style={{ color: "rgba(0,0,0,0.18)", fontSize: "11px" }}>{"✦"}</span>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(2rem,5vw,3.5rem)", color: RED, lineHeight: 1.5, fontWeight: 400, margin: 0 }}>ފިލްމު</h1>
          <span style={{ color: "rgba(0,0,0,0.18)", fontSize: "11px" }}>{"✦"}</span>
        </div>
      </header>

      <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "0 1.5rem 4rem" }}>
        <div className={showSidebar ? "film-layout" : ""}>
          <div>

            {featured && (
              <>
                <div className="film-featured" style={{ marginBottom: "1.5rem" }}>
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
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      {getFirstTag(featured.tags) && (
                        <span style={{ fontFamily: FONT, fontSize: "10px", fontWeight: 700, color: RED, border: "1.5px solid " + RED, padding: "4px 12px", borderRadius: "20px", display: "inline-block", marginBottom: "12px", letterSpacing: "0.05em", lineHeight: 1.6 }}>
                          {getFirstTag(featured.tags)}
                        </span>
                      )}
                      <Link href={"/" + (featured.category?.slug ?? categorySlug) + "/" + featured.slug} style={{ textDecoration: "none" }}>
                        <h2 style={{ fontFamily: FONT, fontWeight: 700, fontSize: "clamp(1.1rem,2.5vw,1.4rem)", lineHeight: 1.8, margin: "0 0 10px", color: TEXT }}>{featured.title}</h2>
                      </Link>
                      {featured.excerpt && (
                        <p style={{ fontFamily: FONT, fontSize: "14px", color: "rgb(60,58,52)", lineHeight: 2, margin: "0 0 14px" }} className="lc4">{featured.excerpt}</p>
                      )}
                      <Link href={"/" + (featured.category?.slug ?? categorySlug) + "/" + featured.slug}
                        style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: RED, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px", marginBottom: "16px", borderBottom: "1px solid rgba(186,42,49,0.3)", paddingBottom: "1px" }}>
                        {"މުޅި އާޓިކަލް ކިޔާލަން ←"}
                      </Link>
                    </div>
                    <div>
                      {featured.author && <p style={{ fontFamily: FONT, fontSize: "11px", color: TEXT_MUTED, margin: "0 0 3px" }}>{featured.author.full_name}</p>}
                      {featured.published_at && <p style={{ fontFamily: "system-ui,sans-serif", fontSize: "11px", color: TEXT_MUTED, margin: "0 0 3px", opacity: 0.75 }}>{formatDate(featured.published_at)}</p>}
                      {featured.reading_time_minutes && <p style={{ fontFamily: FONT, fontSize: "10px", color: TEXT_MUTED, margin: 0 }}>{featured.reading_time_minutes + " މިނެޓު"}</p>}
                    </div>
                  </div>
                </div>
                <div style={{ borderTop: "0.5px solid " + DIVIDER, marginBottom: "1.5rem" }} />
              </>
            )}

            {grid3.length > 0 && (
              <>
                <div className="film-3col" style={{ marginBottom: "1.5rem" }}>
                  {grid3.map(function(a) { return <ArticleCard key={a.id} article={a} categorySlug={categorySlug} />; })}
                </div>
                <div style={{ borderTop: "0.5px solid " + DIVIDER }} />
              </>
            )}

            {(trending.length > 0 || featuredOriginal) && (
              <div style={{ background: "rgb(20,18,16)", margin: "0 -1.5rem", padding: "2rem 1.5rem", marginBottom: "1.5rem" }}>
                <div style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "3px", height: "14px", background: RED, borderRadius: "2px", flexShrink: 0 }} />
                  <p style={{ fontFamily: FONT, fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.7)", margin: 0, letterSpacing: "0.04em" }}>ފިލްމު ތެރޭ ޓްރެންޑިން</p>
                </div>
                <div className="film-trending-grid">
                  {featuredOriginal && featuredOriginal.cloudflare_stream_id && (
                    <div>
                      <div style={{ borderRadius: "10px", overflow: "hidden", aspectRatio: "16/9", marginBottom: "12px", background: "rgb(10,10,10)" }}>
                        <iframe src={CF + "/" + featuredOriginal.cloudflare_stream_id + "/iframe"}
                          style={{ width: "100%", height: "100%", border: "none", display: "block" }}
                          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                      </div>
                      <p style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.9)", margin: "0 0 4px" }} dir="rtl">{featuredOriginal.title}</p>
                      {featuredOriginal.description && <p style={{ fontFamily: FONT, fontSize: "11px", color: "rgba(255,255,255,0.45)", margin: "0 0 6px", lineHeight: 1.7 }} className="lc2" dir="rtl">{featuredOriginal.description}</p>}
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        {featuredOriginal.type && <span style={{ fontFamily: FONT, fontSize: "9px", fontWeight: 700, color: RED, border: "1px solid " + RED, padding: "1px 7px", borderRadius: "10px" }}>{featuredOriginal.type}</span>}
                        {featuredOriginal.duration_seconds && <span style={{ fontFamily: FONT, fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>{formatDuration(featuredOriginal.duration_seconds)}</span>}
                      </div>
                    </div>
                  )}
                  {trending.length > 0 && (
                    <div>
                      {trending.map(function(article, i) {
                        const tag = getFirstTag(article.tags);
                        return (
                          <Link key={article.id} href={"/" + (article.category?.slug ?? categorySlug) + "/" + article.slug} style={{ textDecoration: "none", display: "block" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
                              <span style={{ fontFamily: "Georgia,serif", fontSize: "20px", fontWeight: 700, color: i < 2 ? RED : "rgba(255,255,255,0.2)", minWidth: "26px", lineHeight: 1 }}>{i + 1}</span>
                              <div style={{ width: "52px", height: "52px", borderRadius: "6px", overflow: "hidden", flexShrink: 0, background: "rgba(255,255,255,0.08)" }}>
                                {article.featured_image && <img src={article.featured_image} alt={article.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                              </div>
                              <div style={{ flex: 1 }}>
                                {tag && <span style={{ fontFamily: FONT, fontSize: "9px", fontWeight: 700, color: RED, display: "block", marginBottom: "3px" }}>{tag}</span>}
                                <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: "12px", lineHeight: 1.7, margin: "0 0 2px", color: "rgba(255,255,255,0.85)" }} className="lc2">{article.title}</p>
                                {article.author && <p style={{ fontFamily: FONT, fontSize: "10px", color: "rgba(255,255,255,0.35)", margin: 0 }}>{article.author.full_name}</p>}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {grid4.length > 0 && (
              <>
                <div className="film-4col" style={{ marginBottom: "2rem" }}>
                  {grid4.map(function(a) { return <ArticleCard key={a.id} article={a} categorySlug={categorySlug} />; })}
                </div>
                {totalPages > 1 && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", paddingTop: "1rem", borderTop: "0.5px solid " + DIVIDER }}>
                    {page > 1 && <a href={"/" + categorySlug + "?page=" + (page - 1)} style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: RED, textDecoration: "none", padding: "6px 14px", border: "0.5px solid " + RED, borderRadius: "6px" }}>{"← ކުރީ"}</a>}
                    <span style={{ fontFamily: FONT, fontSize: "12px", color: TEXT_MUTED }}>{page + " / " + totalPages}</span>
                    {page < totalPages && <a href={"/" + categorySlug + "?page=" + (page + 1)} style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: RED, textDecoration: "none", padding: "6px 14px", border: "0.5px solid " + RED, borderRadius: "6px" }}>{"ފަހަތް →"}</a>}
                  </div>
                )}
              </>
            )}

          </div>

          {showSidebar && (
            <div className="film-sidebar-col" style={{ position: "sticky", top: "140px", display: "flex", flexDirection: "column", gap: "14px" }}>
              {cinemaEntries.length > 0 && <CinemaSidebar entries={cinemaEntries} onEntryClick={setSelectedCinema} />}
              {ottEntries.length > 0 && <OTTSidebar entries={ottEntries} onEntryClick={setSelectedOTT} />}
            </div>
          )}
        </div>
      </div>

      {selectedCinema && <CinemaModal entry={selectedCinema} onClose={function() { setSelectedCinema(null); }} />}
      {selectedOTT    && <OTTModal    entry={selectedOTT}    onClose={function() { setSelectedOTT(null); }} />}
    </div>
  );
}
