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

const CORAL = "#E87060";

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

function CategoryTag({ name }: { name: string }) {
  return (
    <span className="inline-block text-[9px] px-2 py-0.5 rounded-full border"
      style={{ fontFamily: "'MVTypewriter','MV Boli',sans-serif", color: CORAL, borderColor: CORAL, backgroundColor: "rgba(232,112,96,0.06)", lineHeight: 2 }}>
      {name}
    </span>
  );
}

function ColLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div style={{ width: "3px", height: "16px", background: CORAL, borderRadius: "2px", flexShrink: 0 }} />
      <p style={{ fontFamily: "'MVTypewriter','MV Boli',sans-serif", fontSize: "13px", fontWeight: 700, color: "rgb(26,26,26)", margin: 0 }}>
        {children}
      </p>
    </div>
  );
}

function ArticleCard({ article, categorySlug }: { article: Article; categorySlug: string }) {
  const slug = article.category?.slug ?? categorySlug;
  return (
    <Link href={"/" + slug + "/" + article.slug} className="group block">
      <div className="aspect-[3/4] overflow-hidden rounded-lg bg-[#e8e5de] mb-3">
        {article.featured_image
          ? <img src={article.featured_image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full bg-[#dedad2]" />
        }
      </div>
      {article.category && <div className="mb-1.5"><CategoryTag name={article.category.name} /></div>}
      <h3 className="line-clamp-3 group-hover:opacity-70 transition-opacity"
        style={{ fontFamily: '"MVTypewriter","Noto Sans Thaana",sans-serif', fontWeight: 700, fontSize: "13px", color: "rgb(26,26,26)", lineHeight: 2 }}>
        {article.title}
      </h3>
    </Link>
  );
}

function CinemaModal({ entry, onClose }: { entry: CinemaEntry; onClose: () => void }) {
  const ytId = entry.trailer_url ? getYouTubeId(entry.trailer_url) : null;
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-0 md:p-4" onClick={onClose}>
      <div className="bg-white w-full md:max-w-lg rounded-t-2xl md:rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={function(e) { e.stopPropagation(); }} dir="rtl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8e5de]">
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{
              fontSize: "10px", fontFamily: "'MVTypewriter','MV Boli',sans-serif", fontWeight: 700,
              padding: "2px 8px", borderRadius: "20px",
              background: entry.chart_type === "cinema_now" ? CORAL : "rgb(240,239,233)",
              color: entry.chart_type === "cinema_now" ? "white" : "rgb(100,100,100)",
            }}>
              {entry.chart_type === "cinema_now" ? "މިހާރު ދައްކަނީ" : "އަންނަނީ"}
            </span>
            {entry.performance === "hit" && <span style={{ fontSize: "11px" }}>{"🔥 Hit"}</span>}
            {entry.performance === "flop" && <span style={{ fontSize: "11px" }}>{"😞 Flop"}</span>}
            {entry.performance === "houseful" && (
              <span style={{ fontSize: "10px", background: "#fef9c3", color: "#854d0e", padding: "2px 7px", borderRadius: "20px", fontFamily: "'MVTypewriter','MV Boli',sans-serif", fontWeight: 700 }}>
                {"🎟 ހައުސްފުލް"}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-[rgb(153,153,153)] hover:text-[rgb(26,26,26)] transition-colors p-1">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="p-5">
          <div className="flex gap-4 mb-4">
            {entry.featured_image && (
              <div style={{ width: "90px", height: "120px", borderRadius: "8px", overflow: "hidden", flexShrink: 0, background: "rgb(232,229,222)" }}>
                <img src={entry.featured_image} alt={entry.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <h2 style={{ fontFamily: '"MVTypewriter","Noto Sans Thaana",sans-serif', fontWeight: 700, fontSize: "18px", lineHeight: 1.6, margin: "0 0 6px", color: "rgb(26,26,26)" }}>
                {entry.title}
              </h2>
              {entry.showing_date && (
                <p style={{ fontFamily: "'MVTypewriter','MV Boli',sans-serif", fontSize: "11px", color: "rgb(153,153,153)", margin: "0 0 4px" }}>
                  {formatDate(entry.showing_date)}
                </p>
              )}
            </div>
          </div>
          {entry.synopsis && (
            <p style={{ fontFamily: '"MVTypewriter","Noto Sans Thaana",sans-serif', fontSize: "13px", color: "rgb(80,78,72)", lineHeight: 1.9, margin: "0 0 16px" }}>
              {entry.synopsis}
            </p>
          )}
          {ytId && (
            <div style={{ borderRadius: "10px", overflow: "hidden", aspectRatio: "16/9", marginBottom: "16px" }}>
              <iframe
                src={"https://www.youtube.com/embed/" + ytId}
                className="w-full h-full"
                allowFullScreen
                allow="autoplay; encrypted-media"
                style={{ border: "none", display: "block" }}
              />
            </div>
          )}
          {entry.article_id && (
            <div style={{ paddingTop: "12px", borderTop: "0.5px solid rgb(232,229,222)" }}>
              <a href={"/film/" + entry.article_id}
                className="inline-flex items-center gap-2 font-body text-xs font-semibold hover:opacity-70 transition-opacity"
                style={{ color: CORAL, fontFamily: "'MVTypewriter','MV Boli',sans-serif" }}>
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
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-0 md:p-4" onClick={onClose}>
      <div className="bg-white w-full md:max-w-lg rounded-t-2xl md:rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={function(e) { e.stopPropagation(); }} dir="rtl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8e5de]">
          <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", background: pm, color: "white", fontFamily: "'MVTypewriter','MV Boli',sans-serif" }}>
            {pl}
          </span>
          <button onClick={onClose} className="text-[rgb(153,153,153)] hover:text-[rgb(26,26,26)] transition-colors p-1">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="p-5">
          <div className="flex gap-4 mb-4">
            {entry.poster_url && (
              <div style={{ width: "90px", height: "120px", borderRadius: "8px", overflow: "hidden", flexShrink: 0, background: "rgb(232,229,222)" }}>
                <img src={entry.poster_url} alt={entry.title_dv} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <h2 style={{ fontFamily: '"MVTypewriter","Noto Sans Thaana",sans-serif', fontWeight: 700, fontSize: "18px", lineHeight: 1.6, margin: "0 0 4px", color: "rgb(26,26,26)" }}>
                {entry.title_dv}
              </h2>
              {entry.title_en && (
                <p style={{ fontFamily: "sans-serif", fontSize: "12px", color: "rgb(153,153,153)", margin: "0 0 8px" }}>{entry.title_en}</p>
              )}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
                {entry.genre && <span style={{ fontSize: "10px", fontFamily: "'MVTypewriter','MV Boli',sans-serif", color: "rgb(153,153,153)" }}>{entry.genre}</span>}
                {entry.season && <span style={{ fontSize: "10px", fontFamily: "'MVTypewriter','MV Boli',sans-serif", color: "rgb(153,153,153)" }}>{"Season " + entry.season}</span>}
                {entry.episodes && <span style={{ fontSize: "10px", fontFamily: "'MVTypewriter','MV Boli',sans-serif", color: "rgb(153,153,153)" }}>{entry.episodes + " eps"}</span>}
              </div>
              {entry.rating && (
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  {[1,2,3,4,5].map(function(s) {
                    return (
                      <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill={(entry.rating ?? 0) >= s ? CORAL : "none"} stroke={CORAL} strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    );
                  })}
                  <span style={{ fontSize: "11px", color: "rgb(153,153,153)", fontFamily: "'MVTypewriter','MV Boli',sans-serif" }}>{entry.rating + "/5"}</span>
                </div>
              )}
            </div>
          </div>
          {entry.synopsis && (
            <p style={{ fontFamily: '"MVTypewriter","Noto Sans Thaana",sans-serif', fontSize: "13px", color: "rgb(80,78,72)", lineHeight: 1.9, margin: "0 0 16px" }}>
              {entry.synopsis}
            </p>
          )}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", paddingTop: "12px", borderTop: "0.5px solid rgb(232,229,222)" }}>
            {entry.ott_instagram && (
              <a href={entry.ott_instagram} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: "12px", color: CORAL, fontFamily: "'MVTypewriter','MV Boli',sans-serif", fontWeight: 700 }}>
                ← Instagram
              </a>
            )}
            {entry.article_id && (
              <a href={"/film/" + entry.article_id}
                style={{ fontSize: "12px", color: CORAL, fontFamily: "'MVTypewriter','MV Boli',sans-serif", fontWeight: 700 }}>
                ← ރިވިއު ކިޔާ
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartSidebar({
  cinemaEntries,
  ottEntries,
  onCinemaClick,
  onOTTClick,
}: {
  cinemaEntries: CinemaEntry[];
  ottEntries: OTTEntry[];
  onCinemaClick: (e: CinemaEntry) => void;
  onOTTClick: (e: OTTEntry) => void;
}) {
  return (
    <div style={{ borderRight: "0.5px solid rgb(224,221,214)", paddingRight: "1.5rem" }}>

      {cinemaEntries.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <ColLabel>ސިނަމާ</ColLabel>
          <p style={{ fontFamily: "'MVTypewriter','MV Boli',sans-serif", fontSize: "10px", color: "rgb(153,153,153)", margin: "0 0 10px" }}>
            އޮލިމްޕަސް ސިނަމާ
          </p>
          <div style={{ borderTop: "0.5px solid rgb(224,221,214)" }}>
            {cinemaEntries.map(function(entry, i) {
              return (
                <button key={entry.id} onClick={function() { onCinemaClick(entry); }}
                  style={{ display: "flex", gap: "8px", padding: "8px 0", borderBottom: "0.5px dashed rgb(224,221,214)", alignItems: "flex-start", background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "right" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: i < 2 ? CORAL : "rgb(153,153,153)", minWidth: "16px", fontFamily: "serif" }}>
                    {entry.rank}
                  </span>
                  {entry.featured_image && (
                    <div style={{ width: "36px", height: "50px", borderRadius: "4px", overflow: "hidden", flexShrink: 0, background: "rgb(232,229,222)" }}>
                      <img src={entry.featured_image} alt={entry.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "'MVTypewriter','MV Boli',sans-serif", fontSize: "11px", fontWeight: 700, color: "rgb(26,26,26)", margin: "0 0 4px", lineHeight: 1.5, textAlign: "right" }} dir="rtl">
                      {entry.title}
                    </p>
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: "9px", fontFamily: "'MVTypewriter','MV Boli',sans-serif",
                        padding: "1px 5px", borderRadius: "10px",
                        background: entry.chart_type === "cinema_now" ? CORAL : "rgb(240,239,233)",
                        color: entry.chart_type === "cinema_now" ? "white" : "rgb(100,100,100)",
                      }}>
                        {entry.chart_type === "cinema_now" ? "މިހާރު ދައްކަނީ" : "އަންނަނީ"}
                      </span>
                      {entry.performance === "hit" && <span style={{ fontSize: "10px" }}>{"🔥"}</span>}
                      {entry.performance === "flop" && <span style={{ fontSize: "10px" }}>{"😞"}</span>}
                      {entry.performance === "houseful" && (
                        <span style={{ fontSize: "9px", background: "#fef9c3", color: "#854d0e", padding: "1px 5px", borderRadius: "10px", fontFamily: "'MVTypewriter','MV Boli',sans-serif" }}>
                          {"🎟 ހައުސްފުލް"}
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
        <div style={{ borderTop: "0.5px solid rgb(224,221,214)", marginBottom: "1.5rem" }} />
      )}

      {ottEntries.length > 0 && (
        <div>
          <ColLabel>OTT ޓްރެންޑިން</ColLabel>
          <p style={{ fontFamily: "'MVTypewriter','MV Boli',sans-serif", fontSize: "10px", color: "rgb(153,153,153)", margin: "0 0 10px" }}>
            {"Netflix · Apple · Amazon · Video Club"}
          </p>
          <div style={{ borderTop: "0.5px solid rgb(224,221,214)" }}>
            {ottEntries.map(function(entry, i) {
              return (
                <button key={entry.id} onClick={function() { onOTTClick(entry); }}
                  style={{ display: "flex", gap: "8px", padding: "8px 0", borderBottom: i < ottEntries.length - 1 ? "0.5px dashed rgb(224,221,214)" : "none", alignItems: "flex-start", background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "right" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: i < 3 ? CORAL : "rgb(153,153,153)", minWidth: "16px", fontFamily: "serif" }}>
                    {entry.rank}
                  </span>
                  {entry.poster_url && (
                    <div style={{ width: "36px", height: "50px", borderRadius: "4px", overflow: "hidden", flexShrink: 0, background: "rgb(232,229,222)" }}>
                      <img src={entry.poster_url} alt={entry.title_dv} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "'MVTypewriter','MV Boli',sans-serif", fontSize: "11px", fontWeight: 700, color: "rgb(26,26,26)", margin: "0 0 3px", lineHeight: 1.5, textAlign: "right" }} dir="rtl">
                      {entry.title_dv}
                    </p>
                    <span style={{
                      fontSize: "9px", fontWeight: 700, padding: "1px 5px", borderRadius: "4px",
                      color: "white", background: PLATFORM_COLORS[entry.platform] ?? "#666",
                      fontFamily: "sans-serif",
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
    <div className="bg-[#F5F3EF]" dir="rtl">
      <div className="max-w-6xl mx-auto px-6 py-10">

        <header style={{ textAlign: "center", padding: "2rem 0 1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
            <span style={{ color: "rgba(0,0,0,0.18)", fontSize: "11px" }}>✦</span>
            <h1 style={{ fontFamily: '"SanguSuruhee","MVTypewriter","Noto Sans Thaana",sans-serif', fontSize: "clamp(2rem, 5vw, 3.5rem)", color: "#E87060", lineHeight: 1.5, fontWeight: 400, margin: 0 }}>
              ފިލްމު
            </h1>
            <span style={{ color: "rgba(0,0,0,0.18)", fontSize: "11px" }}>✦</span>
          </div>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: showCharts ? "1fr 220px" : "1fr", gap: "2.5rem" }}>

          <div>
            {featured && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
                  <div>
                    {featured.category && <div style={{ marginBottom: "6px" }}><CategoryTag name={featured.category.name} /></div>}
                    <Link href={"/" + (featured.category?.slug ?? categorySlug) + "/" + featured.slug} className="group block">
                      <h2 className="group-hover:opacity-70 transition-opacity"
                        style={{ fontFamily: '"MVTypewriter","Noto Sans Thaana",sans-serif', fontWeight: 700, fontSize: "18px", lineHeight: 1.8, margin: "0 0 10px", color: "rgb(26,26,26)" }}>
                        {featured.title}
                      </h2>
                    </Link>
                    {featured.excerpt && (
                      <p style={{ fontFamily: '"MVTypewriter","Noto Sans Thaana",sans-serif', fontSize: "13px", color: "rgb(110,108,102)", lineHeight: 1.8, margin: "0 0 8px" }}>
                        {featured.excerpt}
                      </p>
                    )}
                    {featured.author && (
                      <p style={{ fontFamily: "'MVTypewriter','MV Boli',sans-serif", fontSize: "11px", color: "rgb(153,153,153)", margin: 0 }}>
                        {featured.author.full_name}
                      </p>
                    )}
                  </div>
                  <Link href={"/" + (featured.category?.slug ?? categorySlug) + "/" + featured.slug} className="group block">
                    <div className="aspect-[3/4] overflow-hidden rounded-lg bg-[#e8e5de]">
                      {featured.featured_image
                        ? <img src={featured.featured_image} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        : <div className="w-full h-full bg-[#dedad2]" />
                      }
                    </div>
                  </Link>
                </div>
                <div style={{ borderTop: "0.5px solid rgb(224,221,214)", marginBottom: "1.5rem" }} />
              </>
            )}

            {grid3.length > 0 && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem", marginBottom: "1.5rem" }}>
                  {grid3.map(function(a) { return <ArticleCard key={a.id} article={a} categorySlug={categorySlug} />; })}
                </div>
                <div style={{ borderTop: "0.5px solid rgb(224,221,214)", marginBottom: "1.5rem" }} />
              </>
            )}

            {trending.length > 0 && (
              <>
                <ColLabel>ފިލްމު ތެރޭ ޓްރެންޑިން</ColLabel>
                <div style={{ borderTop: "0.5px solid rgb(224,221,214)" }}>
                  {trending.map(function(article, i) {
                    return (
                      <Link key={article.id} href={"/" + (article.category?.slug ?? categorySlug) + "/" + article.slug} className="group block">
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 0", borderBottom: "0.5px solid rgb(232,229,222)" }}>
                          <span style={{ fontSize: "22px", fontWeight: 700, color: i < 2 ? CORAL : "rgb(200,197,190)", minWidth: "28px", fontFamily: "serif", lineHeight: 1 }}>
                            {i + 1}
                          </span>
                          <div style={{ width: "56px", height: "72px", borderRadius: "6px", overflow: "hidden", flexShrink: 0, background: "rgb(232,229,222)" }}>
                            {article.featured_image && <img src={article.featured_image} alt={article.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                          </div>
                          <div style={{ flex: 1 }}>
                            {article.category && <div style={{ marginBottom: "3px" }}><CategoryTag name={article.category.name} /></div>}
                            <p className="group-hover:opacity-70 transition-opacity"
                              style={{ fontFamily: '"MVTypewriter","Noto Sans Thaana",sans-serif', fontWeight: 700, fontSize: "13px", lineHeight: 1.8, margin: "0 0 3px", color: "rgb(26,26,26)" }}>
                              {article.title}
                            </p>
                            {article.author && (
                              <p style={{ fontFamily: "'MVTypewriter','MV Boli',sans-serif", fontSize: "10px", color: "rgb(153,153,153)", margin: 0 }}>
                                {article.author.full_name}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
                <div style={{ borderTop: "0.5px solid rgb(224,221,214)", marginBottom: "1.5rem", marginTop: "0.25rem" }} />
              </>
            )}

            {bottomGrid.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem" }}>
                {bottomGrid.map(function(a) { return <ArticleCard key={a.id} article={a} categorySlug={categorySlug} />; })}
              </div>
            )}
          </div>

          {showCharts && (
            <ChartSidebar
              cinemaEntries={cinemaEntries}
              ottEntries={ottEntries}
              onCinemaClick={setSelectedCinema}
              onOTTClick={setSelectedOTT}
            />
          )}
        </div>
      </div>

      {selectedCinema && <CinemaModal entry={selectedCinema} onClose={function() { setSelectedCinema(null); }} />}
      {selectedOTT && <OTTModal entry={selectedOTT} onClose={function() { setSelectedOTT(null); }} />}
    </div>
  );
}
