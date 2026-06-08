// src/app/(site)/[category]/[slug]/page.tsx

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import ArticleBody from "@/components/public/ArticleBody";
import CommentSection from "@/components/public/CommentSection";
import SocialShare from "@/components/public/SocialShare";
import ViewTracker from "@/components/public/ViewTracker";

interface PageProps {
  params: { category: string; slug: string };
}

const DHIVEHI_MONTHS: Record<number, string> = {
  1: "ޖެނުއަރީ", 2: "ފެބްރުއަރީ", 3: "މާރިޗު", 4: "އޭޕްރީލް",
  5: "މެއި", 6: "ޖޫން", 7: "ޖުލައި", 8: "އޮގަސްޓް",
  9: "ސެޕްޓެމްބަރު", 10: "އޮކްޓޯބަރު", 11: "ނޮވެމްބަރު", 12: "ޑިސެމްބަރު",
};

function formatDhivehiDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${DHIVEHI_MONTHS[d.getMonth() + 1]} ${d.getFullYear()}`;
}

function chapterLabel(n: number | null) {
  if (!n) return null;
  return `${n} ވަނަ ބައި`;
}

async function getArticle(slug: string) {
  const supabase = await createServerSupabaseClient();
  const { data: article } = await supabase
    .from("articles")
    .select(`
      id, title, slug, excerpt, body,
      featured_image, cover_type, cover_url,
      cover_video_id, cover_video_provider, cover_video_thumbnail,
      featured_image_caption,
      reading_time_minutes, published_at, allow_comments,
      is_premium, tags,
      series_id, chapter_number,
      category:categories!category_id(id, name, slug),
      author:authors!author_id(full_name, id, avatar)
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  return article;
}

async function getSeriesChapters(seriesId: string, currentId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: series } = await supabase
    .from("series")
    .select("id, title")
    .eq("id", seriesId)
    .single();

  const { data: chapters } = await supabase
    .from("articles")
    .select("id, title, slug, chapter_number, category:categories!category_id(slug)")
    .eq("series_id", seriesId)
    .eq("status", "published")
    .order("chapter_number", { ascending: true, nullsFirst: false });

  return { series, chapters: chapters ?? [] };
}

async function getRelated(categoryId: string, excludeId: string, categorySlug: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("articles")
    .select("id, title, slug, featured_image, reading_time_minutes, category:categories!category_id(name, slug)")
    .eq("status", "published")
    .eq("category_id", categoryId)
    .neq("id", excludeId)
    .order("published_at", { ascending: false })
    .limit(3);
  return data ?? [];
}

export async function generateMetadata({ params }: PageProps) {
  const article = await getArticle(params.slug);
  if (!article) return { title: "ލިޔުން ނުލިބުނު" };

  const coverImage =
    article.cover_type === "image"
      ? article.cover_url || article.featured_image
      : article.cover_video_thumbnail;

  const cat = article.category as any;
  const catSlug = cat?.slug ?? params.category;
  const articleUrl = "https://merihaanaa.com/" + catSlug + "/" + article.slug;

  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      url: articleUrl, title: article.title, description: article.excerpt ?? "",
      images: coverImage ? [{ url: coverImage, width: 1200, height: 630 }] : [],
      type: "article", siteName: "މެރިހާނާ",
    },
    twitter: {
      card: "summary_large_image", title: article.title,
      description: article.excerpt ?? "", images: coverImage ? [coverImage] : [],
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const article = await getArticle(params.slug);
  if (!article) notFound();

  const category = article.category as any;
  const author   = article.author as any;
  const catSlug  = category?.slug ?? params.category;
  const isVaahaka = catSlug === "vaahaka";
  const hasSeries = isVaahaka && article.series_id;

  const related = category?.id ? await getRelated(category.id, article.id, catSlug) : [];
  const { series, chapters } = hasSeries
    ? await getSeriesChapters(article.series_id!, article.id)
    : { series: null, chapters: [] };

  const coverImage =
    article.cover_type === "image"
      ? article.cover_url || article.featured_image
      : article.cover_type === "video" ? article.cover_video_thumbnail : null;

  const publishedDate = article.published_at ? formatDhivehiDate(article.published_at) : null;
  const articleUrl = "https://merihaanaa.com/" + catSlug + "/" + article.slug;

  // Current chapter index for prev/next
  const currentChapterIndex = chapters.findIndex((c: any) => c.id === article.id);
  const prevChapter = currentChapterIndex > 0 ? chapters[currentChapterIndex - 1] : null;
  const nextChapter = currentChapterIndex < chapters.length - 1 ? chapters[currentChapterIndex + 1] : null;

  const articleContent = (
    <div className="bg-[#F5F3EF] min-h-screen" dir="rtl">
      <ViewTracker articleId={article.id} />

      {/* Header */}
      <header className="max-w-3xl mx-auto px-6 pt-8 pb-6 text-center">
        {category && (
          <div className="mb-5 flex justify-center">
            <Link href={"/" + category.slug}
              className="inline-block text-[11px] px-3 py-1 rounded-full border transition-colors hover:border-black/30"
              style={{ fontFamily: "'MVTypewriter', sans-serif", color: "rgb(100,100,100)", borderColor: "rgb(210,207,200)", backgroundColor: "rgb(240,239,233)", lineHeight: 2 }}>
              {category.name}
            </Link>
          </div>
        )}

        {/* Chapter label for vaahaka */}
        {hasSeries && article.chapter_number && (
          <p className="mb-2 text-sm" style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', color: "rgb(160,158,152)", lineHeight: 2 }}>
            {chapterLabel(article.chapter_number)}
          </p>
        )}

        <h1 className="mb-4" style={{
          fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
          fontWeight: 700, fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
          color: "rgb(26,26,26)", lineHeight: 1.8, textAlign: "center",
        }}>
          {article.title}
        </h1>

        {article.excerpt && (
          <p style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontWeight: 400, fontSize: "16px", color: "rgb(100,98,92)", lineHeight: 2, textAlign: "center" }}>
            {article.excerpt}
          </p>
        )}
      </header>

      {/* Cover */}
      {coverImage && (
        <div className="w-full mb-6">
          <div className="max-w-4xl mx-auto px-4">
            <div className="overflow-hidden rounded-xl" style={{ aspectRatio: "16/9" }}>
              <img src={coverImage} alt={article.title} className="w-full h-full object-cover" />
            </div>
            {article.featured_image_caption && (
              <p className="text-center mt-2" style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "11px", color: "rgb(160,158,152)", lineHeight: 2 }}>
                {article.featured_image_caption}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Byline */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ backgroundColor: "rgb(210,207,200)" }}>
          {author?.avatar ? (
            <img src={process.env.NEXT_PUBLIC_SUPABASE_URL + "/storage/v1/object/public/avatars/" + author.avatar}
              alt={author.full_name} className="w-full h-full object-cover" />
          ) : (
            <span style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "11px", color: "rgb(100,98,92)" }}>
              {author?.full_name?.[0] ?? "M"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {author?.full_name && (
            <p style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontSize: "12px", fontWeight: 700, color: "rgb(26,26,26)", lineHeight: 1.4 }}>
              {author.full_name}
            </p>
          )}
          {publishedDate && (
            <p style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontSize: "10px", color: "rgb(160,158,152)", lineHeight: 1.4 }}>
              · {publishedDate}
            </p>
          )}
        </div>
      </div>
          <div className="flex items-center gap-4">
            {article.reading_time_minutes && (
              <span style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontSize: "11px", color: "rgb(160,158,152)", lineHeight: 2 }}>
                {article.reading_time_minutes} މިނެޓު
              </span>
            )}
            <SocialShare url={articleUrl} title={article.title} />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-6 pb-12">
        <ArticleBody body={article.body} />
      </div>

      {/* Prev / Next chapter navigation — vaahaka only */}
      {hasSeries && (prevChapter || nextChapter) && (
        <div className="max-w-3xl mx-auto px-6 pb-8">
          <div className="flex items-center justify-between gap-4 py-5 border-t border-b border-black/10">
            {nextChapter ? (
              <Link href={`/${(nextChapter as any).category?.slug ?? catSlug}/${(nextChapter as any).slug}`}
                className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity"
                style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', color: "rgb(26,26,26)" }}>
                <svg className="w-4 h-4 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <div className="text-right">
                  <p className="text-[10px] text-neutral-400">{chapterLabel((nextChapter as any).chapter_number)}</p>
                  <p className="font-semibold line-clamp-1">{(nextChapter as any).title}</p>
                </div>
              </Link>
            ) : <div />}

            {prevChapter ? (
              <Link href={`/${(prevChapter as any).category?.slug ?? catSlug}/${(prevChapter as any).slug}`}
                className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity text-left"
                style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', color: "rgb(26,26,26)" }}>
                <div>
                  <p className="text-[10px] text-neutral-400">{chapterLabel((prevChapter as any).chapter_number)}</p>
                  <p className="font-semibold line-clamp-1">{(prevChapter as any).title}</p>
                </div>
                <svg className="w-4 h-4 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ) : <div />}
          </div>
        </div>
      )}

      {/* Mobile chapters strip — vaahaka only */}
      {hasSeries && chapters.length > 1 && (
        <div className="md:hidden max-w-3xl mx-auto px-6 pb-8">
          <p className="text-xs font-semibold text-neutral-500 mb-3" style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif' }}>
            {series?.title ?? "ބައިތައް"}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar" style={{ scrollbarWidth: "none" }}>
            {chapters.map((ch: any) => {
              const isCurrent = ch.id === article.id;
              return (
                <Link key={ch.id}
                  href={`/${ch.category?.slug ?? catSlug}/${ch.slug}`}
                  className={`flex-none px-3 py-2 rounded-lg border text-center transition-colors ${
                    isCurrent
                      ? "bg-neutral-900 border-neutral-900 text-white"
                      : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
                  }`}
                  style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', minWidth: "80px" }}
                >
                  <p className={`text-[9px] ${isCurrent ? "text-white/60" : "text-neutral-400"}`}>
                    {ch.chapter_number ? `${ch.chapter_number} ވަނަ` : "—"}
                  </p>
                  <p className="text-xs font-semibold line-clamp-1 mt-0.5">{ch.title}</p>
                </Link>
              );
            })}
          </div>
          {/* Mobile ad slot */}
          <div className="mt-6 w-full h-20 rounded-xl bg-neutral-100 border border-dashed border-neutral-200 flex items-center justify-center">
            <p className="text-xs text-neutral-400">Ad</p>
          </div>
        </div>
      )}

      {/* Tags */}
      {Array.isArray(article.tags) && article.tags.length > 0 && (
        <div className="max-w-3xl mx-auto px-6 pb-10">
          <div className="flex flex-wrap gap-2 pt-6 border-t border-black/10">
            {(article.tags as { name: string; slug: string }[]).map((tag) => (
              <Link key={tag.slug} href={"/tag/" + tag.slug}
                className="inline-block text-[11px] px-3 py-1 rounded-full border transition-colors hover:border-black/30"
                style={{ fontFamily: "'MVTypewriter', sans-serif", color: "rgb(100,100,100)", borderColor: "rgb(210,207,200)", backgroundColor: "rgb(240,239,233)", lineHeight: 2 }}>
                {tag.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Share bottom */}
      <div className="max-w-3xl mx-auto px-6 pb-10">
        <div className="flex items-center justify-center gap-4 py-6 border-t border-b border-black/10">
          <span style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontSize: "12px", color: "rgb(160,158,152)", lineHeight: 2 }}>
            ޝެއަރ ކުރޭ
          </span>
          <SocialShare url={articleUrl} title={article.title} large />
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-12 border-t border-black/10">
          <h2 className="text-center mb-10" style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontWeight: 400, fontSize: "22px", color: "rgb(26,26,26)", lineHeight: 2 }}>
            އިތުރު ލިޔުންތައް
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(related as any[]).map((rel) => {
              const relCatSlug = rel.category?.slug ?? catSlug;
              return (
                <Link key={rel.id} href={"/" + relCatSlug + "/" + rel.slug} className="group block">
                  <div className="aspect-[4/3] overflow-hidden rounded-lg bg-[#e8e5de] mb-3">
                    {rel.featured_image ? (
                      <img src={rel.featured_image} alt={rel.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : <div className="w-full h-full bg-[#dedad2]" />}
                  </div>
                  {rel.category && (
                    <div className="mb-1.5">
                      <span className="inline-block text-[10px] px-2.5 py-1 rounded-full border"
                        style={{ fontFamily: "'MVTypewriter', sans-serif", color: "rgb(100,100,100)", borderColor: "rgb(210,207,200)", backgroundColor: "rgb(240,239,233)", lineHeight: 2 }}>
                        {rel.category.name}
                      </span>
                    </div>
                  )}
                  <h3 className="line-clamp-2 group-hover:opacity-70 transition-opacity"
                    style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontWeight: 700, fontSize: "15px", color: "rgb(26,26,26)", lineHeight: 2 }}>
                    {rel.title}
                  </h3>
                  {rel.reading_time_minutes && (
                    <p style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "10px", color: "rgb(160,158,152)", lineHeight: 2, marginTop: "4px" }}>
                      {rel.reading_time_minutes} މިނެޓު
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Comments */}
      {article.allow_comments && (
        <div className="max-w-3xl mx-auto px-6 pb-16">
          <CommentSection articleId={article.id} />
        </div>
      )}
    </div>
  );

  // ── Vaahaka + series: two-column desktop layout ──
  if (hasSeries && chapters.length > 0) {
    return (
      <div className="bg-[#F5F3EF]">
        <div className="max-w-7xl mx-auto flex gap-0 relative">
          {/* Main article — takes full width on mobile, ~65% on desktop */}
          <div className="flex-1 min-w-0">
            {articleContent}
          </div>

          {/* Chapters sidebar — desktop only */}
          <aside className="hidden md:block w-72 flex-none">
            <div className="sticky top-24 p-6 space-y-4">
              {/* Series title */}
              <div>
                <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1"
                  style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif' }}>
                  ސީރީޒް
                </p>
                <p className="text-sm font-bold text-neutral-900"
                  style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif' }}>
                  {series?.title}
                </p>
              </div>

              {/* Chapter list */}
              <div className="space-y-1">
                {chapters.map((ch: any) => {
                  const isCurrent = ch.id === article.id;
                  return (
                    <Link key={ch.id}
                      href={`/${ch.category?.slug ?? catSlug}/${ch.slug}`}
                      className={`flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                        isCurrent ? "bg-neutral-900 text-white" : "hover:bg-neutral-100 text-neutral-700"
                      }`}
                    >
                      <span className={`text-[10px] flex-none mt-0.5 tabular-nums ${isCurrent ? "text-white/50" : "text-neutral-400"}`}>
                        {ch.chapter_number ? `${ch.chapter_number}` : "—"}
                      </span>
                      <div className="min-w-0">
                        {ch.chapter_number && (
                          <p className={`text-[9px] ${isCurrent ? "text-white/50" : "text-neutral-400"}`}
                            style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif' }}>
                            {ch.chapter_number} ވަނަ ބައި
                          </p>
                        )}
                        <p className="text-xs font-semibold line-clamp-2 leading-snug"
                          style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif' }}>
                          {ch.title}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Desktop ad slot */}
              <div className="w-full rounded-xl bg-neutral-100 border border-dashed border-neutral-200 flex items-center justify-center" style={{ height: "250px" }}>
                <p className="text-xs text-neutral-400">Ad</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return articleContent;
}
