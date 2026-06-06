"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, X, Plus, Check, RefreshCw, Replace } from "lucide-react";

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
      className={`relative rounded-lg overflow-hidden border transition-colors cursor-pointer group ${
        article
          ? "border-border hover:border-foreground"
          : "border-dashed border-border hover:border-foreground hover:bg-muted/30"
      }`}
      style={{ aspectRatio: aspect, background: article ? undefined : "var(--muted)" }}
      onClick={onPick}
    >
      {article ? (
        <>
          {article.featured_image ? (
            <img src={article.featured_image} alt={article.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="font-body text-[10px] text-muted-foreground">No image</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-2">
            {article.category && (
              <span className="inline-block font-body text-[9px] px-1.5 py-0.5 rounded-full bg-white/20 text-white mb-1">
                {article.category.name}
              </span>
            )}
            <p className="font-body text-[10px] text-white line-clamp-2 leading-snug" dir="rtl">
              {article.title}
            </p>
          </div>
          {index !== undefined && (
            <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/50 flex items-center justify-center font-body text-[10px] text-white font-semibold">
              {index + 1}
            </span>
          )}
          {/* Action buttons — always visible on filled slots */}
          <div className="absolute top-1.5 left-1.5 flex gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="w-6 h-6 rounded-full bg-black/60 hover:bg-red-600 flex items-center justify-center transition-colors"
              title="Remove"
              aria-label="Remove"
            >
              <X size={11} className="text-white" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onPick(); }}
              className="w-6 h-6 rounded-full bg-black/60 hover:bg-blue-600 flex items-center justify-center transition-colors"
              title="Replace"
              aria-label="Replace"
            >
              <Replace size={10} className="text-white" />
            </button>
          </div>
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1">
          <Plus size={16} className="text-muted-foreground" />
          {index !== undefined && (
            <span className="font-body text-[9px] text-muted-foreground">{index + 1}</span>
          )}
        </div>
      )}
    </div>
  );
}

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
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <p className="font-body text-sm font-semibold text-foreground">{title}</p>
        <span className={`font-body text-[10px] px-2 py-0.5 rounded-full font-semibold ${
          filled === slots
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
        a.category?.name.toLowerCase().includes(query.toLowerCase()) ||
        a.category?.slug.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-background border border-border rounded-xl w-full max-w-sm flex flex-col overflow-hidden shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="font-body text-sm font-semibold text-foreground">Pick article — {label}</p>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="px-4 py-2.5 border-b border-border">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
            <Search size={13} className="text-muted-foreground flex-shrink-0" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles..."
              className="flex-1 bg-transparent font-body text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <div className="overflow-y-auto max-h-80">
          {filtered.length === 0 ? (
            <p className="font-body text-sm text-muted-foreground text-center py-8">No articles found</p>
          ) : (
            filtered.map((a) => (
              <button
                key={a.id}
                onClick={() => onPick(a)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors border-b border-border last:border-0 text-left"
              >
                <div className="w-10 h-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
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
                  <p className="font-body text-xs text-foreground line-clamp-2 leading-snug" dir="rtl">
                    {a.title}
                  </p>
                </div>
                <Plus size={14} className="text-muted-foreground flex-shrink-0" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

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
        if (a.homepage_placement === "hero") state.hero = a;
        else if (a.homepage_placement === "editors_choice" && a.homepage_slot >= 1 && a.homepage_slot <= 4)
          state.editors_choice[a.homepage_slot - 1] = a;
        else if (a.homepage_placement === "people") state.people = a;
        else if (a.homepage_placement === "review" && a.homepage_slot >= 1 && a.homepage_slot <= 3)
          state.review[a.homepage_slot - 1] = a;
        if (a.homepage_latest_slot >= 1 && a.homepage_latest_slot <= 8)
          state.latest[a.homepage_latest_slot - 1] = a;
      }

      setSections(state);
      setLoading(false);
    }
    load();
  }, []);

  const markUnsaved = () => setSaved(false);

  const getUsedIds = (excludeSection?: keyof SectionState, excludeIndex?: number) => {
    const ids: string[] = [];
    if (sections.hero && !(excludeSection === "hero")) ids.push(sections.hero.id);
    sections.editors_choice.forEach((a, i) => {
      if (a && !(excludeSection === "editors_choice" && excludeIndex === i)) ids.push(a.id);
    });
    if (sections.people && !(excludeSection === "people")) ids.push(sections.people.id);
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
      if (picker.section === "hero") next.hero = article;
      else if (picker.section === "people") next.people = article;
      else if (picker.section === "editors_choice") {
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
        const arr = [...prev.editors_choice];
        arr[index] = null;
        next.editors_choice = arr;
      } else if (section === "review") {
        const arr = [...prev.review];
        arr[index] = null;
        next.review = arr;
      } else if (section === "latest") {
        const arr = [...prev.latest];
        arr[index] = null;
        next.latest = arr;
      }
      return next;
    });
    markUnsaved();
  };

  const handleSave = async () => {
    setSaving(true);

    const updates: { id: string; homepage_placement: string | null; homepage_slot: number | null; homepage_latest_slot: number | null }[] = [];
    const currentlyPlacedIds = new Set<string>();

    if (sections.hero) {
      currentlyPlacedIds.add(sections.hero.id);
      updates.push({ id: sections.hero.id, homepage_placement: "hero", homepage_slot: null, homepage_latest_slot: null });
    }
    sections.editors_choice.forEach((a, i) => {
      if (a) {
        currentlyPlacedIds.add(a.id);
        updates.push({ id: a.id, homepage_placement: "editors_choice", homepage_slot: i + 1, homepage_latest_slot: null });
      }
    });
    if (sections.people) {
      currentlyPlacedIds.add(sections.people.id);
      updates.push({ id: sections.people.id, homepage_placement: "people", homepage_slot: null, homepage_latest_slot: null });
    }
    sections.review.forEach((a, i) => {
      if (a) {
        currentlyPlacedIds.add(a.id);
        updates.push({ id: a.id, homepage_placement: "review", homepage_slot: i + 1, homepage_latest_slot: null });
      }
    });
    sections.latest.forEach((a, i) => {
      if (a) {
        const existing = updates.find((u) => u.id === a.id);
        if (existing) {
          existing.homepage_latest_slot = i + 1;
        } else {
          currentlyPlacedIds.add(a.id);
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

    const previouslyPlaced = allArticles.filter(
      (a: any) =>
        (a.homepage_placement || a.homepage_latest_slot) &&
        !currentlyPlacedIds.has(a.id)
    );
    for (const a of previouslyPlaced) {
      await supabase.from("articles").update({
        homepage_placement: null,
        homepage_slot: null,
        homepage_latest_slot: null,
      }).eq("id", a.id);
    }

    setSaving(false);
    setSaved(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground font-body text-sm">
        ލޯޑްވަނީ...
      </div>
    );
  }

  const filledLatest = sections.latest.filter(Boolean).length;
  const filledEC = sections.editors_choice.filter(Boolean).length;
  const filledReview = sections.review.filter(Boolean).length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-body text-xl font-semibold text-foreground" dir="rtl">ހޯމްޕޭޖް</h1>
          <p className="font-body text-xs text-muted-foreground mt-0.5">merihaanaa.com</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="font-body text-xs text-muted-foreground flex items-center gap-1.5">
            {saved ? (
              <><Check size={13} className="text-green-600" />Published</>
            ) : (
              <><RefreshCw size={12} className="text-amber-500" />Unsaved changes</>
            )}
          </p>
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-foreground text-background font-body text-xs font-semibold hover:opacity-80 transition-opacity disabled:opacity-40"
          >
            {saving ? <><RefreshCw size={12} className="animate-spin" />Saving...</> : "Publish all"}
          </button>
        </div>
      </div>

      {/* HERO */}
      <div className="border border-border rounded-xl overflow-hidden bg-background">
        <div className="px-4 py-3 border-b border-border bg-muted/20">
          <SectionHeader title="ހީރޯ" slots={1} filled={sections.hero ? 1 : 0} description="Full cover · 1 slot" />
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

      {/* EDITORS CHOICE */}
      <div className="border border-border rounded-xl overflow-hidden bg-background">
        <div className="px-4 py-3 border-b border-border bg-muted/20">
          <SectionHeader title="އެޑިޓަރ ޗޮއިސް" slots={4} filled={filledEC} description="4-grid · ordered" />
        </div>
        <div className="p-4 grid grid-cols-4 gap-3" dir="ltr">
          {sections.editors_choice.map((a, i) => (
            <Slot
              key={i}
              article={a}
              index={i}
              onPick={() => setPicker({ section: "editors_choice", index: i, label: `Editor's choice ${i + 1}` })}
              onRemove={() => handleRemove("editors_choice", i)}
            />
          ))}
        </div>
      </div>

      {/* PEOPLE + REVIEW */}
      <div className="grid grid-cols-2 gap-4">
        <div className="border border-border rounded-xl overflow-hidden bg-background">
          <div className="px-4 py-3 border-b border-border bg-muted/20">
            <SectionHeader title="މީހުން" slots={1} filled={sections.people ? 1 : 0} description="Split · 1 slot" />
          </div>
          <div className="p-4">
            <Slot
              article={sections.people}
              aspect="16/9"
              onPick={() => setPicker({ section: "people", index: 0, label: "People" })}
              onRemove={() => handleRemove("people", 0)}
            />
          </div>
        </div>

        <div className="border border-border rounded-xl overflow-hidden bg-background">
          <div className="px-4 py-3 border-b border-border bg-muted/20">
            <SectionHeader title="ރިވިއު" slots={3} filled={filledReview} description="3-grid · portrait" />
          </div>
          <div className="p-4 grid grid-cols-3 gap-2" dir="ltr">
            {sections.review.map((a, i) => (
              <Slot
                key={i}
                article={a}
                index={i}
                aspect="3/4"
                onPick={() => setPicker({ section: "review", index: i, label: `Review ${i + 1}` })}
                onRemove={() => handleRemove("review", i)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* LATEST GRID */}
      <div className="border border-border rounded-xl overflow-hidden bg-background">
        <div className="px-4 py-3 border-b border-border bg-muted/20">
          <SectionHeader title="ލެޓެސްޓް ގްރިޑް" slots={8} filled={filledLatest} description="4×2 grid · homepage bottom" />
        </div>
        <div className="p-4 grid grid-cols-4 gap-3" dir="ltr">
          {sections.latest.map((a, i) => (
            <Slot
              key={i}
              article={a}
              index={i}
              onPick={() => setPicker({ section: "latest", index: i, label: `Latest ${i + 1}` })}
              onRemove={() => handleRemove("latest", i)}
            />
          ))}
        </div>
      </div>

      {/* Picker modal */}
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
