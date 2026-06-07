"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Search, X, Plus, Check, RefreshCw, Trash2,
  Star, ChevronDown, Edit2, GripVertical, ExternalLink,
  ImageIcon, Loader2, Flame, Frown, Ticket, Link as LinkIcon,
} from "lucide-react";
import { processImage, ACCEPTED_IMAGE_TYPES } from "@/lib/imageUtils";

// ── Types ──────────────────────────────────────────────────────────────────
type Platform = "netflix" | "apple" | "amazon" | "videoclub" | "baiskoafu";
type Performance = "hit" | "flop" | "houseful" | null;
type Status = "cinema_now" | "cinema_upcoming";

interface CinemaEntry {
  id: string;
  chart_type: Status;
  rank: number;
  title: string;
  subtitle: string | null;
  status: string | null;
  article_id: string | null;
  featured_image: string | null;
  showing_date: string | null;
  performance: Performance;
  synopsis: string | null;
  trailer_url: string | null;
}

interface SeriesEntry {
  id: string;
  rank: number;
  title_dv: string;
  title_en: string | null;
  platform: Platform;
  genre: string | null;
  season: number | null;
  episodes: number | null;
  rating: number | null;
  synopsis: string | null;
  poster_url: string | null;
  ott_instagram: string | null;
  article_id: string | null;
  is_active: boolean;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  featured_image: string | null;
  category: { name: string; slug: string } | null;
}

const PLATFORM_META: Record<Platform, { label: string; color: string }> = {
  netflix:   { label: "Netflix",     color: "#E50914" },
  apple:     { label: "Apple TV+",   color: "#555555" },
  amazon:    { label: "Prime Video", color: "#00A8E0" },
  videoclub: { label: "Video Club",  color: "#E87060" },
  baiskoafu: { label: "Baiskoafu",   color: "#1a1a2e" },
};

const GENRES = ["ތްރިލަރ","ޑްރާމާ","ކޮމެޑީ","ހޮރަ","ރޮމޭންސް","ސައި-ފައި","ކްރައިމް","ޑޮކިއުމެންޓްރީ","އެކްޝަން","ފެންޓަސީ"];

// ── Helpers ────────────────────────────────────────────────────────────────
function getYouTubeId(url: string) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return m ? m[1] : null;
}

// ── Shared: Poster Uploader ────────────────────────────────────────────────
function PosterUploader({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const blob = await processImage(file, { targetW: 900, targetH: 1200, watermark: false });
      const fd = new FormData();
      fd.append("file", new File([blob], `poster-${Date.now()}.jpg`, { type: "image/jpeg" }));
      const res = await fetch("/api/upload-image", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) onChange(data.url);
    } catch (e) { console.error(e); }
    finally { setUploading(false); }
  };

  if (value) {
    return (
      <div className="relative rounded-lg overflow-hidden border border-border" style={{ aspectRatio: "3/4" }}>
        <img src={value} alt="Poster" className="w-full h-full object-cover" />
        <button type="button" onClick={() => onChange(null)}
          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors">
          <X size={10} className="text-white" />
        </button>
      </div>
    );
  }

  return (
    <>
      <input ref={inputRef} type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
      <div onClick={() => !uploading && inputRef.current?.click()}
        className="w-full rounded-lg border-2 border-dashed border-border hover:border-foreground hover:bg-muted/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-2"
        style={{ aspectRatio: "3/4" }}>
        {uploading
          ? <Loader2 size={20} className="animate-spin text-muted-foreground" />
          : <><ImageIcon size={18} className="text-muted-foreground" /><p className="font-body text-[10px] text-muted-foreground">3:4 · Poster</p></>
        }
      </div>
    </>
  );
}

// ── Shared: Article Picker ─────────────────────────────────────────────────
function ArticlePickerModal({ onPick, onClose, usedIds }: {
  onPick: (a: Article) => void;
  onClose: () => void;
  usedIds: string[];
}) {
  const supabase = createClient();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!query.trim()) { setResults([]); return; }
      setLoading(true);
      const { data } = await supabase
        .from("articles")
        .select("id, title, slug, featured_image, category:categories!category_id(name, slug)")
        .eq("status", "published").ilike("title", `%${query}%`).limit(20);
      setResults((data as unknown as Article[]) ?? []);
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-background border border-border rounded-xl w-full max-w-sm flex flex-col shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="font-body text-sm font-semibold">ލިޔުން ހޮވާ</p>
          <button onClick={onClose}><X size={14} className="text-muted-foreground" /></button>
        </div>
        <div className="px-4 py-2.5 border-b border-border">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border">
            <Search size={12} className="text-muted-foreground" />
            <input autoFocus type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..." className="flex-1 bg-transparent font-body text-xs outline-none placeholder:text-muted-foreground/60" />
          </div>
        </div>
        <div className="overflow-y-auto max-h-64">
          {loading && <p className="font-body text-xs text-muted-foreground text-center py-5">ހޯދަނީ...</p>}
          {!loading && query && results.length === 0 && <p className="font-body text-xs text-muted-foreground text-center py-5">ނަތީޖާ ނެތް</p>}
          {!loading && !query && <p className="font-body text-xs text-muted-foreground text-center py-5">ލިޔުމެއް ހޯދާ...</p>}
          {results.filter(a => !usedIds.includes(a.id)).map((a) => (
            <button key={a.id} onClick={() => onPick(a)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 border-b border-border last:border-0 text-left">
              <div className="w-8 h-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
                {a.featured_image && <img src={a.featured_image} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                {a.category && <span className="font-body text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground mb-1 inline-block">{a.category.name}</span>}
                <p className="font-body text-xs line-clamp-2 leading-snug" dir="rtl">{a.title}</p>
              </div>
              <Plus size={13} className="text-muted-foreground flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Cinema Entry Form Modal ────────────────────────────────────────────────
function CinemaFormModal({ entry, onSave, onClose }: {
  entry: Partial<CinemaEntry> | null;
  onSave: (e: CinemaEntry) => void;
  onClose: () => void;
}) {
  const supabase = createClient();
  const [form, setForm] = useState<Partial<CinemaEntry>>(entry ?? {
    chart_type: "cinema_now",
    performance: null,
    featured_image: null,
    article_id: null,
    synopsis: null,
    trailer_url: null,
    showing_date: null,
  });
  const [linkedArticle, setLinkedArticle] = useState<Article | null>(null);
  const [showArticlePicker, setShowArticlePicker] = useState(false);
  const isNow = form.chart_type === "cinema_now";
  const ytId = form.trailer_url ? getYouTubeId(form.trailer_url) : null;

  useEffect(() => {
    if (entry?.article_id) {
      supabase.from("articles")
        .select("id, title, slug, featured_image, category:categories!category_id(name, slug)")
        .eq("id", entry.article_id).single()
        .then(({ data }) => { if (data) setLinkedArticle(data as unknown as Article); });
    }
  }, []);

  const set = (k: keyof CinemaEntry, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = () => {
    if (!form.title?.trim()) return;
    onSave({
      id: form.id ?? crypto.randomUUID(),
      chart_type: form.chart_type as Status,
      rank: form.rank ?? 1,
      title: form.title!,
      subtitle: form.subtitle ?? null,
      status: form.chart_type === "cinema_now" ? "now" : "upcoming",
      article_id: form.article_id ?? null,
      featured_image: form.featured_image ?? null,
      showing_date: form.showing_date ?? null,
      performance: isNow ? (form.performance ?? null) : null,
      synopsis: form.synopsis ?? null,
      trailer_url: form.trailer_url ?? null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-background border border-border rounded-xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}>

        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border flex-shrink-0">
          <p className="font-body text-sm font-semibold">{entry?.id ? "Edit Film" : "Add Film"}</p>
          <button onClick={onClose}><X size={14} className="text-muted-foreground" /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-5 grid grid-cols-2 gap-4">

            {/* Poster */}
            <div>
              <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Poster · 3:4</p>
              <PosterUploader value={form.featured_image ?? null} onChange={(v) => set("featured_image", v)} />
            </div>

            {/* Fields */}
            <div className="space-y-3">
              <div>
                <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">ފިލްމުގެ ނަން</p>
                <input type="text" value={form.title ?? ""} onChange={(e) => set("title", e.target.value)}
                  dir="rtl" placeholder="ނަން..." className="w-full font-body text-xs px-3 py-2 rounded-lg border border-border bg-muted/40 outline-none focus:border-foreground" />
              </div>

              <div>
                <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Date</p>
                <input type="date" value={form.showing_date ?? ""}
                  onChange={(e) => set("showing_date", e.target.value || null)}
                  className="w-full font-body text-xs px-3 py-2 rounded-lg border border-border bg-muted/40 outline-none focus:border-foreground" />
              </div>

              {/* Status toggle */}
              <div>
                <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Status</p>
                <div className="flex gap-2">
                  {(["cinema_now", "cinema_upcoming"] as Status[]).map((s) => (
                    <button key={s} type="button" onClick={() => { set("chart_type", s); if (s === "cinema_upcoming") set("performance", null); }}
                      className={`flex-1 h-8 rounded-lg font-body text-[11px] font-semibold transition-all border ${
                        form.chart_type === s ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground"
                      }`}>
                      {s === "cinema_now" ? "މިހާރު ދައްކަނީ" : "އަންނަނީ"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Performance — only for now showing */}
              {isNow && (
                <div>
                  <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Performance</p>
                  <div className="flex gap-2">
                    <button type="button"
                      onClick={() => set("performance", form.performance === "hit" ? null : "hit")}
                      className={`flex items-center gap-1.5 px-3 h-7 rounded-lg font-body text-[11px] font-semibold transition-all border ${
                        form.performance === "hit" ? "bg-green-100 text-green-700 border-green-200" : "border-border text-muted-foreground hover:border-foreground"
                      }`}>
                      🔥 Hit
                    </button>
                    <button type="button"
                      onClick={() => set("performance", form.performance === "flop" ? null : "flop")}
                      className={`flex items-center gap-1.5 px-3 h-7 rounded-lg font-body text-[11px] font-semibold transition-all border ${
                        form.performance === "flop" ? "bg-red-100 text-red-700 border-red-200" : "border-border text-muted-foreground hover:border-foreground"
                      }`}>
                      😞 Flop
                    </button>
                    <button type="button"
                      onClick={() => set("performance", form.performance === "houseful" ? null : "houseful")}
                      className={`flex items-center gap-1.5 px-3 h-7 rounded-lg font-body text-[11px] font-semibold transition-all border ${
                        form.performance === "houseful" ? "bg-amber-100 text-amber-700 border-amber-200" : "border-border text-muted-foreground hover:border-foreground"
                      }`}>
                      🎟 ހައުސްފުލް
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Synopsis */}
          <div className="px-5 pb-4">
            <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Synopsis</p>
            <textarea value={form.synopsis ?? ""} onChange={(e) => set("synopsis", e.target.value || null)}
              rows={3} dir="rtl" placeholder="ކުރު ތަޢާރަފެއް..."
              className="w-full font-body text-xs px-3 py-2.5 rounded-lg border border-border bg-muted/40 outline-none focus:border-foreground resize-none" />
          </div>

          {/* Trailer URL */}
          <div className="px-5 pb-4">
            <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">YouTube Trailer URL</p>
            <input type="url" value={form.trailer_url ?? ""} onChange={(e) => set("trailer_url", e.target.value || null)}
              placeholder="https://youtube.com/watch?v=..." className="w-full font-body text-xs px-3 py-2 rounded-lg border border-border bg-muted/40 outline-none focus:border-foreground" dir="ltr" />
            {ytId && (
              <div className="mt-2 rounded-lg overflow-hidden border border-border" style={{ aspectRatio: "16/9" }}>
                <iframe src={`https://www.youtube.com/embed/${ytId}`} className="w-full h-full" allowFullScreen allow="autoplay; encrypted-media" style={{ border: "none" }} />
              </div>
            )}
          </div>

          {/* Linked article */}
          <div className="px-5 pb-5">
            <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Linked Article (optional)</p>
            {linkedArticle ? (
              <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-muted/30">
                {linkedArticle.featured_image && (
                  <div className="w-8 h-8 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    <img src={linkedArticle.featured_image} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <p className="flex-1 font-body text-xs text-foreground line-clamp-1" dir="rtl">{linkedArticle.title}</p>
                <button onClick={() => { set("article_id", null); setLinkedArticle(null); }}
                  className="text-muted-foreground hover:text-destructive transition-colors"><X size={13} /></button>
              </div>
            ) : (
              <button onClick={() => setShowArticlePicker(true)}
                className="flex items-center gap-2 font-body text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Plus size={13} />Link a review article
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-3.5 border-t border-border flex-shrink-0">
          <button onClick={onClose} className="font-body text-xs text-muted-foreground hover:text-foreground">Cancel</button>
          <button onClick={handleSave} disabled={!form.title?.trim()}
            className="h-8 px-5 rounded-lg bg-foreground text-background font-body text-xs font-semibold hover:opacity-80 disabled:opacity-40">
            {entry?.id ? "Update" : "Add Film"}
          </button>
        </div>
      </div>

      {showArticlePicker && (
        <ArticlePickerModal
          onPick={(a) => { set("article_id", a.id); setLinkedArticle(a); setShowArticlePicker(false); }}
          onClose={() => setShowArticlePicker(false)}
          usedIds={form.article_id ? [form.article_id] : []}
        />
      )}
    </div>
  );
}

// ── Cinema Chart Section ───────────────────────────────────────────────────
function CinemaChartSection({ entries, onUpdate }: {
  entries: CinemaEntry[];
  onUpdate: (e: CinemaEntry[]) => void;
}) {
  const [editEntry, setEditEntry] = useState<Partial<CinemaEntry> | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleSave = (entry: CinemaEntry) => {
    const idx = entries.findIndex(e => e.id === entry.id);
    let updated: CinemaEntry[];
    if (idx >= 0) { updated = [...entries]; updated[idx] = entry; }
    else updated = [...entries, { ...entry, rank: entries.length + 1 }];
    onUpdate(updated.map((e, i) => ({ ...e, rank: i + 1 })));
    setShowForm(false); setEditEntry(null);
  };

  const handleRemove = (idx: number) => {
    onUpdate(entries.filter((_, i) => i !== idx).map((e, i) => ({ ...e, rank: i + 1 })));
  };

  const formatDate = (d: string | null) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString("dv-MV", { year: "numeric", month: "long", day: "numeric" });
  };

  const performanceBadge = (p: Performance) => {
    if (!p) return null;
    if (p === "hit") return <span className="inline-flex items-center gap-1 font-body text-[9px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">🔥 Hit</span>;
    if (p === "flop") return <span className="inline-flex items-center gap-1 font-body text-[9px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">😞 Flop</span>;
    if (p === "houseful") return <span className="inline-flex items-center gap-1 font-body text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">🎟 ހައުސްފުލް</span>;
  };

  return (
    <>
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
          <div>
            <p className="font-body text-sm font-semibold text-foreground">ސިނަމާ</p>
            <p className="font-body text-[11px] text-muted-foreground mt-0.5">އޮލިމްޕަސް ސިނަމާ</p>
          </div>
          <span className={`font-body text-[10px] px-2 py-0.5 rounded-full font-semibold ${
            entries.length > 0 ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
          }`}>{entries.length} films</span>
        </div>

        <div className="divide-y divide-border">
          {entries.map((entry, idx) => (
            <div key={entry.id} className="flex items-center gap-3 px-4 py-3">
              {entry.featured_image ? (
                <div className="w-8 h-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
                  <img src={entry.featured_image} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-8 h-10 rounded-md bg-muted flex-shrink-0 flex items-center justify-center">
                  <ImageIcon size={12} className="text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                  <span className={`font-body text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                    entry.chart_type === "cinema_now"
                      ? "bg-[#E87060] text-white"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}>
                    {entry.chart_type === "cinema_now" ? "މިހާރު ދައްކަނީ" : "އަންނަނީ"}
                  </span>
                  {performanceBadge(entry.performance)}
                </div>
                <p className="font-body text-xs font-semibold text-foreground line-clamp-1" dir="rtl">{entry.title}</p>
                {entry.showing_date && (
                  <p className="font-body text-[10px] text-muted-foreground">{formatDate(entry.showing_date)}</p>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => { setEditEntry(entry); setShowForm(true); }}
                  className="text-muted-foreground hover:text-foreground transition-colors">
                  <Edit2 size={13} />
                </button>
                <button onClick={() => handleRemove(idx)}
                  className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
          <div className="px-4 py-3">
            <button onClick={() => { setEditEntry(null); setShowForm(true); }}
              className="flex items-center gap-2 font-body text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Plus size={13} />ފިލްމެއް އިތުރުކުރޭ
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <CinemaFormModal
          entry={editEntry}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditEntry(null); }}
        />
      )}
    </>
  );
}

// ── Star Rating ────────────────────────────────────────────────────────────
function StarRating({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <button key={s} type="button" onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(null)}
          className="p-0.5 transition-transform hover:scale-110">
          <Star size={18} fill={(hover ?? value ?? 0) >= s ? "#E87060" : "transparent"} stroke={(hover ?? value ?? 0) >= s ? "#E87060" : "rgb(200,197,190)"} />
        </button>
      ))}
      {value && <span className="font-body text-xs text-muted-foreground ml-1">{value}/5</span>}
    </div>
  );
}

// ── OTT Series Form Modal ──────────────────────────────────────────────────
function SeriesFormModal({ entry, onSave, onClose }: {
  entry: Partial<SeriesEntry> | null;
  onSave: (e: SeriesEntry) => void;
  onClose: () => void;
}) {
  const supabase = createClient();
  const [form, setForm] = useState<Partial<SeriesEntry>>(entry ?? {
    platform: "netflix", is_active: true, rating: null, poster_url: null, article_id: null,
  });
  const [linkedArticle, setLinkedArticle] = useState<Article | null>(null);
  const [showArticlePicker, setShowArticlePicker] = useState(false);

  useEffect(() => {
    if (entry?.article_id) {
      supabase.from("articles").select("id, title, slug, featured_image, category:categories!category_id(name, slug)")
        .eq("id", entry.article_id).single()
        .then(({ data }) => { if (data) setLinkedArticle(data as unknown as Article); });
    }
  }, []);

  const set = (k: keyof SeriesEntry, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = () => {
    if (!form.title_dv?.trim() || !form.platform) return;
    onSave({
      id: form.id ?? crypto.randomUUID(),
      rank: form.rank ?? 1,
      title_dv: form.title_dv!,
      title_en: form.title_en ?? null,
      platform: form.platform as Platform,
      genre: form.genre ?? null,
      season: form.season ?? null,
      episodes: form.episodes ?? null,
      rating: form.rating ?? null,
      synopsis: form.synopsis ?? null,
      poster_url: form.poster_url ?? null,
      ott_instagram: form.ott_instagram ?? null,
      article_id: form.article_id ?? null,
      is_active: form.is_active ?? true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-background border border-border rounded-xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}>

        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border flex-shrink-0">
          <p className="font-body text-sm font-semibold">{entry?.id ? "Edit Series" : "Add Series"}</p>
          <button onClick={onClose}><X size={14} className="text-muted-foreground" /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-5 grid grid-cols-2 gap-4">
            <div>
              <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Poster · 3:4</p>
              <PosterUploader value={form.poster_url ?? null} onChange={(v) => set("poster_url", v)} />
            </div>
            <div className="space-y-3">
              <div>
                <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">ސިލްސިލާ</p>
                <input type="text" value={form.title_dv ?? ""} onChange={(e) => set("title_dv", e.target.value)}
                  dir="rtl" placeholder="ދިވެހި ނަން..." className="w-full font-body text-xs px-3 py-2 rounded-lg border border-border bg-muted/40 outline-none focus:border-foreground" />
              </div>
              <div>
                <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">English Title</p>
                <input type="text" value={form.title_en ?? ""} onChange={(e) => set("title_en", e.target.value)}
                  placeholder="English name..." className="w-full font-body text-xs px-3 py-2 rounded-lg border border-border bg-muted/40 outline-none focus:border-foreground" />
              </div>
              <div>
                <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Platform</p>
                <div className="relative">
                  <select value={form.platform ?? "netflix"} onChange={(e) => set("platform", e.target.value)}
                    className="w-full font-body text-xs py-2 px-3 pr-8 rounded-lg border border-border bg-muted/40 outline-none focus:border-foreground appearance-none">
                    {Object.entries(PLATFORM_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <ChevronDown size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div>
                <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Genre</p>
                <div className="relative">
                  <select value={form.genre ?? ""} onChange={(e) => set("genre", e.target.value || null)}
                    className="w-full font-body text-xs py-2 px-3 pr-8 rounded-lg border border-border bg-muted/40 outline-none focus:border-foreground appearance-none">
                    <option value="">ހޮވާ...</option>
                    {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <ChevronDown size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Season</p>
                  <input type="number" value={form.season ?? ""} onChange={(e) => set("season", e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="1" className="w-full font-body text-xs px-3 py-2 rounded-lg border border-border bg-muted/40 outline-none focus:border-foreground" dir="ltr" />
                </div>
                <div>
                  <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Episodes</p>
                  <input type="number" value={form.episodes ?? ""} onChange={(e) => set("episodes", e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="8" className="w-full font-body text-xs px-3 py-2 rounded-lg border border-border bg-muted/40 outline-none focus:border-foreground" dir="ltr" />
                </div>
              </div>
              <div>
                <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Rating</p>
                <StarRating value={form.rating ?? null} onChange={(v) => set("rating", v)} />
              </div>
            </div>
          </div>

          <div className="px-5 pb-4">
            <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Synopsis</p>
            <textarea value={form.synopsis ?? ""} onChange={(e) => set("synopsis", e.target.value || null)}
              rows={3} dir="rtl" placeholder="ކުރު ތަޢާރަފެއް..."
              className="w-full font-body text-xs px-3 py-2.5 rounded-lg border border-border bg-muted/40 outline-none focus:border-foreground resize-none" />
          </div>

          <div className="px-5 pb-4">
            <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">OTT Instagram URL</p>
            <input type="url" value={form.ott_instagram ?? ""} onChange={(e) => set("ott_instagram", e.target.value || null)}
              placeholder="https://instagram.com/..." className="w-full font-body text-xs px-3 py-2 rounded-lg border border-border bg-muted/40 outline-none focus:border-foreground" dir="ltr" />
          </div>

          <div className="px-5 pb-5">
            <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Linked Article (optional)</p>
            {linkedArticle ? (
              <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-muted/30">
                {linkedArticle.featured_image && (
                  <div className="w-8 h-8 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    <img src={linkedArticle.featured_image} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <p className="flex-1 font-body text-xs text-foreground line-clamp-1" dir="rtl">{linkedArticle.title}</p>
                <button onClick={() => { set("article_id", null); setLinkedArticle(null); }}
                  className="text-muted-foreground hover:text-destructive transition-colors"><X size={13} /></button>
              </div>
            ) : (
              <button onClick={() => setShowArticlePicker(true)}
                className="flex items-center gap-2 font-body text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Plus size={13} />Link a review article
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-3.5 border-t border-border flex-shrink-0">
          <button onClick={onClose} className="font-body text-xs text-muted-foreground hover:text-foreground">Cancel</button>
          <button onClick={handleSave} disabled={!form.title_dv?.trim()}
            className="h-8 px-5 rounded-lg bg-foreground text-background font-body text-xs font-semibold hover:opacity-80 disabled:opacity-40">
            {entry?.id ? "Update" : "Add to Chart"}
          </button>
        </div>
      </div>

      {showArticlePicker && (
        <ArticlePickerModal
          onPick={(a) => { set("article_id", a.id); setLinkedArticle(a); setShowArticlePicker(false); }}
          onClose={() => setShowArticlePicker(false)}
          usedIds={form.article_id ? [form.article_id] : []}
        />
      )}
    </div>
  );
}

// ── OTT Chart Section ──────────────────────────────────────────────────────
function OTTChartSection({ entries, onUpdate }: {
  entries: SeriesEntry[];
  onUpdate: (e: SeriesEntry[]) => void;
}) {
  const [editEntry, setEditEntry] = useState<Partial<SeriesEntry> | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleSave = (entry: SeriesEntry) => {
    const idx = entries.findIndex(e => e.id === entry.id);
    let updated: SeriesEntry[];
    if (idx >= 0) { updated = [...entries]; updated[idx] = entry; }
    else updated = [...entries, { ...entry, rank: entries.length + 1 }];
    onUpdate(updated.map((e, i) => ({ ...e, rank: i + 1 })));
    setShowForm(false); setEditEntry(null);
  };

  const handleRemove = (idx: number) => {
    onUpdate(entries.filter((_, i) => i !== idx).map((e, i) => ({ ...e, rank: i + 1 })));
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const u = [...entries]; [u[idx-1], u[idx]] = [u[idx], u[idx-1]];
    onUpdate(u.map((e, i) => ({ ...e, rank: i + 1 })));
  };

  const moveDown = (idx: number) => {
    if (idx === entries.length - 1) return;
    const u = [...entries]; [u[idx], u[idx+1]] = [u[idx+1], u[idx]];
    onUpdate(u.map((e, i) => ({ ...e, rank: i + 1 })));
  };

  return (
    <>
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
          <div>
            <p className="font-body text-sm font-semibold text-foreground">OTT ޓްރެންޑިން</p>
            <p className="font-body text-[11px] text-muted-foreground mt-0.5">Netflix · Apple · Amazon · Video Club · Baiskoafu</p>
          </div>
          <span className={`font-body text-[10px] px-2 py-0.5 rounded-full font-semibold ${
            entries.length > 0 ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
          }`}>{entries.length} entries</span>
        </div>

        <div className="divide-y divide-border">
          {entries.map((entry, idx) => {
            const pm = PLATFORM_META[entry.platform];
            return (
              <div key={entry.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex flex-col gap-1">
                  <button onClick={() => moveUp(idx)} disabled={idx === 0}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-20"><GripVertical size={12} /></button>
                  <button onClick={() => moveDown(idx)} disabled={idx === entries.length - 1}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-20"><GripVertical size={12} className="rotate-180" /></button>
                </div>
                <span className="font-body text-sm font-semibold text-muted-foreground w-5 text-center">{idx + 1}</span>
                {entry.poster_url ? (
                  <div className="w-8 h-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    <img src={entry.poster_url} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-8 h-10 rounded-md bg-muted flex-shrink-0 flex items-center justify-center">
                    <ImageIcon size={12} className="text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-body text-[9px] font-semibold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: pm.color, fontSize: "9px" }}>
                      {pm.label}
                    </span>
                    {entry.genre && <span className="font-body text-[10px] text-muted-foreground">{entry.genre}</span>}
                    {entry.rating && (
                      <span className="flex items-center gap-0.5">
                        <Star size={10} fill="#E87060" stroke="#E87060" />
                        <span className="font-body text-[10px] text-muted-foreground">{entry.rating}</span>
                      </span>
                    )}
                  </div>
                  <p className="font-body text-xs font-semibold text-foreground line-clamp-1" dir="rtl">{entry.title_dv}</p>
                  {entry.title_en && <p className="font-body text-[10px] text-muted-foreground line-clamp-1">{entry.title_en}</p>}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {entry.ott_instagram && (
                    <a href={entry.ott_instagram} target="_blank" rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors">
                      <ExternalLink size={13} />
                    </a>
                  )}
                  <button onClick={() => { setEditEntry(entry); setShowForm(true); }}
                    className="text-muted-foreground hover:text-foreground transition-colors"><Edit2 size={13} /></button>
                  <button onClick={() => handleRemove(idx)}
                    className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>
            );
          })}
          <div className="px-4 py-3">
            <button onClick={() => { setEditEntry(null); setShowForm(true); }}
              className="flex items-center gap-2 font-body text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Plus size={13} />ސިލްސިލާ އިތުރުކުރޭ
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <SeriesFormModal
          entry={editEntry}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditEntry(null); }}
        />
      )}
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function ChartsAdminPage() {
  const supabase = createClient();
  const [cinemaEntries, setCinemaEntries] = useState<CinemaEntry[]>([]);
  const [seriesEntries, setSeriesEntries] = useState<SeriesEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: chartData }, { data: seriesData }] = await Promise.all([
        supabase.from("charts").select("*").in("chart_type", ["cinema_now","cinema_upcoming"]).order("rank"),
        supabase.from("chart_series").select("*").order("rank"),
      ]);
      if (chartData) setCinemaEntries(chartData as CinemaEntry[]);
      if (seriesData) setSeriesEntries(seriesData as SeriesEntry[]);
      setLoading(false);
    }
    load();
  }, []);

  const markUnsaved = () => setSaved(false);

  const handleSave = async () => {
    setSaving(true);
    await supabase.from("charts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (cinemaEntries.length > 0) {
      await supabase.from("charts").insert(cinemaEntries.map(e => ({ ...e, updated_at: new Date().toISOString() })));
    }
    await supabase.from("chart_series").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (seriesEntries.length > 0) {
      await supabase.from("chart_series").insert(seriesEntries.map(e => ({ ...e, updated_at: new Date().toISOString() })));
    }
    setSaving(false);
    setSaved(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-body text-sm text-muted-foreground">ލޯޑްވަނީ...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-body text-lg font-semibold text-foreground" dir="rtl">ޗާޓްސް</h1>
          <p className="font-body text-xs text-muted-foreground mt-0.5">ސިނަމާ · OTT ޓްރެންޑިން</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-body text-xs text-muted-foreground flex items-center gap-1.5">
            {saved ? <><Check size={12} className="text-green-600" />Saved</> : <><RefreshCw size={12} className="text-amber-500" />Unsaved</>}
          </span>
          <button onClick={handleSave} disabled={saving || saved}
            className="h-8 px-4 rounded-lg bg-foreground text-background font-body text-xs font-semibold hover:opacity-80 disabled:opacity-40 flex items-center gap-1.5">
            {saving ? <><RefreshCw size={12} className="animate-spin" />Saving...</> : "Publish"}
          </button>
        </div>
      </div>

      <CinemaChartSection
        entries={cinemaEntries}
        onUpdate={(e) => { setCinemaEntries(e); markUnsaved(); }}
      />

      <OTTChartSection
        entries={seriesEntries}
        onUpdate={(e) => { setSeriesEntries(e); markUnsaved(); }}
      />
    </div>
  );
}
