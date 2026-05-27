"use client";
// components/admin/ArticleSidebar.tsx

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Send, Save, Eye, Clock, Star, BookOpen, FileText, Video,
  Check, Calendar, User, Globe, Lock, MessageCircle, RefreshCw,
  Sparkles, X, UploadCloud, Loader2, Home, ChevronDown, Tag,
} from "lucide-react";
import { calculateReadingTime } from "@/lib/utils";
import { processImage, ACCEPTED_IMAGE_TYPES } from "@/lib/imageUtils";
import type { CoverMediaValue } from "@/components/admin/CoverMedia";

interface Author  { id: string; full_name: string; role: string; }
interface TagItem { name: string; slug: string; }
interface Category { id: string; name: string; }

interface SidebarProps {
  title: string;
  excerpt: string;
  body: Record<string, unknown> | null;
  categories: Category[];
  categoryId: string | null;
  placement: string | null;
  homepageFeatured: boolean;
  isPremium: boolean;
  allowComments: boolean;
  ogTitle: string;
  ogDesc: string;
  ogImageUrl: string;
  coverMedia: CoverMediaValue | null;
  authorId: string | null;
  scheduledAt: string | null;
  tags?: TagItem[];
  onCategoryChange: (id: string) => void;
  onPlacementChange: (v: string | null) => void;
  onHomepageFeaturedChange: (v: boolean) => void;
  onIsPremiumChange: (v: boolean) => void;
  onAllowCommentsChange: (v: boolean) => void;
  onOgTitleChange: (v: string) => void;
  onOgDescChange: (v: string) => void;
  onOgImageUrlChange: (v: string) => void;
  onAuthorIdChange: (v: string | null) => void;
  onScheduledAtChange: (v: string | null) => void;
  onTagsChange?: (tags: TagItem[] | ((prev: TagItem[]) => TagItem[])) => void;
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
  { value: "hero",           label: "ހީރޯ",           icon: Star,     desc: "ކަވަރ" },
  { value: "editors_choice", label: "އެޑިޓަރ ޗޮއިސް",  icon: BookOpen, desc: "4 ގްރިޑް" },
  { value: "people",         label: "މީހުން",           icon: User,     desc: "ސްޕްލިޓް" },
  { value: "review",         label: "ރިވިއު",           icon: FileText, desc: "ރިވިއު" },
  { value: "reel",           label: "ރީލް",              icon: Video,    desc: "ވީޑިއޯ" },
];

const BUCKET = "article-images";

function slugify(text: string) {
  return text.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
}

// font-body = MVTypewriter (Thaana)
// font-sans  = Plus Jakarta Sans (Latin UI only)

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-4 py-4 border-b border-border ${className}`}>
      {children}
    </div>
  );
}

function SectionLabel({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 mb-3">
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <p className="font-sans text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
        {children}
      </p>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`relative flex-shrink-0 w-9 h-5 rounded-full transition-colors duration-200 ${
        value ? "bg-foreground" : "bg-border"
      }`}
    >
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${
        value ? "right-0.5" : "left-0.5"
      }`} />
    </button>
  );
}

function Collapsible({
  label, icon, children, defaultOpen = false,
}: {
  label: string; icon?: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="px-4 border-b border-border">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3.5 group"
      >
        <div className="flex items-center gap-1.5">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <span className="font-sans text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
            {label}
          </span>
        </div>
        <ChevronDown
          size={13}
          className={`text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}

export default function ArticleSidebar({
  title, excerpt, body, categories, categoryId, placement, homepageFeatured,
  isPremium, allowComments, ogTitle, ogDesc, ogImageUrl, coverMedia,
  authorId, scheduledAt, tags = [],
  onCategoryChange, onPlacementChange, onHomepageFeaturedChange,
  onIsPremiumChange, onAllowCommentsChange, onOgTitleChange, onOgDescChange,
  onOgImageUrlChange, onAuthorIdChange, onScheduledAtChange, onTagsChange,
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
  const ogInputRef                        = useRef<HTMLInputElement>(null);

  const readingTime    = calculateReadingTime(body);
  const isVideoCover   = coverMedia?.type === "video";
  const ogPreviewImage =
    ogImageUrl ||
    (coverMedia?.type === "image" ? coverMedia.imageUrl : null) ||
    coverMedia?.videoMeta?.thumbnailUrl ||
    null;

  useEffect(() => {
    supabase.from("user_profiles").select("id, full_name, role")
      .in("role", ["admin", "editor", "author"]).order("full_name")
      .then(({ data }) => { if (data) setAuthors(data); });
  }, [supabase]);

  // ── Tag helpers — functional updates, no stale closure ───────────────────
  const addTag = useCallback((tag: TagItem) => {
    if (!onTagsChange) return;
    onTagsChange((prev: TagItem[]) => {
      if (prev.find((t) => t.slug === tag.slug)) return prev;
      return [...prev, tag];
    });
  }, [onTagsChange]);

  const removeTag = useCallback((slug: string) => {
    if (!onTagsChange) return;
    onTagsChange((prev: TagItem[]) => prev.filter((t) => t.slug !== slug));
  }, [onTagsChange]);

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = tagInput.trim();
      if (!val) return;
      addTag({ name: val, slug: slugify(val) });
      setTagInput("");
    }
  };

  // ── AI tag generation ────────────────────────────────────────────────────
  const generateTags = async () => {
    if (!title) return;
    setAiLoading(true);
    setAiSuggestions([]);
    try {
      const res = await fetch("/api/generate-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, excerpt }),
      });
      const data = await res.json();
      if (data.tags && Array.isArray(data.tags)) {
        setAiSuggestions(data.tags);
      } else {
        console.error("Tag generation returned unexpected format:", data);
      }
    } catch (err) {
      console.error("Tag generation failed:", err);
    } finally {
      setAiLoading(false);
    }
  };

  // ── OG image upload ──────────────────────────────────────────────────────
  const handleOgImageFile = useCallback(async (file: File) => {
    setOgUploading(true);
    try {
      const blob = await processImage(file, { targetW: 1200, targetH: 630 });
      const path = `og/og-${Date.now()}.webp`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET).upload(path, blob, { contentType: "image/webp", upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
      onOgImageUrlChange(publicUrl);
    } catch (err) {
      console.error("OG image upload failed:", err);
    } finally {
      setOgUploading(false);
    }
  }, [supabase, onOgImageUrlChange]);

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border bg-background flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto no-scrollbar">

        {/* ── Publish actions ── */}
        <Section>
          <button
            type="button" onClick={onPreview}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-border bg-muted/40 hover:bg-muted hover:border-border transition-all group mb-2"
          >
            <span className="font-sans text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">Preview</span>
            <Eye size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>

          <button
            type="button" onClick={onSaveDraft} disabled={saving}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-border bg-muted/40 hover:bg-muted transition-all group mb-3 disabled:opacity-40"
          >
            <span className="font-sans text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              {saving ? "Saving..." : "Save Draft"}
            </span>
            {saving
              ? <RefreshCw size={14} className="text-muted-foreground animate-spin" />
              : <Save size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
            }
          </button>

          <div className="flex gap-2">
            <button
              type="button" onClick={onPublish} disabled={saving}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-foreground text-background font-body text-xs font-semibold hover:opacity-85 active:scale-[0.98] transition-all disabled:opacity-40"
            >
              <Send size={12} /> ލައިވް
            </button>
            <button
              type="button" onClick={() => setShowScheduler(!showScheduler)}
              className={`px-3 py-2.5 rounded-xl border transition-all ${
                showScheduler
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-muted/40 text-muted-foreground hover:border-foreground hover:text-foreground"
              }`}
            >
              <Calendar size={14} />
            </button>
          </div>

          {showScheduler && (
            <div className="mt-3 p-3 rounded-xl border border-border bg-muted/30 space-y-2">
              <p className="font-body text-[11px] font-semibold text-foreground">ތާރީހް</p>
              <input
                type="datetime-local" value={scheduledAt ?? ""}
                onChange={(e) => onScheduledAtChange(e.target.value || null)}
                className="w-full font-sans text-xs p-2 rounded-lg border border-border bg-background outline-none focus:border-foreground transition-colors"
              />
              {scheduledAt && (
                <button
                  type="button" onClick={onSchedule} disabled={saving}
                  className="w-full py-2 rounded-lg bg-foreground text-background font-body text-xs font-semibold hover:opacity-80 transition-opacity disabled:opacity-40"
                >
                  ޝެޑިއުލް ކުރޭ
                </button>
              )}
            </div>
          )}

          {lastSaved && (
            <p className="font-sans text-[10px] text-muted-foreground/50 text-center mt-2">
              Saved {lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}

          {error && (
            <p className="font-body text-[11px] text-destructive text-center mt-2 leading-relaxed">{error}</p>
          )}
        </Section>

        {/* ── Author ── */}
        <Section>
          <SectionLabel icon={<User size={11} />}>ލިޔުންތެރިޔާ</SectionLabel>
          <div className="relative">
            <select
              value={authorId ?? ""} onChange={(e) => onAuthorIdChange(e.target.value || null)}
              dir="rtl"
              className="w-full font-body text-xs py-2.5 px-3 pr-8 rounded-xl border border-border bg-muted/40 outline-none focus:border-foreground appearance-none cursor-pointer transition-colors text-foreground"
            >
              <option value="">ހޮވާ...</option>
              {authors.map((a) => <option key={a.id} value={a.id}>{a.full_name}</option>)}
            </select>
            <ChevronDown size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </Section>

        {/* ── Homepage placement ── */}
        <Section>
          <SectionLabel icon={<Home size={11} />}>ހޯމްޕޭޖް</SectionLabel>
          <div className="space-y-0.5">

            {/* None */}
            <button
              type="button" onClick={() => onPlacementChange(null)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all ${
                placement === null ? "bg-foreground" : "hover:bg-muted/60"
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-md flex-shrink-0 flex items-center justify-center border transition-all ${
                placement === null ? "bg-background border-transparent" : "border-border"
              }`}>
                {placement === null && <Check size={9} className="text-foreground" />}
              </div>
              <div className="flex-1 flex items-center justify-between min-w-0">
                <span className={`font-body text-[11px] font-semibold ${placement === null ? "text-background" : "text-foreground"}`}>
                  ނެތް
                </span>
                <span className={`font-body text-[9px] ${placement === null ? "text-background/60" : "text-muted-foreground"}`}>
                  ކެޓ. ޕޭޖް
                </span>
              </div>
            </button>

            {PLACEMENTS.map((p) => {
              const Icon = p.icon;
              const isActive = placement === p.value;
              return (
                <button
                  key={p.value} type="button"
                  onClick={() => onPlacementChange(isActive ? null : p.value)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all ${
                    isActive ? "bg-foreground" : "hover:bg-muted/60"
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-md flex-shrink-0 flex items-center justify-center border transition-all ${
                    isActive ? "bg-background border-transparent" : "border-border"
                  }`}>
                    {isActive && <Check size={9} className="text-foreground" />}
                  </div>
                  <Icon size={12} className={`flex-shrink-0 ${isActive ? "text-background" : "text-muted-foreground"}`} />
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <span className={`font-body text-[11px] font-semibold truncate ${isActive ? "text-background" : "text-foreground"}`}>
                      {p.label}
                    </span>
                    <span className={`font-body text-[9px] flex-shrink-0 mr-1 ${isActive ? "text-background/60" : "text-muted-foreground"}`}>
                      {p.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Latest grid toggle */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <div>
              <p className="font-body text-[11px] font-semibold text-foreground">ލެޓެސްޓް ގްރިޑް</p>
              <p className="font-body text-[9px] text-muted-foreground mt-0.5">ހޯމްޕޭޖް ތިރި</p>
            </div>
            <Toggle value={homepageFeatured} onChange={onHomepageFeaturedChange} />
          </div>
        </Section>

        {/* ── Tags ── */}
        <Section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Tag size={11} className="text-muted-foreground" />
              <p className="font-sans text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Tags</p>
            </div>
            <button
              type="button" onClick={generateTags} disabled={aiLoading || !title}
              className="flex items-center gap-1 font-sans text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
            >
              {aiLoading ? <RefreshCw size={10} className="animate-spin" /> : <Sparkles size={10} />}
              {aiLoading ? "Loading..." : "AI"}
            </button>
          </div>

          {/* Current tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {tags.map((tag) => (
                <span
                  key={tag.slug}
                  className="inline-flex items-center gap-1 font-body text-[10px] px-2 py-1 rounded-lg bg-muted border border-border"
                >
                  {tag.name}
                  <button
                    type="button" onClick={() => removeTag(tag.slug)}
                    className="text-muted-foreground hover:text-foreground transition-colors ml-0.5"
                  >
                    <X size={9} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* AI suggestions */}
          {aiSuggestions.length > 0 && (
            <div className="mb-2.5 p-2.5 rounded-xl border border-border bg-muted/30">
              <p className="font-sans text-[9px] text-muted-foreground mb-2 uppercase tracking-widest">AI Suggestions</p>
              <div className="flex flex-wrap gap-1.5">
                {aiSuggestions.map((tag) => {
                  const added = tags.find((t) => t.slug === tag.slug);
                  return (
                    <button
                      key={tag.slug} type="button" onClick={() => addTag(tag)} disabled={!!added}
                      className={`inline-flex items-center gap-1 font-body text-[10px] px-2 py-1 rounded-lg border transition-all ${
                        added
                          ? "bg-foreground text-background border-foreground opacity-50"
                          : "border-border hover:border-foreground hover:bg-muted"
                      }`}
                    >
                      {added && <Check size={8} />}
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tag input */}
          <input
            type="text" value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagInput}
            placeholder="ޓެގް ލިޔެ Enter..."
            dir="rtl"
            className="w-full font-body text-[11px] px-3 py-2.5 rounded-xl border border-border bg-muted/40 outline-none focus:border-foreground focus:bg-background transition-all placeholder:text-muted-foreground/50"
          />
        </Section>

        {/* ── Settings ── */}
        <Collapsible label="Settings">
          <div className="space-y-1">

            {/* Category */}
            <div className="mb-3">
              <p className="font-sans text-[9px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Category</p>
              <div className="relative">
                <select
                  value={categoryId ?? ""} onChange={(e) => onCategoryChange(e.target.value)}
                  dir="rtl"
                  className="w-full font-body text-[11px] py-2.5 px-3 pr-8 rounded-xl border border-border bg-muted/40 outline-none focus:border-foreground appearance-none cursor-pointer transition-colors"
                >
                  <option value="">ހޮވާ...</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <ChevronDown size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Reading time */}
            <div className="flex items-center justify-between py-2 px-1">
              <div className="flex items-center gap-2">
                <Clock size={12} className="text-muted-foreground" />
                <p className="font-sans text-xs text-muted-foreground">Reading time</p>
              </div>
              <span className="font-sans text-xs font-semibold text-foreground tabular-nums">{readingTime}m</span>
            </div>

            <div className="h-px bg-border my-1" />

            {/* Premium */}
            <div className="flex items-center justify-between py-2 px-1">
              <div className="flex items-center gap-2">
                <Lock size={12} className="text-muted-foreground" />
                <div>
                  <p className="font-body text-[11px] font-semibold text-foreground">ޕްރިމިއަމް</p>
                  <p className="font-body text-[9px] text-muted-foreground">ލޮގިން ބޭނުންވޭ</p>
                </div>
              </div>
              <Toggle value={isPremium} onChange={onIsPremiumChange} />
            </div>

            <div className="h-px bg-border my-1" />

            {/* Comments */}
            <div className="flex items-center justify-between py-2 px-1">
              <div className="flex items-center gap-2">
                <MessageCircle size={12} className="text-muted-foreground" />
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

            {/* Preview card */}
            <div className="rounded-xl overflow-hidden border border-border">
              <div className="h-20 bg-muted flex items-center justify-center overflow-hidden">
                {ogPreviewImage
                  ? <img src={ogPreviewImage} alt="" className="w-full h-full object-cover" />
                  : <Globe size={18} className="text-muted-foreground/20" />
                }
              </div>
              <div className="p-2.5 bg-background">
                <div className="flex items-center gap-1 mb-1">
                  <img src="/logo.png" alt="" className="w-3 h-3 rounded-sm object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  <p className="font-sans text-[9px] text-muted-foreground uppercase tracking-wider">merihaanaa.com</p>
                </div>
                <p className="font-body text-[11px] font-semibold leading-snug line-clamp-1 text-foreground">
                  {ogTitle || title || "ލިޔުމުގެ ސުރުހީ"}
                </p>
                <p className="font-body text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                  {ogDesc || excerpt || "ތަފްސީލް..."}
                </p>
              </div>
            </div>

            {/* OG image upload — video covers only */}
            {isVideoCover && (
              <>
                <input
                  ref={ogInputRef} type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleOgImageFile(f); e.target.value = ""; }}
                />
                {ogImageUrl && !ogImageUrl.includes("vimeo") && !ogImageUrl.includes("youtube") ? (
                  <div className="relative rounded-xl overflow-hidden border border-border">
                    <img src={ogImageUrl} alt="" className="w-full h-16 object-cover" />
                    <button
                      type="button"
                      onClick={() => onOgImageUrlChange(coverMedia?.videoMeta?.thumbnailUrl ?? "")}
                      className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                    >
                      <X size={10} className="text-white" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button" onClick={() => ogInputRef.current?.click()} disabled={ogUploading}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-border hover:border-foreground hover:bg-muted/30 transition-all disabled:opacity-40"
                  >
                    {ogUploading
                      ? <><Loader2 size={12} className="animate-spin text-muted-foreground" /><span className="font-sans text-xs text-muted-foreground">Uploading...</span></>
                      : <><UploadCloud size={12} className="text-muted-foreground" /><span className="font-sans text-xs text-muted-foreground">Upload OG image</span></>
                    }
                  </button>
                )}
              </>
            )}

            {/* OG text */}
            <div>
              <label className="font-sans text-[9px] font-semibold text-muted-foreground uppercase tracking-widest block mb-1.5">Title</label>
              <textarea
                value={ogTitle} onChange={(e) => onOgTitleChange(e.target.value)}
                placeholder={title || "ލިޔުމުގެ ސުރުހީ..."} rows={2}
                className="w-full font-body text-[11px] p-2.5 rounded-xl border border-border bg-muted/40 outline-none focus:border-foreground focus:bg-background transition-all resize-none"
              />
            </div>
            <div>
              <label className="font-sans text-[9px] font-semibold text-muted-foreground uppercase tracking-widest block mb-1.5">Description</label>
              <textarea
                value={ogDesc} onChange={(e) => onOgDescChange(e.target.value)}
                placeholder={excerpt || "ތަފްސީލް..."} rows={2}
                className="w-full font-body text-[11px] p-2.5 rounded-xl border border-border bg-muted/40 outline-none focus:border-foreground focus:bg-background transition-all resize-none"
              />
            </div>
          </div>
        </Collapsible>

      </div>
    </aside>
  );
}
