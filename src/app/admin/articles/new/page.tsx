"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ArticleEditor from "@/components/admin/ArticleEditor";
import CoverMedia, { type CoverMediaValue } from "@/components/admin/CoverMedia";
import ArticleSidebar from "@/components/admin/ArticleSidebar";
import { generateArticleSlug, calculateReadingTime } from "@/lib/utils";
import { Save, Eye, Send, Loader2 } from "lucide-react";

interface Category { id: string; name: string; }

export default function NewArticlePage() {
  const router   = useRouter();
  const supabase = createClient();

  const [title, setTitle]               = useState("");
  const [excerpt, setExcerpt]           = useState("");
  const [body, setBody]                 = useState<Record<string, unknown> | null>(null);
  const [categoryId, setCategoryId]     = useState<string | null>(null);
  const [categories, setCategories]     = useState<Category[]>([]);
  const [placement, setPlacement]       = useState<string | null>(null);
  const [homepageFeatured, setHomepageFeatured] = useState(false);
  const [isPremium, setIsPremium]       = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const [ogTitle, setOgTitle]           = useState("");
  const [ogDesc, setOgDesc]             = useState("");
  const [ogImageUrl, setOgImageUrl]     = useState("");
  const [coverMedia, setCoverMedia]     = useState<CoverMediaValue | null>(null);
  const [authorId, setAuthorId]         = useState<string | null>(null);
  const [scheduledFor, setScheduledFor] = useState<string | null>(null);
  const [tags, setTags]                 = useState<{ name: string; slug: string }[]>([]);

  const [saving, setSaving]       = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [slug, setSlug]           = useState("");

  const articleIdRef = useRef<string | null>(null);
  const slugRef      = useRef<string>("");
  const placementRef = useRef<string | null>(null);
  const categoryRef  = useRef<string | null>(null);
  const isPremiumRef = useRef(false);

  useEffect(() => {
    supabase.from("categories").select("id, name").order("name")
      .then(({ data }) => {
        if (data) {
          setCategories(data);
          if (data.length > 0) {
            setCategoryId(data[0].id);
            categoryRef.current = data[0].id;
          }
        }
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { placementRef.current = placement; }, [placement]);
  useEffect(() => { categoryRef.current = categoryId; }, [categoryId]);
  useEffect(() => { isPremiumRef.current = isPremium; }, [isPremium]);

  const editorScrollRef = useRef<HTMLDivElement>(null);

  const handleBodyChange = useCallback((newBody: Record<string, unknown>) => {
    const el = editorScrollRef.current;
    const scrollTop = el?.scrollTop ?? 0;
    setBody(newBody);
    requestAnimationFrame(() => { if (el) el.scrollTop = scrollTop; });
  }, []);

  const handleCoverMediaChange = (value: CoverMediaValue | null) => {
    setCoverMedia(value);
    if (value?.type === "video" && value.videoMeta?.thumbnailUrl && !ogImageUrl) {
      setOgImageUrl(value.videoMeta.thumbnailUrl);
    }
    if (value?.type === "image") setOgImageUrl("");
  };

  useEffect(() => {
    if (!title.trim()) return;
    const interval = setInterval(() => { handleSave("draft", true); }, 60000);
    return () => clearInterval(interval);
  }, [title, body, excerpt]); // eslint-disable-line react-hooks/exhaustive-deps

  const buildPayload = (publishStatus: "draft" | "published" | "scheduled") => {
    const coverFields =
      coverMedia?.type === "image"
        ? { cover_type: "image", cover_url: coverMedia.imageUrl ?? null, featured_image: coverMedia.imageUrl ?? null, cover_video_id: null, cover_video_provider: null, cover_video_thumbnail: null }
        : coverMedia?.type === "video"
        ? { cover_type: "video", cover_url: null, featured_image: null, cover_video_id: coverMedia.videoMeta?.videoId ?? null, cover_video_provider: coverMedia.videoMeta?.provider ?? null, cover_video_thumbnail: coverMedia.videoMeta?.thumbnailUrl ?? null }
        : { cover_type: null, cover_url: null, featured_image: null, cover_video_id: null, cover_video_provider: null, cover_video_thumbnail: null };

    const resolvedOgImage =
      ogImageUrl?.trim() ||
      coverFields.featured_image ||
      coverFields.cover_video_thumbnail ||
      null;

    return {
      title,
      excerpt,
      body,
      category_id: categoryRef.current,
      author_id: authorId,
      content_type: "article",
      ...coverFields,
      status: publishStatus,
      published_at: publishStatus === "published" ? new Date().toISOString() : null,
      scheduled_for: publishStatus === "scheduled" ? scheduledFor : null,
      homepage_placement: placementRef.current,
      homepage_featured: homepageFeatured,
      is_premium: isPremiumRef.current,
      allow_comments: allowComments,
      og_title: ogTitle || title,
      og_description: ogDesc || excerpt,
      og_image_url: resolvedOgImage,
      tags,
      reading_time_minutes: calculateReadingTime(body),
    };
  };

  const handleSave = async (
    publishStatus: "draft" | "published" | "scheduled",
    silent = false,
  ) => {
    if (!title.trim()) { if (!silent) setError("ސުރުހީ ލިޔެލާ"); return; }
    if (!silent) { setSaving(true); setError(null); }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const payload = buildPayload(publishStatus);
    let data, err;

    if (articleIdRef.current) {
      ({ data, error: err } = await supabase
        .from("articles").update(payload).eq("id", articleIdRef.current).select().single());
    } else {
      const generatedSlug = generateArticleSlug(title);
      slugRef.current = generatedSlug;
      setSlug(generatedSlug);
      ({ data, error: err } = await supabase
        .from("articles").insert({ ...payload, slug: generatedSlug }).select().single());
    }

    if (!silent) setSaving(false);
    if (err) { if (!silent) setError("ލިޔުން ސޭވް ނުވި: " + err.message); return; }

    if (data) {
      articleIdRef.current = data.id;
      slugRef.current = data.slug;
      setSlug(data.slug);
      setLastSaved(new Date());
    }

    if (!silent && (publishStatus === "published" || publishStatus === "scheduled")) {
      router.push(`/admin/articles/${articleIdRef.current}`);
    }
  };

  const handleTagsChange = useCallback(
    (updater: { name: string; slug: string }[] | ((prev: { name: string; slug: string }[]) => { name: string; slug: string }[])) => {
      if (typeof updater === "function") {
        setTags((prev) => updater(prev));
      } else {
        setTags(updater);
      }
    }, []
  );

  const handlePreview = () => {
    window.open(`/preview/${slugRef.current || generateArticleSlug(title)}`, "_blank");
  };

  return (
    <div className="flex h-full">

      <ArticleSidebar
        title={title}
        excerpt={excerpt}
        body={body}
        categories={categories}
        categoryId={categoryId}
        placement={placement}
        homepageFeatured={homepageFeatured}
        isPremium={isPremium}
        allowComments={allowComments}
        ogTitle={ogTitle}
        ogDesc={ogDesc}
        ogImageUrl={ogImageUrl}
        coverMedia={coverMedia}
        authorId={authorId}
        scheduledAt={scheduledFor}
        tags={tags}
        onCategoryChange={(id) => { setCategoryId(id); categoryRef.current = id; }}
        onPlacementChange={setPlacement}
        onHomepageFeaturedChange={setHomepageFeatured}
        onIsPremiumChange={setIsPremium}
        onAllowCommentsChange={setAllowComments}
        onOgTitleChange={setOgTitle}
        onOgDescChange={setOgDesc}
        onOgImageUrlChange={setOgImageUrl}
        onAuthorIdChange={setAuthorId}
        onScheduledAtChange={setScheduledFor}
        onTagsChange={handleTagsChange}
        onSaveDraft={() => handleSave("draft")}
        onPublish={() => handleSave("published")}
        onSchedule={() => handleSave("scheduled")}
        onPreview={handlePreview}
        saving={saving}
        lastSaved={lastSaved}
        error={error}
        slug={slug}
      />

      <div ref={editorScrollRef} className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-4">

          {/* Category chips */}
          <div className="flex gap-2 flex-wrap" dir="rtl">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => { setCategoryId(cat.id); categoryRef.current = cat.id; }}
                className={`font-body text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                  categoryId === cat.id
                    ? "bg-foreground text-background border-foreground"
                    : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                }`}
              >
                {categoryId === cat.id && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {cat.name}
              </button>
            ))}
          </div>

          {/* Title */}
          <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ލިޔުމުގެ ސުރުހީ..."
            rows={2}
            dir="rtl"
            className="w-full font-display text-3xl font-bold bg-transparent border-none outline-none resize-none text-foreground placeholder:text-muted-foreground/40 leading-tight"
          />

          {/* Excerpt */}
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="ކުރު ތަޢާރަފެއް — ކިޔުންތެރިން ފުރަތަމަ ފެންނާ ބައި..."
            rows={2}
            dir="rtl"
            className="w-full font-body text-base text-muted-foreground bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground/40 leading-relaxed"
          />

          {/* Cover */}
          <CoverMedia value={coverMedia} onChange={handleCoverMediaChange} />

          {/* Editor */}
          <ArticleEditor
            content={body ?? undefined}
            onChange={handleBodyChange}
            placeholder="ލިޔުން ފަށާ..."
          />

          {/* ── Floating action bar ── */}
          <div className="sticky bottom-4 z-20" dir="rtl">
            <div className="flex items-center gap-2 p-2 rounded-2xl border border-border bg-background/95 backdrop-blur-sm shadow-lg w-fit">

              {lastSaved && (
                <span className="font-body text-xs text-muted-foreground px-2">
                  {lastSaved.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}

              <button
                type="button"
                onClick={() => handleSave("draft")}
                disabled={saving}
                title="ސޭވް ޑްރާފްޓް"
                className="flex items-center gap-2 px-3 py-2 rounded-xl font-body text-xs text-muted-foreground border border-border hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                ސޭވް
              </button>

              <button
                type="button"
                onClick={handlePreview}
                title="ޕްރިވިއު"
                className="flex items-center gap-2 px-3 py-2 rounded-xl font-body text-xs text-muted-foreground border border-border hover:bg-muted hover:text-foreground transition-colors"
              >
                <Eye size={14} />
                ޕްރިވިއު
              </button>

              <button
                type="button"
                onClick={() => handleSave("published")}
                disabled={saving}
                title="ޝާއިއު"
                className="flex items-center gap-2 px-3 py-2 rounded-xl font-body text-xs bg-foreground text-background hover:opacity-80 transition-opacity disabled:opacity-40"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                ޝާއިއު
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="font-body text-sm text-destructive">{error}</p>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
