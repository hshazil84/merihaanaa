"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, X, Plus, Check, RefreshCw, GripVertical, Trash2 } from "lucide-react";

type ChartType = "cinema_now" | "cinema_upcoming" | "video_club";

interface ChartEntry {
  id: string;
  chart_type: ChartType;
  rank: number;
  title: string;
  subtitle: string | null;
  status: string | null;
  article_id: string | null;
  featured_image: string | null;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  featured_image: string | null;
  category: { name: string; slug: string } | null;
}

const CHART_META: Record<ChartType, { label: string; desc: string; maxSlots: number }> = {
  cinema_now:      { label: "ސިނަމާ — މިހާރު",  desc: "އޮލިމްޕަސްގައި ދައްކަމުންދާ ފިލްމު",  maxSlots: 6 },
  cinema_upcoming: { label: "ސިނަމާ — އަންނަ",  desc: "ވަރިން ދައްކާ ފިލްމު",                maxSlots: 6 },
  video_club:      { label: "ވީޑިއޯ ކްލަބް",     desc: "މީޑިއާނެޓް ޓްރެންޑިން ޗާޓް",         maxSlots: 10 },
};

function ArticlePickerModal({
  onPick,
  onClose,
  usedIds,
}: {
  onPick: (a: Article) => void;
  onClose: () => void;
  usedIds: string[];
}) {
  const supabase = createClient();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query.trim()) { setResults([]); return; }
      setLoading(true);
      const { data } = await supabase
        .from("articles")
        .select("id, title, slug, featured_image, category:categories!category_id(name, slug)")
        .eq("status", "published")
        .ilike("title", `%${query}%`)
        .limit(20);
      setResults((data as unknown as Article[]) ?? []);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-background border border-border rounded-xl w-full max-w-sm flex flex-col shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <p className="font-body text-sm font-semibold text-foreground">ލިޔުން ހޮވާ</p>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={15} /></button>
        </div>
        <div className="px-4 py-2.5 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border">
            <Search size={12} className="text-muted-foreground flex-shrink-0" />
            <input
              autoFocus type="text" value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles..."
              className="flex-1 bg-transparent font-body text-xs outline-none placeholder:text-muted-foreground/60 text-foreground"
            />
          </div>
        </div>
        <div className="overflow-y-auto max-h-72">
          {loading && <p className="font-body text-xs text-muted-foreground text-center py-6">ހޯދަނީ...</p>}
          {!loading && results.length === 0 && query.trim().length > 0 && (
            <p className="font-body text-xs text-muted-foreground text-center py-6">ނަތީޖާ ނެތް</p>
          )}
          {!loading && query.trim().length === 0 && (
            <p className="font-body text-xs text-muted-foreground text-center py-6">ލިޔުމެއް ހޯދާ...</p>
          )}
          {results.filter(a => !usedIds.includes(a.id)).map((a) => (
            <button key={a.id} onClick={() => onPick(a)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors border-b border-border last:border-0 text-left">
              <div className="w-8 h-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
                {a.featured_image && <img src={a.featured_image} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                {a.category && <span className="font-body text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground mb-1 inline-block">{a.category.name}</span>}
                <p className="font-body text-xs text-foreground line-clamp-2 leading-snug" dir="rtl">{a.title}</p>
              </div>
              <Plus size={13} className="text-muted-foreground flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChartSection({
  chartType,
  entries,
  onUpdate,
}: {
  chartType: ChartType;
  entries: ChartEntry[];
  onUpdate: (entries: ChartEntry[]) => void;
}) {
  const meta = CHART_META[chartType];
  const [showPicker, setShowPicker] = useState(false);
  const usedIds = entries.filter(e => e.article_id).map(e => e.article_id!);

  const handlePick = (article: Article) => {
    const newEntry: ChartEntry = {
      id: crypto.randomUUID(),
      chart_type: chartType,
      rank: entries.length + 1,
      title: article.title,
      subtitle: null,
      status: null,
      article_id: article.id,
      featured_image: article.featured_image,
    };
    onUpdate([...entries, newEntry]);
    setShowPicker(false);
  };

  const handleRemove = (idx: number) => {
    const updated = entries.filter((_, i) => i !== idx).map((e, i) => ({ ...e, rank: i + 1 }));
    onUpdate(updated);
  };

  const handleTitleChange = (idx: number, val: string) => {
    const updated = [...entries];
    updated[idx] = { ...updated[idx], title: val };
    onUpdate(updated);
  };

  const handleStatusChange = (idx: number, val: string) => {
    const updated = [...entries];
    updated[idx] = { ...updated[idx], status: val || null };
    onUpdate(updated);
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const updated = [...entries];
    [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
    onUpdate(updated.map((e, i) => ({ ...e, rank: i + 1 })));
  };

  const moveDown = (idx: number) => {
    if (idx === entries.length - 1) return;
    const updated = [...entries];
    [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
    onUpdate(updated.map((e, i) => ({ ...e, rank: i + 1 })));
  };

  return (
    <>
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
          <div>
            <p className="font-body text-sm font-semibold text-foreground">{meta.label}</p>
            <p className="font-body text-[11px] text-muted-foreground mt-0.5">{meta.desc}</p>
          </div>
          <span className={`font-body text-[10px] px-2 py-0.5 rounded-full font-semibold ${
            entries.length > 0 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground"
          }`}>
            {entries.length}/{meta.maxSlots}
          </span>
        </div>

        <div className="divide-y divide-border">
          {entries.map((entry, idx) => (
            <div key={entry.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex flex-col gap-0.5">
                <button onClick={() => moveUp(idx)} disabled={idx === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors">
                  <GripVertical size={14} />
                </button>
              </div>
              <span className="font-body text-sm font-semibold text-muted-foreground w-5 text-center">{idx + 1}</span>
              {entry.featured_image && (
                <div className="w-8 h-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
                  <img src={entry.featured_image} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <input
                  type="text"
                  value={entry.title}
                  onChange={(e) => handleTitleChange(idx, e.target.value)}
                  dir="rtl"
                  className="flex-1 font-body text-xs px-2.5 py-1.5 rounded-lg border border-border bg-muted/30 outline-none focus:border-foreground text-foreground"
                />
                {chartType !== "video_club" && (
                  <select
                    value={entry.status ?? ""}
                    onChange={(e) => handleStatusChange(idx, e.target.value)}
                    className="font-body text-[10px] px-2 py-1.5 rounded-lg border border-border bg-muted/30 outline-none focus:border-foreground text-foreground"
                  >
                    <option value="">— Status —</option>
                    <option value="now">ލައިވް</option>
                    <option value="upcoming">އަންނަ</option>
                  </select>
                )}
              </div>
              <button onClick={() => handleRemove(idx)} className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {entries.length < meta.maxSlots && (
            <div className="px-4 py-3">
              <button
                onClick={() => setShowPicker(true)}
                className="flex items-center gap-2 font-body text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus size={13} />
                ލިޔުމެއް ލިންކްކުރޭ
              </button>
            </div>
          )}
        </div>
      </div>

      {showPicker && (
        <ArticlePickerModal
          onPick={handlePick}
          onClose={() => setShowPicker(false)}
          usedIds={usedIds}
        />
      )}
    </>
  );
}

export default function ChartsAdminPage() {
  const supabase = createClient();
  const [entries, setEntries] = useState<Record<ChartType, ChartEntry[]>>({
    cinema_now: [],
    cinema_upcoming: [],
    video_club: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("charts")
        .select("*")
        .order("rank", { ascending: true });

      if (data) {
        const grouped: Record<ChartType, ChartEntry[]> = {
          cinema_now: [],
          cinema_upcoming: [],
          video_club: [],
        };
        for (const row of data as ChartEntry[]) {
          if (grouped[row.chart_type]) grouped[row.chart_type].push(row);
        }
        setEntries(grouped);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleUpdate = (chartType: ChartType, updated: ChartEntry[]) => {
    setEntries(prev => ({ ...prev, [chartType]: updated }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);

    // Delete all existing entries and re-insert
    await supabase.from("charts").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    const allEntries = [
      ...entries.cinema_now,
      ...entries.cinema_upcoming,
      ...entries.video_club,
    ].map(e => ({
      id: e.id,
      chart_type: e.chart_type,
      rank: e.rank,
      title: e.title,
      subtitle: e.subtitle,
      status: e.status,
      article_id: e.article_id,
      featured_image: e.featured_image,
      updated_at: new Date().toISOString(),
    }));

    if (allEntries.length > 0) {
      await supabase.from("charts").insert(allEntries);
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
          <p className="font-body text-xs text-muted-foreground mt-0.5">ސިނަމާ · ވީޑިއޯ ކްލަބް</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-body text-xs text-muted-foreground flex items-center gap-1.5">
            {saved
              ? <><Check size={12} className="text-green-600" />Saved</>
              : <><RefreshCw size={12} className="text-amber-500" />Unsaved</>
            }
          </span>
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="h-8 px-4 rounded-lg bg-foreground text-background font-body text-xs font-semibold hover:opacity-80 transition-opacity disabled:opacity-40 flex items-center gap-1.5"
          >
            {saving ? <><RefreshCw size={12} className="animate-spin" />Saving...</> : "Publish"}
          </button>
        </div>
      </div>

      <ChartSection chartType="cinema_now"      entries={entries.cinema_now}      onUpdate={(e) => handleUpdate("cinema_now", e)} />
      <ChartSection chartType="cinema_upcoming" entries={entries.cinema_upcoming} onUpdate={(e) => handleUpdate("cinema_upcoming", e)} />
      <ChartSection chartType="video_club"      entries={entries.video_club}      onUpdate={(e) => handleUpdate("video_club", e)} />
    </div>
  );
}
