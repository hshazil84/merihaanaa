"use client";
// components/admin/ArticleSidebar.tsx

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Separator } from "@/components/ui/separator";
import {
  ChevronDown, ChevronUp, Send, Save, Eye,
  Clock, Star, BookOpen, FileText, Video,
  Check, Calendar, User, Globe, Lock,
  MessageCircle, RefreshCw,
} from "lucide-react";
import { calculateReadingTime } from "@/lib/utils";
import type { CoverMediaValue } from "@/components/admin/CoverMedia";

interface Author {
  id: string;
  full_name: string;
  role: string;
}

interface Category {
  id: string;
  name: string;
}

interface SidebarProps {
  title: string;
  excerpt: string;
  body: Record<string, unknown> | null;
  categoryId: string | null;
  categories: Category[];
  contentType: string;
  placement: string | null;
  isPremium: boolean;
  allowComments: boolean;
  ogTitle: string;
  ogDesc: string;
  ogImageUrl: string;
  coverMedia: CoverMediaValue | null;
  reviewScore: number | null;
  authorId: string | null;
  scheduledFor: string | null;
  onCategoryIdChange: (v: string | null) => void;
  onPlacementChange: (v: string | null) => void;
  onIsPremiumChange: (v: boolean) => void;
  onAllowCommentsChange: (v: boolean) => void;
  onOgTitleChange: (v: string) => void;
  onOgDescChange: (v: string) => void;
  onAuthorIdChange: (v: string | null) => void;
  onScheduledForChange: (v: string | null) => void;
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
  { value: "hero",           label: "ހީރޯ",          desc: "ހޯމްޕޭޖް ކަވަރ",        icon: Star },
  { value: "editors_choice", label: "އެޑިޓަރ ޗޮއިސް", desc: "ހަތަރު ލިޔުން ގްރިޑް",  icon: BookOpen },
  { value: "people",         label: "މީހުން",          desc: "މީހުން ސެކްޝަން",        icon: User },
  { value: "review",         label: "ރިވިއު",          desc: "ރިވިއު ސެކްޝަން",        icon: FileText },
  { value: "reel",           label: "ރީލް",             desc: "ވީޑިއޯ ސެކްޝަން",        icon: Video },
];

export default function ArticleSidebar({
  title, excerpt, body, categoryId, categories, placement,
  isPremium, allowComments, ogTitle, ogDesc, ogImageUrl,
  coverMedia, authorId, scheduledFor,
  onCategoryIdChange, onPlacementChange, onIsPremiumChange,
  onAllowCommentsChange, onOgTitleChange, onOgDescChange,
  onAuthorIdChange, onScheduledForChange,
  onSaveDraft, onPublish, onSchedule, onPreview,
  saving, lastSaved, error,
}: SidebarProps) {
  const supabase = createClient();
  const [authors, setAuthors] = useState<Author[]>([]);
  const [showScheduler, setShowScheduler] = useState(!!scheduledFor);
  const [ogOpen, setOgOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const readingTime = calculateReadingTime(body);

  const ogPreviewImage =
    ogImageUrl ||
    (coverMedia?.type === "image" ? coverMedia.imageUrl : null) ||
    coverMedia?.videoMeta?.thumbnailUrl ||
    null;

  useEffect(() => {
    supabase
      .from("user_profiles")
      .select("id, full_name, role")
      .in("role", ["admin", "editor", "author"])
      .order("full_name")
      .then(({ data }) => { if (data) setAuthors(data); });
  }, [supabase]);

  return (
    <aside className="w-60 flex-shrink-0 border-0 border-border bg-background flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-1">

          {/* ── Actions ── */}
          <div className="space-y-2 pb-4">
            <button type="button" onClick={onPreview}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-border hover:border-foreground hover:bg-muted/30 transition-all group">
              <span className="font-body text-sm font-medium text-foreground">ޕްރިވިއު</span>
              <Eye size={15} className="text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>

            <button type="button" onClick={onSaveDraft} disabled={saving}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-border hover:border-foreground hover:bg-muted/30 transition-all group disabled:opacity-40">
              <span className="font-body text-sm font-medium text-foreground">
                {saving ? "ސޭވް ކުރަނީ..." : "ޑްރާފްޓް ސޭވް"}
              </span>
              {saving
                ? <RefreshCw size={15} className="text-muted-foreground animate-spin" />
                : <Save size={15} className="text-muted-foreground group-hover:text-foreground transition-colors" />
              }
            </button>

            {lastSaved && (
              <p className="font-body text-[10px] text-muted-foreground/60 text-center">
                އެންމެ ފަހުން ސޭވް: {lastSaved.toLocaleTimeString("dv-MV", { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}

            <div className="flex gap-1.5 pt-1">
              <button type="button" onClick={onPublish} disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-foreground text-background font-body text-sm font-semibold hover:opacity-80 transition-opacity disabled:opacity-40">
                <Send size={13} />ލައިވް
              </button>
              <button type="button" onClick={() => setShowScheduler(!showScheduler)}
                className={`px-3 py-2.5 rounded-xl border transition-all ${showScheduler ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"}`}>
                <Calendar size={15} />
              </button>
            </div>

            {showScheduler && (
              <div className="space-y-2 p-3 rounded-xl bg-muted/30 border border-border">
                <p className="font-body text-xs font-semibold text-foreground">ޝެޑިއުލް</p>
                <input type="datetime-local" value={scheduledFor ?? ""}
                  onChange={(e) => onScheduledForChange(e.target.value || null)}
                  className="w-full font-body text-xs p-2 rounded-lg border border-border bg-background outline-none focus:border-foreground transition-colors" />
                {scheduledFor && (
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
              <User size={12} className="text-muted-foreground" />ލިޔުންތެރިޔާ
            </p>
            <select value={authorId ?? ""} onChange={(e) => onAuthorIdChange(e.target.value || null)}
              className="w-full font-body text-xs p-2.5 rounded-xl border border-border bg-background outline-none focus:border-foreground appearance-none cursor-pointer transition-colors"
              dir="rtl">
              <option value="">ހޮވާ...</option>
              {authors.map((a) => <option key={a.id} value={a.id}>{a.full_name}</option>)}
            </select>
          </div>

          <Separator />

          {/* ── Placement ── */}
          <div className="py-3 space-y-2">
            <p className="font-body text-xs font-semibold text-foreground">ހޯމްޕޭޖް ގަ އިންނަތަން</p>
            <p className="font-body text-[10px] text-muted-foreground leading-relaxed">
              ލިޔުން ހޯމްޕޭޖްގައި ދެއްކޭ ސެކްޝަން ސެލެކްޓް ކުރުމަށް
            </p>
            <div className="space-y-0.5 mt-1">
              {PLACEMENTS.map((p) => {
                const Icon = p.icon;
                const isActive = placement === p.value;
                return (
                  <button key={p.value} type="button"
                    onClick={() => onPlacementChange(isActive ? null : p.value)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive ? "bg-foreground text-background" : "hover:bg-muted/50"}`}>
                    <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-all ${isActive ? "bg-background border-background" : "border-border"}`}>
                      {isActive && <Check size={10} className="text-foreground" />}
                    </div>
                    <Icon size={13} className={`flex-shrink-0 ${isActive ? "text-background" : "text-muted-foreground"}`} />
                    <div className="flex-1 flex items-baseline justify-end gap-1.5 min-w-0">
                      <span className={`font-body text-xs font-semibold truncate ${isActive ? "text-background" : "text-foreground"}`}>
                        {p.label}
                      </span>
                      <span className={`font-body text-[10px] flex-shrink-0 ${isActive ? "text-background/60" : "text-muted-foreground"}`}>
                        · {p.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* ── OG — collapsible ── */}
          <div className="py-1">
            <button type="button" onClick={() => setOgOpen(!ogOpen)}
              className="w-full flex items-center justify-between py-2.5">
              <div className="flex items-center gap-1.5">
                <Globe size={12} className="text-muted-foreground" />
                <span className="font-body text-xs font-semibold text-foreground">Open Graph</span>
              </div>
              {ogOpen ? <ChevronUp size={13} className="text-muted-foreground" /> : <ChevronDown size={13} className="text-muted-foreground" />}
            </button>

            {ogOpen && (
              <div className="space-y-3 pb-3">
                <div className="rounded-xl overflow-hidden border border-border">
                  <div className="h-24 bg-muted flex items-center justify-center overflow-hidden">
                    {ogPreviewImage
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={ogPreviewImage} alt="" className="w-full h-full object-cover" />
                      : <Globe size={20} className="text-muted-foreground/30" />
                    }
                  </div>
                  <div className="p-2.5 bg-background">
                    <div className="flex items-center gap-1.5 mb-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
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

          {/* ── Settings — collapsible ── */}
          <div className="py-1">
            <button type="button" onClick={() => setSettingsOpen(!settingsOpen)}
              className="w-full flex items-center justify-between py-2.5">
              <span className="font-body text-xs font-semibold text-foreground">ސެޓިންގްސް</span>
              {settingsOpen ? <ChevronUp size={13} className="text-muted-foreground" /> : <ChevronDown size={13} className="text-muted-foreground" />}
            </button>

            {settingsOpen && (
              <div className="space-y-1 pb-3">
                {/* Category */}
                <div className="space-y-1.5 pb-3">
                  <label className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">ކެޓަގަރީ</label>
                  <select value={categoryId ?? ""} onChange={(e) => onCategoryIdChange(e.target.value || null)}
                    className="w-full font-body text-xs p-2.5 rounded-xl border border-border bg-background outline-none focus:border-foreground appearance-none cursor-pointer transition-colors"
                    dir="rtl">
                    <option value="">ހޮވާ...</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {/* Reading time */}
                <div className="flex items-center justify-between py-2.5 px-1">
                  <div className="flex items-center gap-2">
                    <Clock size={13} className="text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="font-body text-xs font-medium text-foreground">ކިޔުމަށް ނަގާ ވަގުތު</p>
                      <p className="font-body text-[10px] text-muted-foreground">ބަސްތަކުން ހިސާބުކޮށްލެވޭ</p>
                    </div>
                  </div>
                  <span className="font-body text-xs font-semibold text-muted-foreground tabular-nums">
                    {readingTime} މިނެޓު
                  </span>
                </div>

                <Separator />

                <ToggleRow
                  icon={<Lock size={13} className="text-muted-foreground" />}
                  label="ޕްރިމިއަމް"
                  desc="ސަބްސްކްރައިބަ ލޮގިން ބޭނުންވޭ"
                  value={isPremium}
                  onChange={onIsPremiumChange}
                />

                <Separator />

                <ToggleRow
                  icon={<MessageCircle size={13} className="text-muted-foreground" />}
                  label="ކޮމެންޓް"
                  desc="ކިޔުންތެރިންނަށް ލިޔެވޭ"
                  value={allowComments}
                  onChange={onAllowCommentsChange}
                />
              </div>
            )}
          </div>

        </div>
      </div>
    </aside>
  );
}

function ToggleRow({ icon, label, desc, value, onChange }: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 px-1">
      <div className="flex items-center gap-2 min-w-0">
        <span className="flex-shrink-0">{icon}</span>
        <div className="min-w-0">
          <p className="font-body text-xs font-medium text-foreground">{label}</p>
          <p className="font-body text-[10px] text-muted-foreground truncate">{desc}</p>
        </div>
      </div>
      <button type="button" role="switch" aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 ml-2 ${value ? "bg-foreground" : "bg-muted-foreground/25"}`}>
        <span className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-all duration-200 ${value ? "right-[3px]" : "left-[3px]"}`} />
      </button>
    </div>
  );
}
