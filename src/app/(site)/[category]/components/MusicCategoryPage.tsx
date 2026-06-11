"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface Article {
  id: string; title: string; slug: string; excerpt: string | null;
  featured_image: string | null; reading_time_minutes: number | null;
  published_at: string | null; tags: any[] | null; view_count?: number | null;
  category: { name: string; slug: string } | null;
  author?: { full_name: string } | null;
}
interface ChartEntry {
  id: string; chart_type: string; rank: number; title: string;
  subtitle: string | null; status: string | null; article_id: string | null;
  featured_image: string | null; showing_date: string | null;
  synopsis: string | null; trailer_url: string | null; performance: string | null;
}
interface FeaturedOriginal {
  id: string; title: string; slug: string; description: string | null;
  thumbnail_url: string | null; cloudflare_stream_id: string | null;
  duration_seconds: number | null; type: string | null;
}
interface Props {
  articles: Article[];
  trendingSongs: ChartEntry[];
  musicEvents: ChartEntry[];
  featuredOriginal: FeaturedOriginal | null;
  categorySlug: string;
  totalCount: number;
  page: number;
}

const GREEN = "#71bc22";
const BG = "#2b2a28";
const BG_CARD = "#3a3936";
const BG_SIDEBAR = "#323130";
const TEXT = "#f0ede7";
const TEXT_MUTED = "rgba(240,237,231,0.45)";
const DIVIDER = "rgba(240,237,231,0.08)";
const SHADOW = "0 4px 20px rgba(0,0,0,0.3), 0 12px 40px rgba(0,0,0,0.4)";
const FONT = '"MVTypewriter","Noto Sans Thaana",sans-serif';
const FONT_DISPLAY = '"SanguSuruhee","MVTypewriter","Noto Sans Thaana",sans-serif';
const CF = "https://customer-hyktj7g4xsx8p15r.cloudflarestream.com";

const CSS = [
  ".music-layout{display:grid;grid-template-columns:1fr 240px;gap:3rem;align-items:start;}",
  ".music-featured{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;align-items:start;}",
  ".music-3col{display:grid;grid-template-columns:1fr 1fr 1fr;gap:1.25rem;}",
  ".music-4col{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:1.25rem;}",
  ".music-trending-grid{display:grid;grid-template-columns:1fr 1fr;gap:2rem;align-items:start;}",
  ".lc2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}",
  ".lc4{display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;}",
  ".sheet-overlay{position:fixed;inset:0;z-index:50;background:rgba(0,0,0,0.7);display:flex;align-items:flex-end;justify-content:center;}",
  ".sheet-inner{background:#323130;width:100%;max-width:520px;border-radius:20px 20px 0 0;overflow:hidden;max-height:90vh;overflow-y:auto;}",
  "@media(min-width:768px){.sheet-overlay{align-items:center!important;}.sheet-inner{border-radius:16px!important;max-height:82vh!important;}}",
  "@media(max-width:1024px){.music-layout{grid-template-columns:1fr!important;}.music-sidebar-col{display:none!important;}.music-4col{grid-template-columns:1fr 1fr!important;}.music-trending-grid{grid-template-columns:1fr!important;}}",
  "@media(max-width:768px){.music-featured{grid-template-columns:1fr!important;}.music-3col{grid-template-columns:1fr 1fr!important;}}",
  "@media(max-width:480px){.music-3col,.music-4col{grid-template-columns:1fr!important;}}",
].join("");

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
      style={{ background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer", color: TEXT, width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 0 }}>
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
    </button>
  );
}

function SongModal({ entry, onClose }: { entry: ChartEntry; onClose: () => void }) {
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-inner" onClick={function(e) { e.stopPropagation(); }} dir="rtl">
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: "32px", height: "3px", borderRadius: "2px", background: "rgba(255,255,255,0.15)" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 20px 12px" }}>
          <ModalClose onClose={onClose} />
          <span style={{ fontFamily: FONT, fontSize: "10px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px", background: GREEN, color: "#1a1a1a" }}>
            {"# " + entry.rank}
          </span>
        </div>
        <div style={{ height: "0.5px", background: DIVIDER, margin: "0 20px" }} />
        <div style={{ display: "flex", gap: "16px", padding: "20px", alignItems: "flex-start" }}>
          {entry.featured_image && (
            <div style={{ width: "88px", height: "88px", borderRadius: "10px", overflow: "hidden", flexShrink: 0, background: BG_CARD, boxShadow: SHADOW, position: "relative" }}>
              <Image src={entry.featured_image} alt={entry.title} fill sizes="88px" className="object-cover" />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontFamily: FONT, fontWeight: 700, fontSize: "20px", lineHeight: 1.7, margin: "0 0 4px", color: TEXT }} dir="rtl">{entry.title}</h2>
            {entry.subtitle && <p style={{ fontFamily: FONT, fontSize: "13px", color: TEXT_MUTED, margin: "0 0 12px", lineHeight: 1.6 }}>{entry.subtitle}</p>}
            {entry.synopsis && <p style={{ fontFamily: FONT, fontSize: "13px", color: TEXT, lineHeight: 1.9, margin: "0 0 14px", opacity: 0.75 }} dir="rtl">{entry.synopsis}</p>}
            {entry.article_id && (
              <a href={"/" + entry.article_id} style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: GREEN, textDecoration: "none", borderBottom: "1px solid rgba(113,188,34,0.4)", paddingBottom: "1px" }}>{"ލިޔުން ކިޔާ ←"}</a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EventModal({ entry, onClose }: { entry: ChartEntry; onClose: () => void }) {
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-inner" onClick={function(e) { e.stopPropagation(); }} dir="rtl">
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: "32px", height: "3px", borderRadius: "2px", background: "rgba(255,255,255,0.15)" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 20px 12px" }}>
          <ModalClose onClose={onClose} />
          <span style={{ fontFamily: FONT, fontSize: "10px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px", background: "rgba(113,188,34,0.15)", color: GREEN }}>
            އިވެންޓް
          </span>
        </div>
        <div style={{ height: "0.5px", background: DIVIDER, margin: "0 20px" }} />
        <div style={{ display: "flex", gap: "16px", padding: "20px", alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontFamily: FONT, fontWeight: 700, fontSize: "20px", lineHeight: 1.7, margin: "0 0 5px", color: TEXT }} dir="rtl">{entry.title}</h2>
            {entry.subtitle && <p style={{ fontFamily: FONT, fontSize: "13px", color: TEXT_MUTED, margin: "0 0 10px" }}>{entry.subtitle}</p>}
            {entry.showing_date && <p style={{ fontFamily: "system-ui,sans-serif", fontSize: "12px", color: TEXT_MUTED, margin: "0 0 14px" }}>{formatDate(entry.showing_date)}</p>}
            {entry.synopsis && <p style={{ fontFamily: FONT, fontSize: "13px", color: TEXT, lineHeight: 1.9, margin: "0 0 14px", opacity: 0.75 }} dir="rtl">{entry.synopsis}</p>}
            {entry.article_id && (
              <a href={"/" + entry.article_id} style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: GREEN, textDecoration: "none", borderBottom: "1px solid rgba(113,188,34,0.4)", paddingBottom: "1px" }}>{"ލިޔުން ކިޔާ ←"}</a>
            )}
          </div>
          {entry.featured_image && (
            <div style={{ width: "96px", height: "96px", borderRadius: "10px", overflow: "hidden", flexShrink: 0, background: BG_CARD, boxShadow: SHADOW, position: "relative" }}>
              <Image src={entry.featured_image} alt={entry.title} fill sizes="96px" className="object-cover" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TrendingSongsSidebar({ entries, onEntryClick }: { entries: ChartEntry[]; onEntryClick: (e: ChartEntry) => void }) {
  if (!entries.length) return null;
  return (
    <div style={{ background: BG_SIDEBAR, border: "0.5px solid rgba(255,255,255,0.06)", borderRadius: "16px", overflow: "hidden" }}>
      <div style={{ padding: "12px 16px 10px" }}>
        <p style={{ fontFamily: FONT, fontSize: "11px", fontWeight: 700, color: GREEN, margin: 0 }}>ޓްރެންޑިން ލަވަ</p>
      </div>
      <div style={{ height: "0.5px", background: DIVIDER, margin: "0 16px" }} />
      <div style={{ padding: "4px 0 6px" }}>
        {entries.map(function(entry, i) {
          return (
            <button key={entry.id} onClick={function() { onEntryClick(entry); }}
              style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "9px 16px", background: "none", border: "none", cursor: "pointer", borderBottom: i < entries.length - 1 ? "0.5px solid " + DIVIDER : "none", textAlign: "right" }}>
              <span style={{ fontFamily: "Georgia,serif", fontSize: "15px", fontWeight: 700, color: i < 3 ? GREEN : "rgba(255,255,255,0.15)", minWidth: "20px", textAlign: "center", flexShrink: 0 }}>
                {entry.rank}
              </span>
              <div style={{ width: "42px", height: "42px", borderRadius: "7px", overflow: "hidden", flexShrink: 0, background: BG_CARD, position: "relative" }}>
                {entry.featured_image
                  ? <Image src={entry.featured_image} alt={entry.title} fill sizes="42px" className="object-cover" />
                  : <div style={{ width: "100%", height: "100%", background: BG_CARD, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                    </div>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: TEXT, margin: "0 0 3px", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} dir="rtl">{entry.title}</p>
                {entry.subtitle && <p style={{ fontFamily: FONT, fontSize: "10px", color: TEXT_MUTED, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.subtitle}</p>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MusicEventsSidebar({ entries, onEntryClick }: { entries: ChartEntry[]; onEntryClick: (e: ChartEntry) => void }) {
  if (!entries.length) return null;
  return (
    <div style={{ background: BG_SIDEBAR, border: "0.5px solid rgba(255,255,255,0.06)", borderRadius: "16px", overflow: "hidden" }}>
      <div style={{ padding: "12px 16px 10px" }}>
        <p style={{ fontFamily: FONT, fontSize: "11px", fontWeight: 700, color: GREEN, margin: 0 }}>ކުރިއަށް ހުރި ޝޯތައް</p>
      </div>
      <div style={{ height: "0.5px", background: DIVIDER, margin: "0 16px" }} />
      <div style={{ padding: "4px 0 6px" }}>
        {entries.map(function(entry, i) {
          return (
            <button key={entry.id} onClick={function() { onEntryClick(entry); }}
              style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "10px 16px", background: "none", border: "none", cursor: "pointer", borderBottom: i < entries.length - 1 ? "0.5px solid " + DIVIDER : "none", textAlign: "right" }}>
              {entry.showing_date && (
                <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", background: BG_CARD, border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: "8px", overflow: "hidden", width: "38px", flexShrink: 0 }}>
                  <div style={{ background: GREEN, width: "100%", padding: "2px 0", textAlign: "center" }}>
                    <span style={{ fontFamily: "system-ui,sans-serif", fontSize: "8px", fontWeight: 600, color: "#1a1a1a", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                      {new Date(entry.showing_date).toLocaleDateString("en-US", { month: "short" })}
                    </span>
                  </div>
                  <div style={{ padding: "2px 0 3px", textAlign: "center" }}>
                    <span style={{ fontFamily: "system-ui,sans-serif", fontSize: "16px", fontWeight: 300, color: TEXT, lineHeight: 1 }}>
                      {new Date(entry.showing_date).getDate()}
                    </span>
                  </div>
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: TEXT, margin: "0 0 3px", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} dir="rtl">{entry.title}</p>
                {entry.subtitle && <p style={{ fontFamily: FONT, fontSize: "10px", color: TEXT_MUTED, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.subtitle}</p>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ArticleCard({ article, categorySlug }: { article: Article; categorySlug: string }) {
  const slug = article.category?.slug ?? categorySlug;
  const tag = getFirstTag(article.tags);
  return (
    <Link href={"/" + slug + "/" + article.slug} style={{ textDecoration: "none", display: "block" }}>
      <div style={{ aspectRatio: "4/3", overflow: "hidden", borderRadius: "8px", backgroundColor: BG_CARD, marginBottom: "10px", position: "relative" }}>
        {article.featured_image
          ? <Image src={article.featured_image} alt={article.title} fill sizes="(max-width: 480px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover" style={{ transition: "transform 0.5s ease" }} />
          : <div style={{ width: "100%", height: "100%", backgroundColor: BG_CARD }} />
        }
      </div>
      {tag && <span style={{ fontFamily: FONT, fontSize: "9px", fontWeight: 700, color: GREEN, border: "1px solid " + GREEN, padding: "2px 8px", borderRadius: "20px", display: "inline-block", marginBottom: "5px" }}>{tag}</span>}
      <h3 style={{ fontFamily: FONT, fontWeight: 700, fontSize: "13px", color: TEXT, lineHeight: 1.9, margin: "0 0 4px" }} className="lc2">{article.title}</h3>
      {article.author && <p style={{ fontFamily: FONT, fontSize: "10px", color: TEXT_MUTED, margin: 0 }}>{article.author.full_name}</p>}
    </Link>
  );
}

export default function MusicCategoryPage({ articles, trendingSongs, musicEvents, featuredOriginal, categorySlug, totalCount, page }: Props) {
  const [selectedSong, setSelectedSong]   = useState<ChartEntry | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ChartEntry | null>(null);

  const featured   = articles[0] ?? null;
  const grid3      = articles.slice(1, 4);
  const trending   = articles.slice(4, 9);
  const grid4      = articles.slice(9, 13);
  const showSidebar = trendingSongs.length > 0 || musicEvents.length > 0;
  const totalPages = Math.ceil(totalCount / 12);

  return (
    <div style={{ backgroundColor: BG, minHeight: "100vh" }} dir="rtl">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header style={{ maxWidth: "72rem", margin: "0 auto", padding: "2rem 1.5rem 1.5rem", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
          <span style={{ color: "rgba(113,188,34,0.3)", fontSize: "11px" }}>{"✦"}</span>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(2rem,5vw,3.5rem)", color: GREEN, lineHeight: 1.5, fontWeight: 400, margin: 0 }}>މިއުޒިކް</h1>
          <span style={{ color: "rgba(113,188,34,0.3)", fontSize: "11px" }}>{"✦"}</span>
        </div>
      </header>

      <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "0 1.5rem 4rem" }}>
        <div className={showSidebar ? "music-layout" : ""}>
          <div>

            {featured && (
              <>
                <div className="music-featured" style={{ marginBottom: "1.5rem" }}>
                  <Link href={"/" + (featured.category?.slug ?? categorySlug) + "/" + featured.slug} style={{ textDecoration: "none", display: "block" }}>
                    <div style={{ aspectRatio: "1/1", overflow: "hidden", borderRadius: "10px", background: BG_CARD, position: "relative" }}>
                      {featured.featured_image
                        ? <Image src={featured.featured_image} alt={featured.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" priority />
                        : <div style={{ width: "100%", height: "100%", background: BG_CARD }} />
                      }
                    </div>
                  </Link>
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      {getFirstTag(featured.tags) && (
                        <span style={{ fontFamily: FONT, fontSize: "10px", fontWeight: 700, color: GREEN, border: "1.5px solid " + GREEN, padding: "4px 12px", borderRadius: "20px", display: "inline-block", marginBottom: "12px", letterSpacing: "0.05em", lineHeight: 1.6 }}>
                          {getFirstTag(featured.tags)}
                        </span>
                      )}
                      <Link href={"/" + (featured.category?.slug ?? categorySlug) + "/" + featured.slug} style={{ textDecoration: "none" }}>
                        <h2 style={{ fontFamily: FONT, fontWeight: 700, fontSize: "clamp(1.1rem,2.5vw,1.4rem)", lineHeight: 1.8, margin: "0 0 10px", color: TEXT }}>{featured.title}</h2>
                      </Link>
                      {featured.excerpt && (
                        <p style={{ fontFamily: FONT, fontSize: "14px", color: TEXT_MUTED, lineHeight: 2, margin: "0 0 14px" }} className="lc4">{featured.excerpt}</p>
                      )}
                      <Link href={"/" + (featured.category?.slug ?? categorySlug) + "/" + featured.slug}
                        style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: GREEN, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px", marginBottom: "16px", borderBottom: "1px solid rgba(113,188,34,0.4)", paddingBottom: "1px" }}>
                        {"މުޅި އާޓިކަލް ކިޔާލަން ←"}
                      </Link>
                    </div>
                    <div>
                      {featured.author && <p style={{ fontFamily: FONT, fontSize: "11px", color: TEXT_MUTED, margin: "0 0 3px" }}>{featured.author.full_name}</p>}
                      {featured.published_at && <p style={{ fontFamily: "system-ui,sans-serif", fontSize: "11px", color: TEXT_MUTED, margin: "0 0 3px" }}>{formatDate(featured.published_at)}</p>}
                      {featured.reading_time_minutes && <p style={{ fontFamily: FONT, fontSize: "10px", color: TEXT_MUTED, margin: 0 }}>{featured.reading_time_minutes + " މިނެޓު"}</p>}
                    </div>
                  </div>
                </div>
                <div style={{ borderTop: "0.5px solid " + DIVIDER, marginBottom: "1.5rem" }} />
              </>
            )}

            {grid3.length > 0 && (
              <>
                <div className="music-3col" style={{ marginBottom: "1.5rem" }}>
                  {grid3.map(function(a) { return <ArticleCard key={a.id} article={a} categorySlug={categorySlug} />; })}
                </div>
                <div style={{ borderTop: "0.5px solid " + DIVIDER }} />
              </>
            )}

            {(trending.length > 0 || featuredOriginal) && (
              <div style={{ background: "rgba(0,0,0,0.3)", border: "0.5px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "2rem 1.5rem", marginBottom: "1.5rem" }}>
                <div style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "3px", height: "14px", background: GREEN, borderRadius: "2px", flexShrink: 0 }} />
                  <p style={{ fontFamily: FONT, fontSize: "11px", fontWeight: 700, color: "rgba(240,237,231,0.6)", margin: 0, letterSpacing: "0.04em" }}>މިއުޒިކް ތެރޭ ޓްރެންޑިން</p>
                </div>
                <div className="music-trending-grid">
                  {featuredOriginal && featuredOriginal.cloudflare_stream_id && (
                    <div>
                      <div style={{ borderRadius: "10px", overflow: "hidden", aspectRatio: "16/9", marginBottom: "12px", background: "rgb(10,10,10)" }}>
                        <iframe src={CF + "/" + featuredOriginal.cloudflare_stream_id + "/iframe"}
                          style={{ width: "100%", height: "100%", border: "none", display: "block" }}
                          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                      </div>
                      <p style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: TEXT, margin: "0 0 4px" }} dir="rtl">{featuredOriginal.title}</p>
                      {featuredOriginal.description && <p style={{ fontFamily: FONT, fontSize: "11px", color: TEXT_MUTED, margin: "0 0 6px", lineHeight: 1.7 }} className="lc2" dir="rtl">{featuredOriginal.description}</p>}
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        {featuredOriginal.type && <span style={{ fontFamily: FONT, fontSize: "9px", fontWeight: 700, color: GREEN, border: "1px solid " + GREEN, padding: "1px 7px", borderRadius: "10px" }}>{featuredOriginal.type}</span>}
                        {featuredOriginal.duration_seconds && <span style={{ fontFamily: FONT, fontSize: "10px", color: TEXT_MUTED }}>{formatDuration(featuredOriginal.duration_seconds)}</span>}
                      </div>
                    </div>
                  )}
                  {trending.length > 0 && (
                    <div>
                      {trending.map(function(article, i) {
                        const tag = getFirstTag(article.tags);
                        return (
                          <Link key={article.id} href={"/" + (article.category?.slug ?? categorySlug) + "/" + article.slug} style={{ textDecoration: "none", display: "block" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
                              <span style={{ fontFamily: "Georgia,serif", fontSize: "20px", fontWeight: 700, color: i < 2 ? GREEN : "rgba(255,255,255,0.15)", minWidth: "26px", lineHeight: 1 }}>{i + 1}</span>
                              <div style={{ width: "52px", height: "52px", borderRadius: "6px", overflow: "hidden", flexShrink: 0, background: BG_CARD, position: "relative" }}>
                                {article.featured_image && <Image src={article.featured_image} alt={article.title} fill sizes="52px" className="object-cover" />}
                              </div>
                              <div style={{ flex: 1 }}>
                                {tag && <span style={{ fontFamily: FONT, fontSize: "9px", fontWeight: 700, color: GREEN, display: "block", marginBottom: "3px" }}>{tag}</span>}
                                <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: "12px", lineHeight: 1.7, margin: "0 0 2px", color: TEXT }} className="lc2">{article.title}</p>
                                {article.author && <p style={{ fontFamily: FONT, fontSize: "10px", color: TEXT_MUTED, margin: 0 }}>{article.author.full_name}</p>}
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
                <div className="music-4col" style={{ marginBottom: "2rem" }}>
                  {grid4.map(function(a) { return <ArticleCard key={a.id} article={a} categorySlug={categorySlug} />; })}
                </div>
                {totalPages > 1 && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", paddingTop: "1rem", borderTop: "0.5px solid " + DIVIDER }}>
                    {page > 1 && <a href={"/" + categorySlug + "?page=" + (page - 1)} style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: GREEN, textDecoration: "none", padding: "6px 14px", border: "0.5px solid " + GREEN, borderRadius: "6px" }}>{"← ކުރީ"}</a>}
                    <span style={{ fontFamily: FONT, fontSize: "12px", color: TEXT_MUTED }}>{page + " / " + totalPages}</span>
                    {page < totalPages && <a href={"/" + categorySlug + "?page=" + (page + 1)} style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: GREEN, textDecoration: "none", padding: "6px 14px", border: "0.5px solid " + GREEN, borderRadius: "6px" }}>{"ފަހަތް →"}</a>}
                  </div>
                )}
              </>
            )}

          </div>

          {showSidebar && (
            <div className="music-sidebar-col" style={{ position: "sticky", top: "140px", display: "flex", flexDirection: "column", gap: "14px" }}>
              {trendingSongs.length > 0 && <TrendingSongsSidebar entries={trendingSongs} onEntryClick={setSelectedSong} />}
              {musicEvents.length > 0 && <MusicEventsSidebar entries={musicEvents} onEntryClick={setSelectedEvent} />}
            </div>
          )}
        </div>
      </div>

      {selectedSong  && <SongModal  entry={selectedSong}  onClose={function() { setSelectedSong(null); }} />}
      {selectedEvent && <EventModal entry={selectedEvent} onClose={function() { setSelectedEvent(null); }} />}
    </div>
  );
}
