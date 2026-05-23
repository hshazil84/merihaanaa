"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ArticleEditor from "@/components/admin/ArticleEditor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Save, Send, Eye, Globe,
  MapPin, Star, BookOpen,
  Video, FileText, Clock,
} from "lucide-react";
import { createSlug, calculateReadingTime } from "@/lib/utils";

const CATEGORIES = [
  "ކަވަރ ސްޓޯރީ",
  "ފިލްމް",
  "މިއުޒިކް",
  "ފަންނު / އާޓް",
  "ވާހަކަ",
  "ދިރިއުޅުން",
  "ރިވިއު",
  "ކެފޭ / ކެއުން",
  "ދަތުރު",
  "އިންޓަވިއު",
];

const PLACEMENTS = [
  { value: "hero",            label: "ހީރޯ",        icon: Star,      desc: "ހޯމްޕޭޖް ކަވަރ" },
  { value: "editors_choice",  label: "އެޑިޓަރ",      icon: BookOpen,  desc: "ތިން ލިޔުން ގްރިޑް" },
  { value: "review",          label: "ރިވިއު",        icon: FileText,  desc: "ރިވިއު ސެކްޝަން" },
  { value: "reel",            label: "ރީލް",          icon: Video,     desc: "ވީޑިއޯ ސެކްޝަން" },
];

const CONTENT_TYPES = [
  { value: "article",     label: "ލިޔުން" },
  { value: "review",      label: "ރިވިއު" },
  { value: "interview",   label: "އިންޓަވިއު" },
  { value: "photo_essay", label: "ފޮޓޯ ލިޔުން" },
  { value: "fiction",     label: "ވާހަކަ" },
];

export default function NewArticlePage() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState<Record<string, unknown>>({});
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [contentType, setContentType] = useState("article");
  const [placement, setPlacement] = useState<string | null>(null);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [isPremium, setIsPremium] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const [ogTitle, setOgTitle] = useState("");
  const [ogDesc, setOgDesc] = useState("");
  const [reviewScore, setReviewScore] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (publishStatus: "draft" | "published") => {
    if (!title.trim()) { setError("ސުރުހީ ލިޔެލާ"); return; }
    setSaving(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const slug = createSlug(title);
    const readingTime = calculateReadingTime(body);

    const { data, error: err } = await supabase
      .from("articles")
      .insert({
        title,
        slug,
        excerpt,
        body,
        status: publishStatus,
        published_at: publishStatus === "published" ? new Date().toISOString() : null,
        homepage_placement: placement,
        content_type: contentType,
        reading_time_minutes: readingTime,
        is_premium: isPremium,
        og_title: ogTitle || title,
        og_description: ogDesc || excerpt,
        review_score: contentType === "review" ? reviewScore : null,
      })
      .select()
      .single();

    setSaving(false);

    if (err) {
      setError("ލިޔުން ސޭވް ނުވި. އަލުން ލޯޑްކޮށްލާ.");
      return;
    }

    router.push(`/admin/articles/${data.id}`);
  };

  return (
    <div className="flex h-full">

      {/* ── EDITOR MAIN ── */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-4">

          {/* Content type */}
          <div className="flex gap-2 flex-wrap">
            {CONTENT_TYPES.map((ct) => (
              <button
                key={ct.value}
                onClick={() => setContentType(ct.value)}
                className={`
                  font-body text-xs px-3 py-1.5 rounded-full border transition-all
                  ${contentType === ct.value
                    ? "bg-foreground text-background border-foreground"
                    : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                  }
                `}
              >
                {ct.label}
              </button>
            ))}
          </div>

          {/* Title */}
          <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ލިޔުމުގެ ސުރުހީ..."
            rows={2}
            className="w-full font-display text-3xl font-bold bg-transparent border-none outline-none resize-none text-foreground placeholder:text-muted-foreground/40 leading-tight"
          />

          {/* Excerpt */}
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="ކުރު ތަޢާރަފެއް — ކިޔުންތެރިން ފުރަތަމަ ފެންނާ ބައި..."
            rows={2}
            className="w-full font-body text-base text-muted-foreground bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground/40 leading-relaxed"
          />

          {/* Cover image drop zone */}
          <div className="w-full h-48 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-foreground transition-colors bg-muted/20">
            <div className="text-2xl">🖼</div>
            <p className="font-body text-sm text-muted-foreground">ކަވަރ ފޮޓޯ ނުވަތަ ވީޑިއޯ ލޯޑްކޮށްލާ</p>
            <p className="font-body text-xs text-muted-foreground/60">PNG · JPG · MP4 · max 100MB</p>
          </div>

          {/* Review score */}
          {contentType === "review" && (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-muted/20">
              <span className="font-body text-sm font-semibold">ސްކޯ:</span>
              <div className="flex gap-1.5">
                {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                  <button
                    key={n}
                    onClick={() => setReviewScore(n)}
                    className={`
                      w-8 h-8 rounded-lg font-body text-xs font-bold border transition-all
                      ${reviewScore === n
                        ? "bg-foreground text-background border-foreground"
                        : "border-border text-muted-foreground hover:border-foreground"
                      }
                    `}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tiptap Editor */}
          <ArticleEditor
            content={body}
            onChange={setBody}
            placeholder="ލިޔުން ފަށާ..."
          />

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="font-body text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── SETTINGS PANEL ── */}
      <div className="w-72 flex-shrink-0 border-r border-border bg-muted/10 overflow-y-auto">
        <div className="p-4 space-y-4">

          {/* Publish actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 font-body text-xs gap-1.5"
              onClick={() => handleSave("draft")}
              disabled={saving}
            >
              <Save size={12} />
              ޑްރާފްޓް
            </Button>
            <Button
              size="sm"
              className="flex-1 font-body text-xs gap-1.5"
              onClick={() => handleSave("published")}
              disabled={saving}
            >
              <Send size={12} />
              {saving ? "ލޯޑްވަނީ..." : "ލައިވް"}
            </Button>
          </div>

          <Separator />

          {/* Homepage placement */}
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="font-body text-xs font-semibold flex items-center gap-2">
                <MapPin size={12} />
                ހޯމްޕޭޖް ތަން
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              <p className="font-body text-xs text-muted-foreground leading-relaxed">
                ލިޔުން ހޯމްޕޭޖްގެ ކޮންތަނެއްގައި ދެއްކޭ ގޮތް ހޮވާ
              </p>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {PLACEMENTS.map((p) => {
                  const Icon = p.icon;
                  const isActive = placement === p.value;
                  return (
                    <button
                      key={p.value}
                      onClick={() => setPlacement(isActive ? null : p.value)}
                      className={`
                        p-3 rounded-lg border text-right transition-all
                        ${isActive
                          ? "bg-foreground text-background border-foreground"
                          : "border-border hover:border-foreground bg-background"
                        }
                      `}
                    >
                      <Icon size={14} className={`mb-1.5 ${isActive ? "text-background" : "text-muted-foreground"}`} />
                      <div className={`font-body text-xs font-bold ${isActive ? "text-background" : "text-foreground"}`}>
                        {p.label}
                      </div>
                      <div className={`font-body text-[10px] mt-0.5 ${isActive ? "text-background/70" : "text-muted-foreground"}`}>
                        {p.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
              {placement && (
                <button
                  onClick={() => setPlacement(null)}
                  className="font-body text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
                >
                  ތަން ނެގުން ×
                </button>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* OG / SEO */}
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="font-body text-xs font-semibold flex items-center gap-2">
                <Globe size={12} />
                Open Graph
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              {/* OG Preview */}
              <div className="rounded-lg overflow-hidden border border-border">
                <div className="h-20 bg-muted flex items-center justify-center">
                  <span className="font-body text-xs text-muted-foreground">OG ތަސްވީރ</span>
                </div>
                <div className="p-2.5 bg-background">
                  <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider mb-1">merihaanaa.com</p>
                  <p className="font-body text-xs font-semibold leading-snug line-clamp-2">
                    {ogTitle || title || "ލިޔުމުގެ ސުރުހީ"}
                  </p>
                  <p className="font-body text-[10px] text-muted-foreground mt-1 line-clamp-2">
                    {ogDesc || excerpt || "ތަފްސީލް..."}
                  </p>
                </div>
              </div>

              <div>
                <label className="font-body text-xs font-semibold text-muted-foreground block mb-1.5">
                  OG ސުރުހީ
                </label>
                <textarea
                  value={ogTitle}
                  onChange={(e) => setOgTitle(e.target.value)}
                  placeholder={title || "ލިޔުމުގެ ސުރުހީ..."}
                  rows={2}
                  className="w-full font-body text-xs p-2.5 rounded-lg border border-border bg-background outline-none focus:border-foreground transition-colors resize-none"
                />
              </div>

              <div>
                <label className="font-body text-xs font-semibold text-muted-foreground block mb-1.5">
                  OG ތަފްސީލް
                </label>
                <textarea
                  value={ogDesc}
                  onChange={(e) => setOgDesc(e.target.value)}
                  placeholder={excerpt || "ތަފްސީލް..."}
                  rows={2}
                  className="w-full font-body text-xs p-2.5 rounded-lg border border-border bg-background outline-none focus:border-foreground transition-colors resize-none"
                />
              </div>

              <div>
                <label className="font-body text-xs font-semibold text-muted-foreground block mb-1.5">
                  OG ތަސްވީރ (1200×630)
                </label>
                <div className="w-full h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-foreground transition-colors">
                  <span className="font-body text-xs text-muted-foreground">ފޮޓޯ ލޯޑްކޮށްލާ</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Settings */}
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="font-body text-xs font-semibold flex items-center gap-2">
                <Eye size={12} />
                ސެޓިންގްސް
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-1">

              {/* Category */}
              <div className="py-2">
                <label className="font-body text-xs font-semibold text-muted-foreground block mb-1.5">
                  ކެޓަގަރީ
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full font-body text-xs p-2.5 rounded-lg border border-border bg-background outline-none focus:border-foreground appearance-none cursor-pointer"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <Separator />

              {/* Reading time */}
              <div className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2">
                  <Clock size={12} className="text-muted-foreground" />
                  <div>
                    <p className="font-body text-xs font-semibold">ކިޔުމަށް ނަގާ ވަގުތު</p>
                    <p className="font-body text-[10px] text-muted-foreground">ބަސްތަކުން ހިސާބުކޮށްލެވޭ</p>
                  </div>
                </div>
                <span className="font-body text-xs text-muted-foreground">
                  {calculateReadingTime(body)} ދ
                </span>
              </div>

              <Separator />

              {/* Premium toggle */}
              <div className="flex items-center justify-between py-2.5">
                <div>
                  <p className="font-body text-xs font-semibold">ޕްރިމިއަމް</p>
                  <p className="font-body text-[10px] text-muted-foreground">ސަބްސްކްރައިބަ ލޮގިން ބޭނުންވޭ</p>
                </div>
                <Toggle value={isPremium} onChange={setIsPremium} />
              </div>

              <Separator />

              {/* Comments toggle */}
              <div className="flex items-center justify-between py-2.5">
                <div>
                  <p className="font-body text-xs font-semibold">ކޮމެންޓް</p>
                  <p className="font-body text-[10px] text-muted-foreground">ކިޔުންތެރިންނަށް ލިޔެވޭ</p>
                </div>
                <Toggle value={allowComments} onChange={setAllowComments} />
              </div>

            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

// ── Toggle component ──────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`
        relative w-9 h-5 rounded-full transition-colors flex-shrink-0
        ${value ? "bg-foreground" : "bg-muted-foreground/30"}
      `}
    >
      <span className={`
        absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform
        ${value ? "translate-x-[-1.25rem]" : "translate-x-[-0.125rem]"}
      `} />
    </button>
  );
}