"use client";
// components/admin/ArticleSidebar.tsx

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Send, Save, Eye, Clock, Star, BookOpen, FileText,
  Check, Calendar, User, Globe, Lock, MessageCircle, RefreshCw,
  Sparkles, X, UploadCloud, Loader2, Home, ChevronDown, Tag, BookMarked,
  ImageIcon,
} from "lucide-react";
import { calculateReadingTime } from "@/lib/utils";
import { processImage, ACCEPTED_IMAGE_TYPES } from "@/lib/imageUtils";
import type { CoverMediaValue } from "@/components/admin/CoverMedia";

interface Author    { id: string; full_name: string; role: string; }
interface TagItem   { name: string; slug: string; }
interface Category  { id: string; name: string; }
interface SeriesItem { id: string; title: string; }

interface SidebarProps {
  title: string;
  excerpt: string;
  body: Record<string, unknown> | null;
  categories: Category[];
  categoryId: string | null;
  placement: string | null;
  homepageSlot: number | null;
  homepageFeatured: boolean;
  isPremium: boolean;
  allowComments: boolean;
  ogTitle: string;
  ogDesc: string;
  ogImageUrl: string;
  coverMedia: CoverMediaValue | null;
  coverPortraitUrl: string | null;
  authorId: string | null;
  scheduledAt: string | null;
  tags?: TagItem[];
  status?: string;
  seriesId?: string | null;
  chapterNumber?: number | null;
  onCategoryChange: (id: string) => void;
  onPlacementChange: (v: string | null) => void;
  onHomepageSlotChange: (v: number | null) => void;
  onHomepageFeaturedChange: (v: boolean) => void;
  onIsPremiumChange: (v: boolean) => void;
  onAllowCommentsChange: (v: boolean) => void;
  onOgTitleChange: (v: string) => void;
  onOgDescChange: (v: string) => void;
  onOgImageUrlChange: (v: string) => void;
  onCoverPortraitUrlChange: (v: string | null) => void;
  onAuthorIdChange: (v: string | null) => void;
  onScheduledAtChange: (v: string | null) => void;
  onTagsChange?: (tags: TagItem[] | ((prev: TagItem[]) => TagItem[])) => void;
  onSeriesIdChange?: (v: string | null) => void;
  onChapterNumberChange?: (v: number | null) => void;
  onSaveDraft: () => Promise<void>;
  onPublish: () => Promise<void>;
  onSchedule: () => Promise<void>;
  onPreview: () => void;
  saving: boolean;
  lastSaved: Date | null;
  error: string | null;
  slug: string;
}

const PLACEMENTS = [
  { value: "hero",           label: "ހީރޯ",          icon: Star,     desc: "ކަވަރ",    slots: 1 },
  { value: "editors_choice", label: "އެޑިޓަރ ޗޮއިސް", icon: BookOpen, desc: "4 ގްރިޑް", slots: 4 },
  { value: "people",         label: "މީހުން",          icon: User,     desc: "ސްޕްލިޓް", slots: 1 },
  { value: "review",         label: "ރިވިއު",          icon: FileText, desc: "3 ގްރިޑް",  slots: 3 },
];

const BUCKET = "article-images";
const STORY_CATEGORY_NAME = "ވާހަކަ";

function slugify(text: string) {
  const trimmed = text.trim();
  const latin = trimmed.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
  if (latin.length >= 2) return latin;
  const hash = trimmed.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return `tag-${hash}`;
}

function Divider() { return <div className="h-px bg-border mx-4" />; }
function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-4 py-3.5 ${className}`}>{children}</div>;
}
function SectionLabel({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 mb-2.5">
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{children}</p>
    </div>
  );
}
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={value} onClick={() => onChange(!value)}
      className={`relative flex-shrink-0 w-9 h-5 rounded-full transition-colors duration-200 ${value ? "bg-foreground" : "bg-border"}`}>
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${value ? "right-0.5" : "left-0.5"}`} />
    </button>
  );
}
function Collapsible({ label, icon, children, defaultOpen = false }: {
  label: string; icon?: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <>
      <Divider />
      <div className="px-4">
        <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-3">
          <div className="flex items-center gap-1.5">
            {icon && <span className="text-muted-foreground">{icon}</span>}
            <span className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
          </div>
          <ChevronDown size={12} className={`text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
        {open && <div className="pb-3.5">{children}</div>}
      </div>
    </>
  );
}

// ── Portrait Uploader ──────────────────────────────────────────────────────
function PortraitUploader({
  value,
  onChange,
  label = "ވާހަކަ ކަވަރ",
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const blob = await processImage(file, { targetW: 900, targetH: 1200, watermark: false });
      const formData = new FormData();
      formData.append("file", new File([blob], `portrait-${Date.now()}.jpg`, { type: "image/jpeg" }));
      const res = await fetch("/api/upload-image", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "Upload failed");
      onChange(data.url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "އަލުން ލޯޑްކޮށްލާ");
    } finally {
      setUploading(false);
    }
  }, [onChange]);

  if (value) {
    return (
      <div className="relative rounded-lg overflow-hidden border border-border" style={{ aspectRatio: "3/4" }}>
        <img src={value} alt="ކަވަރ ޕޯޓްރެއިޓް" className="w-full h-full object-cover" />
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
        >
          <X size={10} className="text-white" />
        </button>
        <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/40">
          <p className="font-body text-[9px] text-white/70 text-center">3:4 · {label}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className={`w-full rounded-lg border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
          uploading ? "pointer-events-none border-border" : "border-border hover:border-foreground hover:bg-muted/30"
        }`}
        style={{ aspectRatio: "3/4" }}
      >
        {uploading ? (
          <>
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
            <p className="font-body text-[10px] text-muted-foreground">ލޯޑްވަނީ...</p>
          </>
        ) : (
          <>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-muted text-muted-foreground">
              <ImageIcon size={18} />
            </div>
            <p className="font-body text-[11px] font-semibold text-foreground">ޕޯޓްރެއިޓް ލޯޑްކޮށްލާ</p>
            <p className="font-body text-[9px] text-muted-foreground">3:4 · {label}</p>
          </>
        )}
      </div>
      {error && <p className="font-body text-[10px] text-destructive">{error}</p>}
    </div>
  );
}

// ── Create Series Modal ────────────────────────────────────────────────────
function CreateSeriesModal({ onClose, onCreate }: { onClose: () => void; onCreate: (s: SeriesItem) => void; }) {
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!title.trim()) { setError("ނަން ލިޔޭ"); return; }
    setSaving(true);
    const slug = title.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "")
      + "-" + Math.random().toString(36).slice(2, 5);
    const { data, error: err } = await supabase
      .from("series").insert({ title: title.trim(), slug, is_active: true })
      .select("id, title").single();
    setSaving(false);
    if (err) { setError(err.message); return; }
    onCreate(data);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-sm shadow-2xl p-5" dir="rtl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold" style={{ fontFamily: "MVTypewriter, serif" }}>އާ ސީރީޒް</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600"><X size={16} /></button>
        </div>
        <input autoFocus type="text" value={title} onChange={e => { setTitle(e.target.value); setError(""); }}
          className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm mb-3"
          style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }} placeholder="ސީރީޒްގެ ނަން..." />
        {error && <p className="text-xs text-red-600 mb-3" style={{ fontFamily: "MVTypewriter, serif" }}>{error}</p>}
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2 rounded-lg bg-neutral-900 text-white text-xs font-semibold disabled:opacity-50"
            style={{ fontFamily: "MVTypewriter, serif" }}>
            {saving ? "ސޭވްވަނީ..." : "ހަދާ"}
          </button>
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-neutral-200 text-xs text-neutral-700"
            style={{ fontFamily: "MVTypewriter, serif" }}>
            ކެންސަލް
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function ArticleSidebar({
  title, excerpt, body, categories, categoryId, placement, homepageSlot, homepageFeatured,
  isPremium, allowComments, ogTitle, ogDesc, ogImageUrl, coverMedia, coverPortraitUrl,
  authorId, scheduledAt, tags = [], status, seriesId, chapterNumber,
  onCategoryChange, onPlacementChange, onHomepageSlotChange, onHomepageFeaturedChange,
  onIsPremiumChange, onAllowCommentsChange, onOgTitleChange, onOgDescChange,
  onOgImageUrlChange, onCoverPortraitUrlChange, onAuthorIdChange, onScheduledAtChange,
  onTagsChange, onSeriesIdChange, onChapterNumberChange,
  onSaveDraft, onPublish, onSchedule, onPreview,
  saving, lastSaved, error, slug,
}: SidebarProps) {
  const supabase = createClient();
  const [authors, setAuthors]             = useState<Author[]>([]);
  const [showScheduler, setShowScheduler] = useState(!!scheduledAt);
  const [tagInput, setTagInput]           = useState("");
  const [aiLoading, setAiLoading]         = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<TagItem[]>([]);
  const [ogUploading, setOgUploading]     = useState(false);
  const [seriesList, setSeriesList]       = useState<SeriesItem[]>([]);
  const [showSeriesModal, setShowSeriesModal] = useState(false);
  const ogInputRef = useRef<HTMLInputElement>(null);
  const addingRef  = useRef(false);

  const readingTime  = calculateReadingTime(body);
  const isVideoCover = coverMedia?.type === "video";
  const isPublished  = status === "published";
  const ogPreviewImage =
    ogImageUrl ||
    (coverMedia?.type === "image" ? coverMedia.imageUrl : null) ||
    coverMedia?.videoMeta?.thumbnailUrl || null;

  const currentPlacement = PLACEMENTS.find(p => p.value === placement);
  const slotCount = currentPlacement?.slots ?? 0;

  const isStoryCategory  = categories.find(c => c.id === categoryId)?.name === STORY_CATEGORY_NAME;
  const isReviewPlacement = placement === "review";

  useEffect(() => {
    supabase.from("user_profiles").select("id, full_name, role")
      .in("role", ["admin", "editor", "author"]).order("full_name")
      .then(({ data }) => { if (data) setAuthors(data); });
    supabase.from("series").select("id, title").eq("is_active", true).order("title")
      .then(({ data }) => { if (data) setSeriesList(data); });
  }, []);

  useEffect(() => {
    if (!placement || slotCount <= 1) onHomepageSlotChange(null);
  }, [placement]);

  const addTag = useCallback((tag: TagItem) => {
    if (!onTagsChange) return;
    onTagsChange((prev: TagItem[]) => prev.find((t) => t.slug === tag.slug) ? prev : [...prev, tag]);
  }, [onTagsChange]);

  const removeTag = useCallback((slug: string) => {
    if (!onTagsChange) return;
    onTagsChange((prev: TagItem[]) => prev.filter((t) => t.slug !== slug));
  }, [onTagsChange]);

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (addingRef.current) return;
      const val = tagInput.trim();
      if (!val) return;
      addingRef.current = true;
      addTag({ name: val, slug: slugify(val) });
      setTagInput("");
      setTimeout(() => { addingRef.current = false; }, 300);
    }
  };

  const generateTags = async () => {
    if (!title) return;
    setAiLoading(true); setAiSuggestions([]);
    try {
      const res = await fetch("/api/generate-tags", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, excerpt }) });
      const data = await res.json();
      if (data.tags && Array.isArray(data.tags)) setAiSuggestions(data.tags);
    } catch (err) { console.error("Tag generation failed:", err); }
    finally { setAiLoading(false); }
  };

  const handleOgImageFile = useCallback(async (file: File) => {
    setOgUploading(true);
    try {
      const blob = await processImage(file, { targetW: 1200, targetH: 630 });
      const path = `og/og-${Date.now()}.webp`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: "image/webp", upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
      onOgImageUrlChange(publicUrl);
    } catch (err) { console.error("OG upload failed:", err); }
    finally { setOgUploading(false); }
  }, [supabase, onOgImageUrlChange]);

  return (
    <>
      {showSeriesModal && (
        <CreateSeriesModal
          onClose={() => setShowSeriesModal(false)}
          onCreate={(s) => {
            setSeriesList(prev => [...prev, s]);
            onSeriesIdChange?.(s.id);
            setShowSeriesModal(false);
          }}
        />
      )}

      <aside className="w-60 flex-shrink-0 border-1 border-border bg-background flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto no-scrollbar">

          {/* ── Actions ── */}
          <Section>
            <div className="flex gap-2 mb-3">
              <button type="button" onClick={onPreview}
                className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground font-body text-xs transition-all">
                <Eye size={13} /> Preview
              </button>
              <button type="button" onClick={onSaveDraft} disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground font-body text-xs transition-all disabled:opacity-40">
                {saving ? <><RefreshCw size={12} className="animate-spin" /> Saving...</> : <><Save size={12} /> Save Draft</>}
              </button>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={onPublish} disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg bg-foreground text-background font-body text-xs font-semibold hover:opacity-85 transition-opacity disabled:opacity-40">
                <Send size={12} /> {isPublished ? "އަޕްޑޭޓް" : "ލައިވް"}
              </button>
              {isPublished && (
                <button type="button" onClick={onSaveDraft} disabled={saving} title="ޑްރާފްޓަށް ބަދަލު"
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive transition-all disabled:opacity-40">
                  <Globe size={13} />
                </button>
              )}
              <button type="button" onClick={() => setShowScheduler(!showScheduler)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${showScheduler ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"}`}>
                <Calendar size={13} />
              </button>
            </div>
            {showScheduler && (
              <div className="mt-3 space-y-2">
                <input type="datetime-local" value={scheduledAt ?? ""} onChange={(e) => onScheduledAtChange(e.target.value || null)}
                  className="w-full font-body text-xs p-2 rounded-lg border border-border bg-muted/40 outline-none focus:border-foreground transition-colors" />
                {scheduledAt && (
                  <button type="button" onClick={onSchedule} disabled={saving}
                    className="w-full h-8 rounded-lg bg-foreground text-background font-body text-xs font-semibold hover:opacity-80 transition-opacity disabled:opacity-40">
                    ޝެޑިއުލް ކުރޭ
                  </button>
                )}
              </div>
            )}
            {lastSaved && <p className="font-body text-[10px] text-muted-foreground/40 text-center mt-2.5">Saved {lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>}
            {error && <p className="font-body text-[11px] text-destructive text-center mt-2 leading-relaxed">{error}</p>}
          </Section>

          <Divider />

          {/* ── Author ── */}
          <Section>
            <SectionLabel icon={<User size={11} />}>ލިޔުންތެރިޔާ</SectionLabel>
            <div className="relative">
              <select value={authorId ?? ""} onChange={(e) => onAuthorIdChange(e.target.value || null)} dir="rtl"
                className="w-full font-body text-xs py-2 px-3 pr-8 rounded-lg border border-border bg-muted/40 outline-none focus:border-foreground appearance-none cursor-pointer transition-colors text-foreground">
                <option value="">ހޮވާ...</option>
                {authors.map((a) => <option key={a.id} value={a.id}>{a.full_name}</option>)}
              </select>
              <ChevronDown size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </Section>

          <Divider />

          {/* ── ވާހަކަ: Series + Portrait ── */}
          {isStoryCategory && (
            <>
              <Section>
                <SectionLabel icon={<BookMarked size={11} />}>ސީރީޒް</SectionLabel>
                <div className="flex items-center gap-2 mb-3">
                  <div className="relative flex-1">
                    <select value={seriesId ?? ""} onChange={(e) => onSeriesIdChange?.(e.target.value || null)} dir="rtl"
                      className="w-full font-body text-xs py-2 px-3 pr-8 rounded-lg border border-border bg-muted/40 outline-none focus:border-foreground appearance-none cursor-pointer transition-colors text-foreground">
                      <option value="">ސީރީޒް ނެތް</option>
                      {seriesList.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                    <ChevronDown size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                  <button onClick={() => setShowSeriesModal(true)}
                    className="flex-none w-7 h-7 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-all flex items-center justify-center text-lg font-light">
                    +
                  </button>
                </div>
                {seriesId && (
                  <div>
                    <p className="font-body text-[10px] font-semibold text-muted-foreground mb-1.5">ބާބު ނަންބަރ</p>
                    <input type="number" value={chapterNumber ?? ""}
                      onChange={(e) => onChapterNumberChange?.(e.target.value ? parseInt(e.target.value) : null)}
                      className="w-24 px-3 py-2 rounded-lg border border-border bg-muted/40 outline-none focus:border-foreground font-body text-xs text-foreground"
                      placeholder="1" dir="ltr" />
                  </div>
                )}
              </Section>

              <Divider />

              <Section>
                <SectionLabel icon={<ImageIcon size={11} />}>ވާހަކަ ކަވަރ</SectionLabel>
                <PortraitUploader value={coverPortraitUrl} onChange={onCoverPortraitUrlChange} label="ވާހަކަ ކަވަރ" />
              </Section>

              <Divider />
            </>
          )}

          {/* ── ރިވިއު portrait — shown when placement = review ── */}
          {isReviewPlacement && (
            <>
              <Section>
                <SectionLabel icon={<ImageIcon size={11} />}>ރިވިއު ކަވަރ</SectionLabel>
                <PortraitUploader value={coverPortraitUrl} onChange={onCoverPortraitUrlChange} label="ރިވިއު ކަވަރ" />
              </Section>

              <Divider />
            </>
          )}

          {/* ── Homepage placement ── */}
          <Section>
            <SectionLabel icon={<Home size={11} />}>ހޯމްޕޭޖް</SectionLabel>
            <div className="space-y-0.5">
              <button type="button" onClick={() => { onPlacementChange(null); onHomepageSlotChange(null); }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all ${placement === null ? "bg-foreground" : "hover:bg-muted/60"}`}>
                <div className={`w-3.5 h-3.5 rounded-md flex-shrink-0 flex items-center justify-center border transition-all ${placement === null ? "bg-background border-transparent" : "border-border"}`}>
                  {placement === null && <Check size={9} className="text-foreground" />}
                </div>
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className={`font-body text-[11px] font-semibold ${placement === null ? "text-background" : "text-foreground"}`}>ނެތް</span>
                  <span className={`font-body text-[9px] ${placement === null ? "text-background/60" : "text-muted-foreground"}`}>ކެޓ. ޕޭޖް</span>
                </div>
              </button>
              {PLACEMENTS.map((p) => {
                const Icon = p.icon;
                const isActive = placement === p.value;
                return (
                  <button key={p.value} type="button"
                    onClick={() => { onPlacementChange(isActive ? null : p.value); onHomepageSlotChange(null); }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all ${isActive ? "bg-foreground" : "hover:bg-muted/60"}`}>
                    <div className={`w-3.5 h-3.5 rounded-md flex-shrink-0 flex items-center justify-center border transition-all ${isActive ? "bg-background border-transparent" : "border-border"}`}>
                      {isActive && <Check size={9} className="text-foreground" />}
                    </div>
                    <Icon size={12} className={`flex-shrink-0 ${isActive ? "text-background" : "text-muted-foreground"}`} />
                    <div className="flex-1 flex items-center justify-between min-w-0">
                      <span className={`font-body text-[11px] font-semibold truncate ${isActive ? "text-background" : "text-foreground"}`}>{p.label}</span>
                      <span className={`font-body text-[9px] flex-shrink-0 ${isActive ? "text-background/60" : "text-muted-foreground"}`}>{p.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {placement && slotCount > 1 && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="font-body text-[10px] font-semibold text-muted-foreground mb-2">ސްލޮޓް ({slotCount} ތެރެއިން)</p>
                <div className="flex gap-1.5 flex-wrap">
                  {Array.from({ length: slotCount }, (_, i) => i + 1).map((slot) => (
                    <button key={slot} type="button"
                      onClick={() => onHomepageSlotChange(homepageSlot === slot ? null : slot)}
                      className={`w-8 h-8 rounded-lg font-body text-xs font-semibold transition-all border ${homepageSlot === slot ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"}`}>
                      {slot}
                    </button>
                  ))}
                </div>
                {homepageSlot && <p className="font-body text-[9px] text-muted-foreground mt-1.5">ސްލޮޓް {homepageSlot} ގައި ދައްކާ</p>}
              </div>
            )}

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <div>
                <p className="font-body text-[11px] font-semibold text-foreground">ލެޓެސްޓް ގްރިޑް</p>
                <p className="font-body text-[9px] text-muted-foreground mt-0.5">ހޯމްޕޭޖް ތިރި</p>
              </div>
              <Toggle value={homepageFeatured} onChange={onHomepageFeaturedChange} />
            </div>
          </Section>

          <Divider />

          {/* ── Tags ── */}
          <Section>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <Tag size={11} className="text-muted-foreground" />
                <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Tags</p>
              </div>
              <button type="button" onClick={generateTags} disabled={aiLoading || !title}
                className="flex items-center gap-1 font-body text-[10px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40">
                {aiLoading ? <RefreshCw size={10} className="animate-spin" /> : <Sparkles size={10} />}
                {aiLoading ? "Loading..." : "AI ✦"}
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {tags.map((tag) => (
                  <span key={tag.slug} className="inline-flex items-center gap-1 font-body text-[10px] px-2 py-0.5 rounded-md bg-muted border border-border">
                    {tag.name}
                    <button type="button" onClick={() => removeTag(tag.slug)} className="text-muted-foreground hover:text-foreground transition-colors"><X size={9} /></button>
                  </span>
                ))}
              </div>
            )}
            {aiSuggestions.length > 0 && (
              <div className="mb-2 p-2.5 rounded-lg border border-border bg-muted/30">
                <p className="font-body text-[9px] text-muted-foreground mb-1.5 uppercase tracking-wider">AI Suggestions</p>
                <div className="flex flex-wrap gap-1">
                  {aiSuggestions.map((tag) => {
                    const added = tags.find((t) => t.slug === tag.slug);
                    return (
                      <button key={tag.slug} type="button" onClick={() => addTag(tag)} disabled={!!added}
                        className={`inline-flex items-center gap-1 font-body text-[10px] px-2 py-0.5 rounded-md border transition-all ${added ? "bg-foreground text-background border-foreground opacity-50" : "border-border hover:border-foreground hover:bg-muted"}`}>
                        {added && <Check size={8} />}{tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagInput}
              placeholder="ޓެގް ލިޔެ Enter..." dir="rtl"
              className="w-full font-body text-[11px] px-3 py-2 rounded-lg border border-border bg-muted/40 outline-none focus:border-foreground focus:bg-background transition-all placeholder:text-muted-foreground/50" />
          </Section>

          {/* ── Settings ── */}
          <Collapsible label="Settings">
            <div className="space-y-1">
              <div className="mb-3">
                <p className="font-body text-[10px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Category</p>
                <div className="relative">
                  <select value={categoryId ?? ""} onChange={(e) => onCategoryChange(e.target.value)} dir="rtl"
                    className="w-full font-body text-[11px] py-2 px-3 pr-8 rounded-lg border border-border bg-muted/40 outline-none focus:border-foreground appearance-none cursor-pointer transition-colors">
                    <option value="">ހޮވާ...</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <ChevronDown size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div className="flex items-center justify-between py-1.5 px-1">
                <div className="flex items-center gap-2">
                  <Clock size={11} className="text-muted-foreground" />
                  <p className="font-body text-[11px] text-muted-foreground">Reading time</p>
                </div>
                <span className="font-body text-[11px] font-semibold text-foreground tabular-nums">{readingTime}m</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between py-1.5 px-1">
                <div className="flex items-center gap-2">
                  <Lock size={11} className="text-muted-foreground" />
                  <div>
                    <p className="font-body text-[11px] font-semibold text-foreground">ޕްރިމިއަމް</p>
                    <p className="font-body text-[9px] text-muted-foreground">ލޮގިން ބޭނުންވޭ</p>
                  </div>
                </div>
                <Toggle value={isPremium} onChange={onIsPremiumChange} />
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between py-1.5 px-1">
                <div className="flex items-center gap-2">
                  <MessageCircle size={11} className="text-muted-foreground" />
                  <div>
                    <p className="font-body text-[11px] font-semibold text-foreground">ކޮމެންޓް</p>
                    <p className="font-body text-[9px] text-muted-foreground">ކިޔުންތެރިންނަށް</p>
                  </div>
                </div>
                <Toggle value={allowComments} onChange={onAllowCommentsChange} />
              </div>
            </div>
          </Collapsible>

          {/* ── Open Graph ── */}
          <Collapsible label="Open Graph" icon={<Globe size={11} />}>
            <div className="space-y-3">
              <div className="rounded-lg overflow-hidden border border-border">
                <div className="h-20 bg-muted flex items-center justify-center overflow-hidden">
                  {ogPreviewImage ? <img src={ogPreviewImage} alt="" className="w-full h-full object-cover" /> : <Globe size={18} className="text-muted-foreground/20" />}
                </div>
                <div className="p-2.5 bg-background">
                  <div className="flex items-center gap-1 mb-1">
                    <img src="/logo.png" alt="" className="w-3 h-3 rounded-sm object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    <p className="font-body text-[9px] text-muted-foreground">merihaanaa.com</p>
                  </div>
                  <p className="font-body text-[11px] font-semibold leading-snug line-clamp-1 text-foreground">{ogTitle || title || "ލިޔުމުގެ ސުރުހީ"}</p>
                  <p className="font-body text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{ogDesc || excerpt || "ތަފްސީލް..."}</p>
                </div>
              </div>
              {isVideoCover && (
                <>
                  <input ref={ogInputRef} type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleOgImageFile(f); e.target.value = ""; }} />
                  {ogImageUrl && !ogImageUrl.includes("vimeo") && !ogImageUrl.includes("youtube") ? (
                    <div className="relative rounded-lg overflow-hidden border border-border">
                      <img src={ogImageUrl} alt="" className="w-full h-16 object-cover" />
                      <button type="button" onClick={() => onOgImageUrlChange(coverMedia?.videoMeta?.thumbnailUrl ?? "")}
                        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors">
                        <X size={10} className="text-white" />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => ogInputRef.current?.click()} disabled={ogUploading}
                      className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg border border-dashed border-border hover:border-foreground hover:bg-muted/30 transition-all disabled:opacity-40">
                      {ogUploading ? <><Loader2 size={11} className="animate-spin text-muted-foreground" /><span className="font-body text-xs text-muted-foreground">Uploading...</span></> : <><UploadCloud size={11} className="text-muted-foreground" /><span className="font-body text-xs text-muted-foreground">Upload OG image</span></>}
                    </button>
                  )}
                </>
              )}
              <div>
                <label className="font-body text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Title</label>
                <textarea value={ogTitle} onChange={(e) => onOgTitleChange(e.target.value)} placeholder={title || "ލިޔުމުގެ ސުރުހީ..."} rows={2}
                  className="w-full font-body text-[11px] p-2.5 rounded-lg border border-border bg-muted/40 outline-none focus:border-foreground focus:bg-background transition-all resize-none" />
              </div>
              <div>
                <label className="font-body text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Description</label>
                <textarea value={ogDesc} onChange={(e) => onOgDescChange(e.target.value)} placeholder={excerpt || "ތަފްސީލް..."} rows={2}
                  className="w-full font-body text-[11px] p-2.5 rounded-lg border border-border bg-muted/40 outline-none focus:border-foreground focus:bg-background transition-all resize-none" />
              </div>
            </div>
          </Collapsible>

        </div>
      </aside>
    </>
  );
}
