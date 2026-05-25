"use client";
// components/admin/ArticleSidebar.tsx

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Separator } from "@/components/ui/separator";
import {
  ChevronDown, ChevronUp, Send, Save, Eye,
  Clock, Star, BookOpen, FileText, Video,
  Check, Calendar, User, Globe, Lock,
  MessageCircle, RefreshCw, Sparkles, X,
  ImageIcon, UploadCloud, Loader2, Home,
} from "lucide-react";
import { calculateReadingTime } from "@/lib/utils";
import { processImage, ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE_MB } from "@/lib/imageUtils";
import type { CoverMediaValue } from "@/components/admin/CoverMedia";

interface Author { id: string; full_name: string; role: string; }
interface Tag { name: string; slug: string; }
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
  tags?: Tag[];
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
  onTagsChange?: (tags: Tag[]) => void;
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
  { value: "hero",           label: "ހީރޯ",          desc: "ހޯމްޕޭޖް ކަވަރ",   icon: Star },
  { value: "editors_choice", label: "އެޑިޓަރ ޗޮއިސް", desc: "4 ލިޔުން ގްރިޑް",  icon: BookOpen },
  { value: "people",         label: "މީހުން",          desc: "ފީޗަރ ސްޕްލިޓް",  icon: User },
  { value: "review",         label: "ރިވިއު",          desc: "ރިވިއު ސެކްޝަން", icon: FileText },
  { value: "reel",           label: "ރީލް",            desc: "ވީޑިއޯ ސެކްޝަން", icon: Video },
];

const BUCKET = "article-images";

function slugify(text: string) {
  return text.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
}

export default function ArticleSidebar({
  title, excerpt, body, categories, categoryId, placement, homepageFeatured,
  isPremium, allowComments, ogTitle, ogDesc, ogImageUrl, coverMedia,
  authorId, scheduledAt,
  tags = [],
  onCategoryChange, onPlacementChange, onHomepageFeaturedChange,
  onIsPremiumChange, onAllowCommentsChange, onOgTitleChange, onOgDescChange,
  onOgImageUrlChange, onAuthorIdChange, onScheduledAtChange, onTagsChange,
  onSaveDraft, onPublish, onSchedule, onPreview,
  saving, lastSaved, error, slug,
}: SidebarProps) {
  const supabase = createClient();
  const [authors, setAuthors]           = useState<Author[]>([]);
  const [showScheduler, setShowScheduler] = useState(!!scheduledAt);
  const [ogOpen, setOgOpen]             = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tagInput, setTagInput]         = useState("");
  const [aiLoading, setAiLoading]       = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Tag[]>([]);
  const [ogUploading, setOgUploading]   = useState(false);
  const ogInputRef                      = useRef<HTMLInputElement>(null);

  const readingTime = calculateReadingTime(body);
  const isVideoCover = coverMedia?.type === "video";

  // Resolve OG preview image
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

  // ── Tag helpers ───────────────────────────────────────
  const addTag = (tag: Tag) => {
    if (!onTagsChange) return;
    if (tags.find((t) => t.slug === tag.slug)) return;
    onTagsChange([...tags, tag]);
  };
  const removeTag = (slug: string) => {
    if (!onTagsChange) return;
    onTagsChange(tags.filter((t) => t.slug !== slug));
  };
  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = tagInput.trim();
      if (!val) return;
      addTag({ name: val, slug: slugify(val) });
      setTagInput("");
    }
  };

  // ── AI tag generation ─────────────────────────────────
  const generateTags = async () => {
    if (!title) return;
    setAiLoading(true); setAiSuggestions([]);
    try {
      const res = await fetch("/api/generate-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, excerpt }),
      });
      const data = await res.json();
      if (data.tags) setAiSuggestions(data.tags);
    } catch { /* silently fail */ }
    finally { setAiLoading(false); }
  };

  // ── OG image upload (video cover only) ───────────────
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
    } catch { /* silently fail */ }
    finally { setOgUploading(false); }
  }, [supabase, onOgImageUrlChange]);

  return (
    <aside className="w-72 flex-shrink-0 border-r border-border bg-background flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-1">

          {/* ── Action buttons ── */}
          <div className="space-y-2 pb-4">
            <button type="button" onClick={onPreview}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-border hover:border-foreground transition-all group"
              style={{ backgroundColor: "#f4efe4" }}>
              <span className="font-body text-sm font-medium text-foreground">ޕްރިވިއު</span>
              <Eye size={15} className="text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>

            <button type="button" onClick={onSaveDraft} disabled={saving}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-border hover:border-foreground transition-all group disabled:opacity-40"
              style={{ backgroundColor: "#f4efe4" }}>
              <span className="font-body text-sm font-medium text-foreground">
                {saving ? "ސޭވް ކުރަނީ..." : "ޑްރާފްޓް ސޭވް"}
              </span>
              {saving
                ? <RefreshCw size={15} className="text-muted-foreground animate-spin" />
                : <Save size={15} className="text-muted-foreground group-hover:text-foreground transition-colors" />}
            </button>

            {lastSaved && (
              <p className="font-body text-[10px] text-muted-foreground/60 text-center">
                އެންމެ ފަހުން ސޭވް: {lastSaved.toLocaleTimeString("dv-MV", { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}

            <div className="flex gap-1.5 pt-1">
              <button type="button" onClick={onPublish} disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-foreground text-background font-body text-sm font-semibold hover:opacity-80 transition-opacity disabled:opacity-40">
                <Send size={13} /> ލައިވް
              </button>
              <button type="button" onClick={() => setShowScheduler(!showScheduler)}
                className={`px-3 py-2.5 rounded-xl border font-body text-sm transition-all ${showScheduler ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-foreground"}`}
                style={!showScheduler ? { backgroundColor: "#f4efe4" } : {}}>
                <Calendar size={15} />
              </button>
            </div>

            {showScheduler && (
              <div className="space-y-2 p-3 rounded-xl border border-border" style={{ backgroundColor: "#f4efe4" }}>
                <p className="font-body text-xs font-semibold text-foreground">ޝެޑިއުލް</p>
                <input type="datetime-local" value={scheduledAt ?? ""}
                  onChange={(e) => onScheduledAtChange(e.target.value || null)}
                  className="w-full font-body text-xs p-2 rounded-lg border border-border bg-background outline-none focus:border-foreground transition-colors" />
                {scheduledAt && (
                  <button type="button" onClick={onSchedule} disabled={saving}
                    className="w-full py-2 rounded-lg bg-foreground text-background font-body text-xs font-semibold hover:opacity-80 transition-opacity disabled:opacity-40">
                    ޝެޑިއުލް ކުރޭ
                  </button>
                )}
              </div>
            )}

            {error && <p className="font-body text-xs text-destructive text-center">{error}</p>}
          </div>

          <Separator />

          {/* ── Author ── */}
          <div className="py-3 space-y-2">
            <p className="font-body text-xs font-semibold text-foreground flex items-center gap-1.5">
              <User size={12} className="text-muted-foreground" /> ލިޔުންތެރިޔާ
            </p>
            <select value={authorId ?? ""} onChange={(e) => onAuthorIdChange(e.target.value || null)}
              className="w-full font-body text-xs p-2.5 rounded-xl border border-border bg-background outline-none focus:border-foreground appearance-none cursor-pointer transition-colors" dir="rtl">
              <option value="">ހޮވާ...</option>
              {authors.map((a) => <option key={a.id} value={a.id}>{a.full_name}</option>)}
            </select>
          </div>

          <Separator />

          {/* ── Homepage placement ── */}
          <div className="py-3 space-y-2">
            <p className="font-body text-xs font-semibold text-foreground">ހޯމްޕޭޖް ތަން</p>
            <div className="space-y-1 mt-1">

              {/* None */}
              <button type="button" onClick={() => onPlacementChange(null)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${placement === null ? "bg-foreground text-background" : "hover:bg-muted/50"}`}>
                <div className={`w-4 h-4 rounded-md flex-shrink-0 flex items-center justify-center border transition-all ${placement === null ? "bg-background border-background" : "border-border"}`}>
                  {placement === null && <Check size={10} className="text-foreground" />}
                </div>
                <div className="flex-1 text-right">
                  <p className={`font-body text-xs font-semibold ${placement === null ? "text-background" : "text-foreground"}`}>ނެތް</p>
                  <p className={`font-body text-[10px] ${placement === null ? "text-background/70" : "text-muted-foreground"}`}>ކެޓަގަރީ ޕޭޖަށް</p>
                </div>
              </button>

              {PLACEMENTS.map((p) => {
                const Icon = p.icon;
                const isActive = placement === p.value;
                return (
                  <button key={p.value} type="button"
                    onClick={() => onPlacementChange(isActive ? null : p.value)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive ? "bg-foreground text-background" : "hover:bg-muted/50 text-foreground"}`}>
                    <div className={`w-4 h-4 rounded-md flex-shrink-0 flex items-center justify-center border transition-all ${isActive ? "bg-background border-background" : "border-border"}`}>
                      {isActive && <Check size={10} className="text-foreground" />}
                    </div>
                    <Icon size={13} className={isActive ? "text-background" : "text-muted-foreground"} />
                    <div className="flex-1 text-right">
                      <p className={`font-body text-xs font-semibold ${isActive ? "text-background" : "text-foreground"}`}>{p.label}</p>
                      <p className={`font-body text-[10px] ${isActive ? "text-background/70" : "text-muted-foreground"}`}>{p.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Homepage featured toggle — Latest grid */}
            <div className="mt-2 pt-2 border-t border-border">
              <ToggleRow
                icon={<Home size={13} className="text-muted-foreground" />}
                label="ލެޓެސްޓް ގްރިޑް"
                desc="ހޯމްޕޭޖް ތިރީ ގްރިޑް"
                value={homepageFeatured}
                onChange={onHomepageFeaturedChange}
              />
            </div>
          </div>

          <Separator />

          {/* ── Tags ── */}
          <div className="py-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-body text-xs font-semibold text-foreground">ޓެގް</p>
              <button type="button" onClick={generateTags} disabled={aiLoading || !title}
                className="flex items-center gap-1 font-body text-[10px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40">
                {aiLoading ? <RefreshCw size={11} className="animate-spin" /> : <Sparkles size={11} />}
                {aiLoading ? "ހޯދަނީ..." : "AI ޓެގް"}
              </button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span key={tag.slug}
                    className="inline-flex items-center gap-1 font-body text-[11px] px-2 py-1 rounded-lg border border-border"
                    style={{ backgroundColor: "#f4efe4" }}>
                    {tag.name}
                    <button type="button" onClick={() => removeTag(tag.slug)}
                      className="text-muted-foreground hover:text-foreground transition-colors">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {aiSuggestions.length > 0 && (
              <div className="space-y-1">
                <p className="font-body text-[10px] text-muted-foreground">ކްލިކް ކޮށްލާ ޓެގް ލިސްޓަށް ލާ:</p>
                <div className="flex flex-wrap gap-1.5">
                  {aiSuggestions.map((tag) => {
                    const added = tags.find((t) => t.slug === tag.slug);
                    return (
                      <button key={tag.slug} type="button" onClick={() => addTag(tag)}
                        disabled={!!added}
                        className="inline-flex items-center gap-1 font-body text-[11px] px-2 py-1 rounded-lg border transition-all disabled:opacity-40"
                        style={{ backgroundColor: added ? "#f4efe4" : "transparent" }}>
                        {added && <Check size={9} />}
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInput} placeholder="ޓެގް ލިޔެ Enter ޖެހާ..." dir="rtl"
              className="w-full font-body text-xs p-2.5 rounded-xl border border-border bg-background outline-none focus:border-foreground transition-colors" />
          </div>

          <Separator />

          {/* ── OG / SEO ── */}
          <div className="py-1">
            <button type="button" onClick={() => setOgOpen(!ogOpen)}
              className="w-full flex items-center justify-between py-2.5 group">
              <div className="flex items-center gap-1.5">
                <Globe size={12} className="text-muted-foreground" />
                <span className="font-body text-xs font-semibold text-foreground">Open Graph</span>
              </div>
              {ogOpen ? <ChevronUp size={13} className="text-muted-foreground" /> : <ChevronDown size={13} className="text-muted-foreground" />}
            </button>

            {ogOpen && (
              <div className="space-y-3 pb-3">
                {/* OG preview card */}
                <div className="rounded-xl overflow-hidden border border-border">
                  <div className="h-24 bg-muted flex items-center justify-center overflow-hidden relative">
                    {ogPreviewImage
                      ? <img src={ogPreviewImage} alt="" className="w-full h-full object-cover" />
                      : <Globe size={20} className="text-muted-foreground/30" />}
                  </div>
                  <div className="p-2.5 bg-background">
                    <div className="flex items-center gap-1.5 mb-1">
                      <img src="/logo.png" alt="" className="w-3.5 h-3.5 rounded-sm object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider">merihaanaa.com</p>
                    </div>
                    <p className="font-body text-xs font-semibold leading-snug line-clamp-2 text-foreground">
                      {ogTitle || title || "ލިޔުމުގެ ސުރުހީ"}
                    </p>
                    <p className="font-body text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                      {ogDesc || excerpt || "ތަފްސީލް..."}
                    </p>
                  </div>
                </div>

                {/* OG image uploader — only shown for video cover */}
                {isVideoCover && (
                  <div>
                    <label className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      OG ފޮޓޯ
                    </label>
                    <input ref={ogInputRef} type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleOgImageFile(f); e.target.value = ""; }} />

                    {ogImageUrl && !ogImageUrl.includes("vimeo") && !ogImageUrl.includes("youtube") ? (
                      <div className="relative rounded-lg overflow-hidden border border-border">
                        <img src={ogImageUrl} alt="" className="w-full h-20 object-cover" />
                        <button type="button" onClick={() => onOgImageUrlChange(coverMedia?.videoMeta?.thumbnailUrl ?? "")}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors">
                          <X size={11} className="text-white" />
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => ogInputRef.current?.click()} disabled={ogUploading}
                        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-border hover:border-foreground transition-all disabled:opacity-40"
                        style={{ backgroundColor: "#f4efe4" }}>
                        {ogUploading
                          ? <><Loader2 size={13} className="animate-spin text-muted-foreground" /><span className="font-body text-xs text-muted-foreground">ލޯޑްވަނީ...</span></>
                          : <><UploadCloud size={13} className="text-muted-foreground" /><span className="font-body text-xs text-muted-foreground">OG ފޮޓޯ ލޯޑްކޮށްލާ</span></>}
                      </button>
                    )}
                  </div>
                )}

                {/* OG text fields */}
                <div className="space-y-2">
                  <div>
                    <label className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">ސުރުހީ</label>
                    <textarea value={ogTitle} onChange={(e) => onOgTitleChange(e.target.value)}
                      placeholder={title || "ލިޔުމުގެ ސުރުހީ..."} rows={2}
                      className="w-full font-body text-xs p-2.5 rounded-xl border border-border bg-background outline-none focus:border-foreground transition-colors resize-none" />
                  </div>
                  <div>
                    <label className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">ތަފްސީލް</label>
                    <textarea value={ogDesc} onChange={(e) => onOgDescChange(e.target.value)}
                      placeholder={excerpt || "ތަފްސީލް..."} rows={2}
                      className="w-full font-body text-xs p-2.5 rounded-xl border border-border bg-background outline-none focus:border-foreground transition-colors resize-none" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* ── Settings ── */}
          <div className="py-1">
            <button type="button" onClick={() => setSettingsOpen(!settingsOpen)}
              className="w-full flex items-center justify-between py-2.5">
              <span className="font-body text-xs font-semibold text-foreground">ސެޓިންގްސް</span>
              {settingsOpen ? <ChevronUp size={13} className="text-muted-foreground" /> : <ChevronDown size={13} className="text-muted-foreground" />}
            </button>

            {settingsOpen && (
              <div className="space-y-1 pb-3">
                <div className="flex items-center justify-between py-2.5 px-1">
                  <div className="flex items-center gap-2">
                    <Clock size={13} className="text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="font-body text-xs font-medium text-foreground">ކިޔުމަށް ނަގާ ވަގުތު</p>
                      <p className="font-body text-[10px] text-muted-foreground">ބަސްތަކުން ހިސާބުކޮށްލެވޭ</p>
                    </div>
                  </div>
                  <span className="font-body text-xs font-semibold text-muted-foreground tabular-nums">{readingTime} މިނިޓް</span>
                </div>

                <Separator />

                <ToggleRow icon={<Lock size={13} className="text-muted-foreground" />}
                  label="ޕްރިމިއަމް" desc="ސަބްސްކްރައިބަ ލޮގިން ބޭނުންވޭ"
                  value={isPremium} onChange={onIsPremiumChange} />

                <Separator />

                <ToggleRow icon={<MessageCircle size={13} className="text-muted-foreground" />}
                  label="ކޮމެންޓް" desc="ކިޔުންތެރިންނަށް ލިޔެވޭ"
                  value={allowComments} onChange={onAllowCommentsChange} />
              </div>
            )}
          </div>

        </div>
      </div>
    </aside>
  );
}

function ToggleRow({ icon, label, desc, value, onChange }: {
  icon: React.ReactNode; label: string; desc: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 px-1">
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <p className="font-body text-xs font-medium text-foreground">{label}</p>
          <p className="font-body text-[10px] text-muted-foreground">{desc}</p>
        </div>
      </div>
      <button type="button" role="switch" aria-checked={value} onClick={() => onChange(!value)}
        className={`relative flex-shrink-0 w-10 h-6 rounded-full transition-colors duration-200 ${value ? "bg-foreground" : "bg-muted-foreground/25"}`}>
        <span className={`absolute top-1 right-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${value ? "translate-x-[-1rem]" : "translate-x-0"}`} />
      </button>
    </div>
  );
}
