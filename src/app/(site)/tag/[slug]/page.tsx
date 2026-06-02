// app/(site)/tag/[slug]/page.tsx

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import NewsletterCTA from "@/components/public/NewsletterCTA";

interface PageProps {
  params: { slug: string };
  searchParams: { page?: string };
}

const PAGE_SIZE = 12;

async function getTagData(slug: string, page: number) {
  const supabase = await createServerSupabaseClient();

  const from = (page - 1) * PAGE_SIZE;
  const to   = from + PAGE_SIZE - 1;

  const { data: articles, count } = await supabase
    .from("articles")
    .select(
      "id, title, slug, excerpt, featured_image, reading_time_minutes, published_at, tags, category:categories!category_id(name, slug), author:authors!author_id(full_name)",
      { count: "exact" }
    )
    .eq("status", "published")
    .contains("tags", JSON.stringify([{ slug }]))
    .order("published_at", { ascending: false })
    .range(from, to);

  if (!articles || articles.length === 0) return null;

  // Get the tag name from the first article's tags array
  const firstArticleTags = articles[0].tags as { name: string; slug: string }[] | null;
  const tagName = firstArticleTags?.find((t) => t.slug === slug)?.name ?? slug;

  return {
    tagName,
    tagSlug: slug,
    articles,
    total: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
  };
}

export async function generateMetadata({ params }: PageProps) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("articles")
    .select("tags")
    .eq("status", "published")
    .contains("tags", JSON.stringify([{ slug: params.slug }]))
    .limit(1)
    .single();

  const tags = data?.tags as { name: string; slug: string }[] | null;
  const tagName = tags?.find((t) => t.slug === params.slug)?.name ?? params.slug;

  return {
    title: tagName,
    description: `${tagName} — މެރިހާنaa`,
  };
}

export default async function TagPage({ params, searchParams }: PageProps) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));
  const data = await getTagData(params.slug, page);
  if (!data) notFound();

  const { tagName, tagSlug, articles, total, totalPages } = data;
  const [featured, ...rest] = articles;

  return (
    <div className="bg-[#F5F3EF] min-h-screen" dir="rtl">

      {/* Header */}
      <header className="max-w-3xl mx-auto px-6 pt-12 pb-10 text-center">
        <p style={{
          fontFamily: '"MVTypewriter", sans-serif',
          fontSize: "11px",
          color: "rgb(160,158,152)",
          lineHeight: 2,
          marginBottom: "6px",
          letterSpacing: "0.05em",
        }}>
          ޓެގް
        </p>
        <h1 style={{
          fontFamily: '"SanguSuruhee", "MVTypewriter", "Noto Sans Thaana", sans-serif',
          fontSize: "clamp(2.5rem, 6vw, 4rem)",
          color: "rgb(26,26,26)",
          lineHeight: 1.6,
          fontWeight: 400,
        }}>
          {tagName}
        </h1>
        <p style={{
          fontFamily: '"MVTypewriter", sans-serif',
          fontSize: "12px",
          color: "rgb(160,158,152)",
          lineHeight: 2,
          marginTop: "4px",
        }}>
          {total} ލިޔުން
        </p>
      </header>

      {/* Featured article */}
      {featured && (
        <div className="max-w-5xl mx-auto px-6 mb-14">
          <Link href={`/${(featured.category as any)?.slug ?? "article"}/${featured.slug}`} className="group block">
            <div className="overflow-hidden rounded-2xl" style={{ aspectRatio: "21/9" }}>
              {featured.featured_image ? (
                <img
                  src={featured.featured_image}
                  alt={featured.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="w-full h-full bg-[#dedad2]" />
              )}
            </div>
            <div className="mt-5 max-w-2xl">
              {(featured.category as any)?.name && (
                <div className="mb-2">
                  <span className="inline-block text-[10px] px-2.5 py-1 rounded-full border" style={{
                    fontFamily: "'MVTypewriter', sans-serif",
                    color: "rgb(100,100,100)",
                    borderColor: "rgb(210,207,200)",
                    backgroundColor: "rgb(240,239,233)",
                    lineHeight: 2,
                  }}>
                    {(featured.category as any).name}
                  </span>
                </div>
              )}
              <h2 className="group-hover:opacity-70 transition-opacity" style={{
                fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
                fontWeight: 700,
                fontSize: "clamp(1.2rem, 3vw, 1.6rem)",
                color: "rgb(26,26,26)",
                lineHeight: 2,
              }}>
                {featured.title}
              </h2>
              {featured.excerpt && (
                <p style={{
                  fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
                  fontSize: "14px",
                  color: "rgb(100,98,92)",
                  lineHeight: 2,
                  marginTop: "6px",
                }}>
                  {featured.excerpt}
                </p>
              )}
              <div className="flex items-center gap-3 mt-3">
                {(featured.author as any)?.full_name && (
                  <span style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "11px", color: "rgb(160,158,152)", lineHeight: 2 }}>
                    {(featured.author as any).full_name}
                  </span>
                )}
                {featured.reading_time_minutes && (
                  <span style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "11px", color: "rgb(160,158,152)", lineHeight: 2 }}>
                    · {featured.reading_time_minutes} މިނެޓު
                  </span>
                )}
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Divider */}
      {rest.length > 0 && (
        <div className="max-w-5xl mx-auto px-6 mb-10 border-t border-black/10" />
      )}

      {/* Grid */}
      {rest.length > 0 && (
        <div className="max-w-5xl mx-auto px-6 mb-16">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-10">
            {rest.map((article: any) => (
              <Link key={article.id} href={`/${article.category?.slug ?? "article"}/${article.slug}`} className="group block">
                <div className="aspect-[4/3] overflow-hidden rounded-lg bg-[#e8e5de] mb-3">
                  {article.featured_image ? (
                    <img
                      src={article.featured_image}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#dedad2]" />
                  )}
                </div>
                {article.category?.name && (
                  <div className="mb-1.5">
                    <span className="inline-block text-[10px] px-2.5 py-1 rounded-full border" style={{
                      fontFamily: "'MVTypewriter', sans-serif",
                      color: "rgb(100,100,100)",
                      borderColor: "rgb(210,207,200)",
                      backgroundColor: "rgb(240,239,233)",
                      lineHeight: 2,
                    }}>
                      {article.category.name}
                    </span>
                  </div>
                )}
                <h3 className="line-clamp-3 group-hover:opacity-70 transition-opacity" style={{
                  fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
                  fontWeight: 700,
                  fontSize: "14px",
                  color: "rgb(26,26,26)",
                  lineHeight: 2,
                }}>
                  {article.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  {article.author?.full_name && (
                    <span style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "10px", color: "rgb(160,158,152)", lineHeight: 2 }}>
                      {article.author.full_name}
                    </span>
                  )}
                  {article.reading_time_minutes && (
                    <span style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "10px", color: "rgb(160,158,152)", lineHeight: 2 }}>
                      · {article.reading_time_minutes} މިނެޓު
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pb-16">
          {page > 1 && (
            <Link href={`/tag/${tagSlug}?page=${page - 1}`}
              className="px-5 py-2 rounded-full border transition-colors hover:border-black/30"
              style={{
                fontFamily: '"MVTypewriter", sans-serif',
                fontSize: "12px",
                color: "rgb(100,98,92)",
                borderColor: "rgb(210,207,200)",
                backgroundColor: "rgb(240,239,233)",
              }}>
              ← ކުރީގެ
            </Link>
          )}
          <span style={{
            fontFamily: '"MVTypewriter", sans-serif',
            fontSize: "12px",
            color: "rgb(160,158,152)",
            lineHeight: 2,
            padding: "8px 16px",
          }}>
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/tag/${tagSlug}?page=${page + 1}`}
              className="px-5 py-2 rounded-full border transition-colors hover:border-black/30"
              style={{
                fontFamily: '"MVTypewriter", sans-serif',
                fontSize: "12px",
                color: "rgb(100,98,92)",
                borderColor: "rgb(210,207,200)",
                backgroundColor: "rgb(240,239,233)",
              }}>
              ފަހަތަށް →
            </Link>
          )}
        </div>
      )}

      <NewsletterCTA />
    </div>
  );
}
