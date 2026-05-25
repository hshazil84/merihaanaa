// app/(article)/news/[slug]/page.tsx

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import ArticleBody from "@/components/public/ArticleBody";
import CommentSection from "@/components/public/CommentSection";
import SocialShare from "@/components/public/SocialShare";

interface PageProps {
  params: { slug: string };
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
      category:categories!category_id(id, name, slug),
      author:authors!author_id(full_name, id)
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  return article;
}

async function getRelated(categoryId: string, excludeId: string) {
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

  const articleUrl = `https://merihaanaa.com/news/${article.slug}`;

  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      url:         articleUrl,
      title:       article.title,
      description: article.excerpt ?? "",
      images:      coverImage ? [{ url: coverImage, width: 1200, height: 630 }] : [],
      type:        "article",
      siteName:    "މެރިހާނާ",
    },
    twitter: {
      card:        "summary_large_image",
      title:       article.title,
      description: article.excerpt ?? "",
      images:      coverImage ? [coverImage] : [],
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const article = await getArticle(params.slug);
  if (!article) notFound();

  const category = article.category as any;
  const author   = article.author as any;
  const related  = category?.id ? await getRelated(category.id, article.id) : [];

  const coverImage =
    article.cover_type === "image"
      ? article.cover_url || article.featured_image
      : article.cover_type === "video"
      ? article.cover_video_thumbnail
      : null;

  const publishedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString("dv-MV", {
        year: "numeric", month: "long", day: "numeric",
      })
    : null;

  const articleUrl = `https://merihaanaa.com/news/${article.slug}`;

  return (
    <div className="bg-[#F5F3EF] min-h-screen" dir="rtl">

      {/* ── Breadcrumb ── */}
      <div className="max-w-3xl mx-auto px-6 pt-8 pb-2">
        <nav className="flex items-center gap-2" aria-label="breadcrumb">
          <Link href="/"
            style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontSize: "11px", color: "rgb(160,158,152)", lineHeight: 2 }}
            className="hover:text-[rgb(26,26,26)] transition-colors">
            ހޯމް
          </Link>
          <span style={{ fontSize: "11px", color: "rgb(200,198,192)" }}>/</span>
          {category && (
            <>
              <Link href={`/category/${category.slug}`}
                style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontSize: "11px", color: "rgb(160,158,152)", lineHeight: 2 }}
                className="hover:text-[rgb(26,26,26)] transition-colors">
                {category.name}
              </Link>
              <span style={{ fontSize: "11px", color: "rgb(200,198,192)" }}>/</span>
            </>
          )}
          <span
            style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontSize: "11px", color: "rgb(100,98,92)", lineHeight: 2 }}
            className="line-clamp-1">
            {article.title}
          </span>
        </nav>
      </div>

      {/* ── Article header ── */}
      <header className="max-w-3xl mx-auto px-6 pt-6 pb-8">

        {category && (
          <div className="mb-5">
            <Link href={`/category/${category.slug}`}
              className="inline-block text-[11px] px-3 py-1 rounded-full border"
              style={{
                fontFamily: "'MVTypewriter', sans-serif",
                color: "rgb(100,100,100)",
                borderColor: "rgb(210,207,200)",
                backgroundColor: "rgb(240,239,233)",
                lineHeight: 2,
              }}>
              {category.name}
            </Link>
          </div>
        )}

        <h1
          className="mb-4 leading-tight"
          style={{
            fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
            fontWeight: 700,
            fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
            color: "rgb(26,26,26)",
            lineHeight: 1.8,
          }}>
          {article.title}
        </h1>

        {article.excerpt && (
          <p className="mb-6"
            style={{
              fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
              fontWeight: 400,
              fontSize: "16px",
              color: "rgb(100,98,92)",
              lineHeight: 2,
            }}>
            {article.excerpt}
          </p>
        )}

        <div className="flex items-center justify-between flex-wrap gap-3 pb-6 border-b border-black/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "rgb(210,207,200)" }}>
              <span style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "11px", color: "rgb(100,98,92)" }}>
                {author?.full_name?.[0] ?? "M"}
              </span>
            </div>
            <div>
              {author?.full_name && (
                <p style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontSize: "12px", fontWeight: 700, color: "rgb(26,26,26)", lineHeight: 1.4 }}>
                  {author.full_name}
                </p>
              )}
              {publishedDate && (
                <p dir="ltr" style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontSize: "10px", color: "rgb(160,158,152)", lineHeight: 1.4 }}>
                  {publishedDate}
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
      </header>

      {/* ── Cover image ── */}
      {coverImage && (
        <div className="max-w-4xl mx-auto px-4 mb-8">
          <div className="rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
            <img src={coverImage} alt={article.title} className="w-full h-full object-cover" />
          </div>
          {article.featured_image_caption && (
            <p className="text-center mt-2"
              style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "11px", color: "rgb(160,158,152)", lineHeight: 2 }}>
              {article.featured_image_caption}
            </p>
          )}
        </div>
      )}

      {/* ── Article body ── */}
      <div className="max-w-3xl mx-auto px-6 pb-12">
        <ArticleBody body={article.body} />
      </div>

      {/* ── Tags ── */}
      {Array.isArray(article.tags) && article.tags.length > 0 && (
        <div className="max-w-3xl mx-auto px-6 pb-10">
          <div className="flex flex-wrap gap-2 pt-6 border-t border-black/10">
            {(article.tags as {name: string; slug: string}[]).map((tag) => (
              <Link key={tag.slug} href={`/tag/${tag.slug}`}
                className="inline-block text-[11px] px-3 py-1 rounded-full border transition-colors hover:border-black/30"
                style={{
                  fontFamily: "'MVTypewriter', sans-serif",
                  color: "rgb(100,100,100)",
                  borderColor: "rgb(210,207,200)",
                  backgroundColor: "rgb(240,239,233)",
                  lineHeight: 2,
                }}>
                {tag.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Social share bottom ── */}
      <div className="max-w-3xl mx-auto px-6 pb-10">
        <div className="flex items-center justify-center gap-4 py-6 border-t border-b border-black/10">
          <span style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontSize: "12px", color: "rgb(160,158,152)", lineHeight: 2 }}>
            ޝެއަރ ކުރޭ
          </span>
          <SocialShare url={articleUrl} title={article.title} large />
        </div>
      </div>

      {/* ── Related articles ── */}
      {related.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-12 border-t border-black/10">
          <h2 className="text-center mb-10"
            style={{
              fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
              fontWeight: 400,
              fontSize: "22px",
              color: "rgb(26,26,26)",
              lineHeight: 2,
            }}>
            އިތުރު ލިޔުންތައް
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {related.map((rel: any) => (
              <Link key={rel.id} href={`/news/${rel.slug}`} className="group block">
                <div className="aspect-[4/3] overflow-hidden rounded-lg bg-[#e8e5de] mb-3">
                  {rel.featured_image ? (
                    <img src={rel.featured_image} alt={rel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-[#dedad2]" />
                  )}
                </div>
                {rel.category && (
                  <div className="mb-1.5">
                    <span className="inline-block text-[10px] px-2.5 py-1 rounded-full border"
                      style={{
                        fontFamily: "'MVTypewriter', sans-serif",
                        color: "rgb(100,100,100)",
                        borderColor: "rgb(210,207,200)",
                        backgroundColor: "rgb(240,239,233)",
                        lineHeight: 2,
                      }}>
                      {rel.category.name}
                    </span>
                  </div>
                )}
                <h3 className="line-clamp-2 group-hover:opacity-70 transition-opacity"
                  style={{
                    fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
                    fontWeight: 700,
                    fontSize: "15px",
                    color: "rgb(26,26,26)",
                    lineHeight: 2,
                  }}>
                  {rel.title}
                </h3>
                {rel.reading_time_minutes && (
                  <p style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "10px", color: "rgb(160,158,152)", lineHeight: 2, marginTop: "4px" }}>
                    {rel.reading_time_minutes} މިނެޓު
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Comments ── */}
      {article.allow_comments && (
        <CommentSection articleId={article.id} />
      )}

    </div>
  );
}
