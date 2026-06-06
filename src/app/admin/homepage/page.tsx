"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, X, Plus, Check, RefreshCw } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface Article {
  id: string;
  title: string;
  slug: string;
  featured_image: string | null;
  status: string;
  category: { name: string; slug: string } | null;
}

interface SectionState {
  hero: Article | null;
  editors_choice: (Article | null)[];
  people: Article | null;
  review: (Article | null)[];
  latest: (Article | null)[];
}

// ── Slot ───────────────────────────────────────────────────────────────────

function Slot({
  article,
  index,
  aspect = "4/3",
  onPick,
  onRemove,
}: {
  article: Article | null;
  index?: number;
  aspect?: string;
  onPick: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      onClick={onPick}
      className={`relative rounded-lg overflow-hidden border transition-all cursor-pointer ${
        article
          ? "border-border hover:border-foreground/40"
          : "border-dashed border-border hover:border-foreground/40 bg-muted/30 hover:bg-muted/50"
      }`}
      style={{ aspectRatio: aspect }}
    >
      {article ? (
        <>
          {article.featured_image ? (
            <img
              src={article.featured_image}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted" />
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

          {/* Slot number */}
          {index !== undefined && (
            <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-black/50 flex items-center justify-center font-body text-[10px] text-white font-semibold leading-none">
              {index + 1}
            </span>
          )}

          {/* Remove button */}
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/50 hover:bg-red-500 flex items-center justify-center transition-colors"
            aria-label="Remove"
          >
            <X size={11} className="text-white" />
          </button>

          {/* Article info */}
          <div className="absolute bottom-0 left-0 right-0 p-2.5">
            {article.category && (
              <span className="inline-block font-body text-[9px] px-1.5 py-0.5 rounded-full bg-white/15 text-white/90 mb-1 leading-none">
                {article.category.name}
              </span>
            )}
            <p className="font-body text-[10px] text-white line-clamp-2 leading-snug" dir="rtl">
              {article.title}
            </p>
          </div>
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-muted-foreground/50">
          <Plus size={15} strokeWidth={1.5} />
          {index !== undefined && (
            <span className="font-body text-[10px]">{index + 1}</span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Section header ─────────────────────────────────────────────────────────

function SectionHeader({
  title,
  slots,
  filled,
  description,
}: {
  title: string;
  slots: number;
  filled: number;
  description: string;
}) {
  const complete = filled === slots;
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <p className="font-body text-sm font-semibold text-foreground">{title}</p>
        <span className={`font-body text-[10px] px-2 py-0.5 rounded-full font-semibold ${
          complete
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : "bg-muted text-muted-foreground"
        }`}>
          {filled}/{slots}
        </span>
      </div>
      <p className="font-body text-[11px] text-muted-foreground">{description}</p>
    </div>
  );
}

// ── Picker modal ───────────────────────────────────────────────────────────

function PickerModal({
  label,
  allArticles,
  usedIds,
  onPick,
  onClose,
}: {
  label: string;
  allArticles: Article[];
  usedIds: string[];
  onPick: (a: Article) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = allArticles.filter(
    (a) =>
      !usedIds.includes(a.id) &&
      (a.title.toLowerCase().includes(query.toLowerCase()) ||
        (a.category?.name ?? "").toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-background border border-border rounded-xl w-full max-w-sm flex flex-col shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <p className="font-body text-sm font-semibold text-foreground">
            Pick article
            <span className="text-muted-foreground font-normal"> — {label}</span>
          </p>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-2.5 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/60 border border-border">
            <Search size={12} className="text-muted-foreground flex-shrink-0" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title or category..."
              className="flex-1 bg-transparent font-body text-xs outline-none placeholder:text-muted-foreground/60 text-foreground"
            />
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto max-h-72 flex-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <p className="font-body text-sm">No articles found</p>
            </div>
          ) : (
            filtered.map((a) => (
              <button
                key={a.id}
                onClick={() => onPick(a)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors border-b border-border last:border-0 text-left"
              >
                <div className="w-9 h-9 rounded-md overflow-hidden bg-muted flex-shrink-0">
                  {a.featured_image ? (
                    <img src={a.featured_image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {a.category && (
                    <span className="font-body text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground mb-1 inline-block">
                      {a.category.name}
                    </span>
                  )}
                  <p className="font-body text-xs text-foreground line-clamp-1 leading-snug" dir="rtl">
                    {a.title}
                  </p>
                </div>
                <Plus size={13} className="text-muted-foreground flex-shrink-0" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function HomepageAdminPage() {
  const supabase = createClient();

  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [sections, setSections] = useState<SectionState>({
    hero: null,
    editors_choice: [null, null, null, null],
    people: null,
    review: [null, null, null],
    latest: Array(8).fill(null),
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(true);
  const [loading, setLoading] = useState(true);
  const [picker, setPicker] = useState<{
    section: keyof SectionState;
    index: number;
    label: string;
  } | null>(null);

  // Load current placements
  useEffect(() => {
    async function load() {
      const { data: arts } = await supabase
        .from("articles")
        .select("id, title, slug, featured_image, status, homepage_placement, homepage_slot, homepage_latest_slot, category:categories!category_id(name, slug)")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(200);

      if (!arts) return;

      setAllArticles(arts as unknown as Article[]);

      const state: SectionState = {
        hero: null,
        editors_choice: [null, null, null, null],
        people: null,
        review: [null, null, null],
        latest: Array(8).fill(null),
      };

      for (const a of arts as any[]) {
        if (a.homepage_placement === "hero") {
          state.hero = a;
        } else if (a.homepage_placement === "editors_choice" && a.homepage_slot >= 1 && a.homepage_slot <= 4) {
          state.editors_choice[a.homepage_slot - 1] = a;
        } else if (a.homepage_placement === "people") {
          state.people = a;
        } else if (a.homepage_placement === "review" && a.homepage_slot >= 1 && a.homepage_slot <= 3) {
          state.review[a.homepage_slot - 1] = a;
        }
        if (a.homepage_latest_slot >= 1 && a.homepage_latest_slot <= 8) {
          state.latest[a.homepage_latest_slot - 1] = a;
        }
      }

      setSections(state);
      setLoading(false);
    }
    load();
  }, []);

  const markUnsaved = () => setSaved(false);

  const getUsedIds = (excludeSection?: keyof SectionState, excludeIndex?: number): string[] => {
    const ids: string[] = [];
    if (sections.hero && excludeSection !== "hero") ids.push(sections.hero.id);
    sections.editors_choice.forEach((a, i) => {
      if (a && !(excludeSection === "editors_choice" && excludeIndex === i)) ids.push(a.id);
    });
    if (sections.people && excludeSection !== "people") ids.push(sections.people.id);
    sections.review.forEach((a, i) => {
      if (a && !(excludeSection === "review" && excludeIndex === i)) ids.push(a.id);
    });
    sections.latest.forEach((a, i) => {
      if (a && !(excludeSection === "latest" && excludeIndex === i)) ids.push(a.id);
    });
    return ids;
  };

  const handlePick = (article: Article) => {
    if (!picker) return;
    setSections((prev) => {
      const next = { ...prev };
      if (picker.section === "hero") {
        next.hero = article;
      } else if (picker.section === "people") {
        next.people = article;
      } else if (picker.section === "editors_choice") {
        const arr = [...prev.editors_choice];
        arr[picker.index] = article;
        next.editors_choice = arr;
      } else if (picker.section === "review") {
        const arr = [...prev.review];
        arr[picker.index] = article;
        next.review = arr;
      } else if (picker.section === "latest") {
        const arr = [...prev.latest];
        arr[picker.index] = article;
        next.latest = arr;
      }
      return next;
    });
    setPicker(null);
    markUnsaved();
  };

  const handleRemove = (section: keyof SectionState, index: number) => {
    setSections((prev) => {
      const next = { ...prev };
      if (section === "hero") next.hero = null;
      else if (section === "people") next.people = null;
      else if (section === "editors_choice") {
        const arr = [...prev.editors_choice]; arr[index] = null; next.editors_choice = arr;
      } else if (section === "review") {
        const arr = [...prev.review]; arr[index] = null; next.review = arr;
      } else if (section === "latest") {
        const arr = [...prev.latest]; arr[index] = null; next.latest = arr;
      }
      return next;
    });
    markUnsaved();
  };

  const handleSave = async () => {
    setSaving(true);

    const updates: { id: string; homepage_placement: string | null; homepage_slot: number | null; homepage_latest_slot: number | null }[] = [];
    const placedIds = new Set<string>();

    if (sections.hero) {
      placedIds.add(sections.hero.id);
      updates.push({ id: sections.hero.id, homepage_placement: "hero", homepage_slot: null, homepage_latest_slot: null });
    }
    sections.editors_choice.forEach((a, i) => {
      if (a) {
        placedIds.add(a.id);
        updates.push({ id: a.id, homepage_placement: "editors_choice", homepage_slot: i + 1, homepage_latest_slot: null });
      }
    });
    if (sections.people) {
      placedIds.add(sections.people.id);
      updates.push({ id: sections.people.id, homepage_placement: "people", homepage_slot: null, homepage_latest_slot: null });
    }
    sections.review.forEach((a, i) => {
      if (a) {
        placedIds.add(a.id);
        updates.push({ id: a.id, homepage_placement: "review", homepage_slot: i + 1, homepage_latest_slot: null });
      }
    });
    sections.latest.forEach((a, i) => {
      if (a) {
        const existing = updates.find((u) => u.id === a.id);
        if (existing) {
          existing.homepage_latest_slot = i + 1;
        } else {
          placedIds.add(a.id);
          updates.push({ id: a.id, homepage_placement: null, homepage_slot: null, homepage_latest_slot: i + 1 });
        }
      }
    });

    for (const u of updates) {
      await supabase.from("articles").update({
        homepage_placement: u.homepage_placement,
        homepage_slot: u.homepage_slot,
        homepage_latest_slot: u.homepage_latest_slot,
      }).eq("id", u.id);
    }

    // Clear removed articles
    const toRemove = allArticles.filter(
      (a: any) => (a.homepage_placement || a.homepage_latest_slot) && !placedIds.has(a.id)
    );
    for (const a of toRemove) {
      await supabase.from("articles").update({
        homepage_placement: null, homepage_slot: null, homepage_latest_slot: null,
      }).eq("id", a.id);
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

  const filledEC = sections.editors_choice.filter(Boolean).length;
  const filledReview = sections.review.filter(Boolean).length;
  const filledLatest = sections.latest.filter(Boolean).length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5 pb-16">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-body text-lg font-semibold text-foreground" dir="rtl">ހޯމްޕޭޖް</h1>
          <p className="font-body text-xs text-muted-foreground mt-0.5">merihaanaa.com · control what appears on the homepage</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-body text-xs text-muted-foreground flex items-center gap-1.5">
            {saved
              ? <><Check size={12} className="text-green-600" />All changes saved</>
              : <><RefreshCw size={12} className="text-amber-500" />Unsaved changes</>
            }
          </span>
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="h-8 px-4 rounded-lg bg-foreground text-background font-body text-xs font-semibold hover:opacity-80 transition-opacity disabled:opacity-40 flex items-center gap-1.5"
          >
            {saving ? <><RefreshCw size={12} className="animate-spin" />Saving...</> : "Publish all"}
          </button>
        </div>
      </div>

      {/* ── Hero ── */}
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/20">
          <SectionHeader title="ހީރޯ" slots={1} filled={sections.hero ? 1 : 0} description="Full-width cover · 1 slot" />
        </div>
        <div className="p-4">
          <Slot
            article={sections.hero}
            aspect="21/9"
            onPick={() => setPicker({ section: "hero", index: 0, label: "Hero" })}
            onRemove={() => handleRemove("hero", 0)}
          />
        </div>
      </div>

      {/* ── Editor's Choice ── */}
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/20">
          <SectionHeader title="އެޑިޓަރ ޗޮއިސް" slots={4} filled={filledEC} description="4-column grid · ordered right to left" />
        </div>
        <div className="p-4 grid grid-cols-4 gap-3">
          {sections.editors_choice.map((a, i) => (
            <Slot
              key={i}
              article={a}
              index={i}
              onPick={() => setPicker({ section: "editors_choice", index: i, label: `Editor's choice · slot ${i + 1}` })}
              onRemove={() => handleRemove("editors_choice", i)}
            />
          ))}
        </div>
      </div>

      {/* ── People + Review ── */}
      <div className="grid grid-cols-2 gap-4">

        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/20">
            <SectionHeader title="މީހުން" slots={1} filled={sections.people ? 1 : 0} description="Feature split · 1 slot" />
          </div>
          <div className="p-4">
            <Slot
              article={sections.people}
              aspect="16/9"
              onPick={() => setPicker({ section: "people", index: 0, label: "People feature" })}
              onRemove={() => handleRemove("people", 0)}
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/20">
            <SectionHeader title="ރިވިއު" slots={3} filled={filledReview} description="3-column portrait grid · ordered right to left" />
          </div>
          <div className="p-4 grid grid-cols-3 gap-2">
            {sections.review.map((a, i) => (
              <Slot
                key={i}
                article={a}
                index={i}
                aspect="3/4"
                onPick={() => setPicker({ section: "review", index: i, label: `Review · slot ${i + 1}` })}
                onRemove={() => handleRemove("review", i)}
              />
            ))}
          </div>
        </div>

      </div>

      {/* ── Latest Grid ── */}
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/20">
          <SectionHeader title="ލެޓެސްޓް ގްރިޑް" slots={8} filled={filledLatest} description="4×2 homepage grid · ordered right to left" />
        </div>
        <div className="p-4 grid grid-cols-4 gap-3">
          {sections.latest.map((a, i) => (
            <Slot
              key={i}
              article={a}
              index={i}
              onPick={() => setPicker({ section: "latest", index: i, label: `Latest grid · slot ${i + 1}` })}
              onRemove={() => handleRemove("latest", i)}
            />
          ))}
        </div>
      </div>

      {/* ── Picker modal ── */}
      {picker && (
        <PickerModal
          label={picker.label}
          allArticles={allArticles}
          usedIds={getUsedIds(picker.section, picker.index)}
          onPick={handlePick}
          onClose={() => setPicker(null)}
        />
      )}

    </div>
  );
}
