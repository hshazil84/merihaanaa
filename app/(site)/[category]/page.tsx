// app/(article)/[category]/page.tsx

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import NewsletterCTA from "@/components/public/NewsletterCTA";

interface PageProps {
  params: { category: string };
  searchParams: { page?: string };
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

const PAGE_SIZE = 12;

async function getCategoryData(slug: string, page: number) {
  const supabase = await createServerSupabaseClient();

  const { data: category } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (!category) return null;

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: articles, count } = await supabase
    .from("articles")
    .select(
      "id, title, slug, excerpt, featured_image, cover_type, cover_video_thumbnail, reading_time_minutes, published_at, review_score, review_subject, tags, author:authors!author_id(full_name)",
      { count: "exact" }
    )
    .eq("status", "published")
    .eq("category_id", category.id)
    .order("published_at", { ascending: false })
    .range(from, to);

  return {
    category,
    articles: articles ?? [],
    total: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
  };
}

export async function generateMetadata({ params }: PageProps) {
  const supabase = await createServerSupabaseClient();
  const { data: category } = await supabase
    .from("categories")
    .select("name, slug")
    .eq("slug", params.category)
    .single();

  if (!category) return { title: "ކެޓަގަރީ ނުލިބުނު" };
  return {
    title: category.name,
    description: `${category.name} - މެރިހާނާ`,
  };
}

// ─── Star Rating Component ────────────────────────────────────────────────────
function StarRating({ score, max = 5 }: { score: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.floor(score);
        const partial = !filled && i < score;
        return (
          <span key={i} style={{ position: "relative", display: "inline-block", width: "14px", height: "14px" }}>
            {/* Empty star */}
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                stroke="rgb(210,190,150)"
                strokeWidth="1.5"
                fill="rgb(240,234,220)"
              />
            </svg>
            {/* Filled overlay */}
            {(filled || partial) && (
              <span style={{
                position: "absolute", top: 0, left: 0,
                width: partial ? `${(score % 1) * 100}%` : "100%",
                overflow: "hidden", display: "inline-block",
              }}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="rgb(200,160,60)">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </span>
            )}
          </span>
        );
      })}
      <span style={{
        fontFamily: '"MVTypewriter", sans-serif',
        fontSize: "11px",
        color: "rgb(140,130,100)",
        marginRight: "4px",
        lineHeight: 1,
      }}>
        {score}/5
      </span>
    </div>
  );
}

// ─── Default Category Page ────────────────────────────────────────────────────
function DefaultCategoryPage({
  category,
  articles,
  total,
  totalPages,
  page,
}: {
  category: any;
  articles: any[];
  total: number;
  totalPages: number;
  page: number;
}) {
  const [featured, ...rest] = articles;

  return (
    <div className="bg-[#F5F3EF] min-h-screen" dir="rtl">

      {/* Header */}
      <header className="max-w-3xl mx-auto px-6 pt-12 pb-10 text-center">
        <h1 style={{
          fontFamily: '"SanguSuruhee", "MVTypewriter", "Noto Sans Thaana", sans-serif',
          fontSize: "clamp(2.5rem, 6vw, 4rem)",
          color: "rgb(26,26,26)",
          lineHeight: 1.6,
          fontWeight: 400,
        }}>
          {category.name}
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
          <Link href={`/${category.slug}/${featured.slug}`} className="group block">
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
              <h2 style={{
                fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
                fontWeight: 700,
                fontSize: "clamp(1.2rem, 3vw, 1.6rem)",
                color: "rgb(26,26,26)",
                lineHeight: 2,
              }} className="group-hover:opacity-70 transition-opacity">
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
                {featured.author?.full_name && (
                  <span style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "11px", color: "rgb(160,158,152)", lineHeight: 2 }}>
                    {featured.author.full_name}
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
              <Link key={article.id} href={`/${category.slug}/${article.slug}`} className="group block">
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
            <Link href={`/${category.slug}?page=${page - 1}`}
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
            <Link href={`/${category.slug}?page=${page + 1}`}
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

// ─── Reviews Category Page ────────────────────────────────────────────────────
function ReviewsCategoryPage({
  category,
  articles,
  total,
  totalPages,
  page,
}: {
  category: any;
  articles: any[];
  total: number;
  totalPages: number;
  page: number;
}) {
  return (
    <div className="bg-[#F5F3EF] min-h-screen" dir="rtl">

      {/* Header */}
      <header className="max-w-4xl mx-auto px-6 pt-12 pb-4 text-center">
        <h1 style={{
          fontFamily: '"SanguSuruhee", "MVTypewriter", "Noto Sans Thaana", sans-serif',
          fontSize: "clamp(2.5rem, 6vw, 4rem)",
          color: "rgb(26,26,26)",
          lineHeight: 1.6,
          fontWeight: 400,
        }}>
          {category.name}
        </h1>
        <p style={{
          fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
          fontSize: "13px",
          color: "rgb(140,138,132)",
          lineHeight: 2,
          marginTop: "4px",
        }}>
          ކެފޭ، ހޮޓެލް، ތަކެތި، ތަޖުރިބާ — ތެދުވެރި ރިވިއު
        </p>
        <p style={{
          fontFamily: '"MVTypewriter", sans-serif',
          fontSize: "11px",
          color: "rgb(160,158,152)",
          lineHeight: 2,
        }}>
          {total} ރިވިއު
        </p>
      </header>

      {/* Divider */}
      <div className="max-w-4xl mx-auto px-6 mb-10 border-t border-black/10 mt-6" />

      {/* Review cards — landscape editorial layout */}
      <div className="max-w-4xl mx-auto px-6 mb-16 space-y-6">
        {articles.map((article: any, i: number) => (
          <Link key={article.id} href={`/${category.slug}/${article.slug}`} className="group block">
            <div
              className="flex gap-5 p-5 rounded-2xl transition-all duration-300 hover:shadow-md"
              style={{ backgroundColor: "rgb(244,242,237)", border: "1px solid rgb(224,221,214)" }}
            >
              {/* Image */}
              <div className="flex-shrink-0 overflow-hidden rounded-xl"
                style={{ width: "180px", height: "130px" }}>
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

              {/* Content */}
              <div className="flex flex-col justify-between flex-1 py-1">
                <div>
                  {/* Subject + score row */}
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      {article.review_subject && (
                        <p style={{
                          fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
                          fontSize: "11px",
                          color: "rgb(140,138,132)",
                          lineHeight: 2,
                          marginBottom: "2px",
                        }}>
                          {article.review_subject}
                        </p>
                      )}
                      <h2 className="group-hover:opacity-70 transition-opacity line-clamp-2" style={{
                        fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
                        fontWeight: 700,
                        fontSize: "16px",
                        color: "rgb(26,26,26)",
                        lineHeight: 1.8,
                      }}>
                        {article.title}
                      </h2>
                    </div>
                    {/* Score badge */}
                    {article.review_score != null && (
                      <div className="flex-shrink-0 flex flex-col items-center justify-center rounded-xl"
                        style={{
                          width: "52px", height: "52px",
                          backgroundColor: "rgb(26,26,26)",
                          color: "rgb(249,248,245)",
                        }}>
                        <span style={{
                          fontFamily: '"MVTypewriter", sans-serif',
                          fontSize: "18px",
                          fontWeight: 700,
                          lineHeight: 1,
                        }}>
                          {article.review_score}
                        </span>
                        <span style={{
                          fontFamily: '"MVTypewriter", sans-serif',
                          fontSize: "9px",
                          color: "rgb(160,158,152)",
                          lineHeight: 1.4,
                        }}>
                          /5
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Stars */}
                  {article.review_score != null && (
                    <div className="mb-2">
                      <StarRating score={article.review_score} />
                    </div>
                  )}

                  {/* Excerpt */}
                  {article.excerpt && (
                    <p className="line-clamp-2" style={{
                      fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
                      fontSize: "13px",
                      color: "rgb(100,98,92)",
                      lineHeight: 2,
                    }}>
                      {article.excerpt}
                    </p>
                  )}
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 mt-3">
                  {article.author?.full_name && (
                    <span style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "10px", color: "rgb(160,158,152)", lineHeight: 2 }}>
                      {article.author.full_name}
                    </span>
                  )}
                  {article.published_at && (
                    <span style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "10px", color: "rgb(160,158,152)", lineHeight: 2 }}>
                      · {formatDhivehiDate(article.published_at)}
                    </span>
                  )}
                  {article.reading_time_minutes && (
                    <span style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "10px", color: "rgb(160,158,152)", lineHeight: 2 }}>
                      · {article.reading_time_minutes} މިނެޓު
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pb-16">
          {page > 1 && (
            <Link href={`/${category.slug}?page=${page - 1}`}
              className="px-5 py-2 rounded-full border transition-colors hover:border-black/30"
              style={{
                fontFamily: '"MVTypewriter", sans-serif', fontSize: "12px",
                color: "rgb(100,98,92)", borderColor: "rgb(210,207,200)",
                backgroundColor: "rgb(240,239,233)",
              }}>
              ← ކުރީގެ
            </Link>
          )}
          <span style={{
            fontFamily: '"MVTypewriter", sans-serif', fontSize: "12px",
            color: "rgb(160,158,152)", lineHeight: 2, padding: "8px 16px",
          }}>
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/${category.slug}?page=${page + 1}`}
              className="px-5 py-2 rounded-full border transition-colors hover:border-black/30"
              style={{
                fontFamily: '"MVTypewriter", sans-serif', fontSize: "12px",
                color: "rgb(100,98,92)", borderColor: "rgb(210,207,200)",
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

// ─── Stories (ވާހަކަ) Category Page ──────────────────────────────────────────
function StoriesCategoryPage({
  category,
  articles,
  total,
  totalPages,
  page,
}: {
  category: any;
  articles: any[];
  total: number;
  totalPages: number;
  page: number;
}) {
  return (
    <div dir="rtl" style={{ backgroundColor: "#F0EAD6", minHeight: "100vh" }}>

      {/* Parchment texture overlay */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
        opacity: 0.6,
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* Header */}
        <header className="max-w-3xl mx-auto px-6 pt-12 pb-8 text-center">
          {/* Decorative top rule */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: "12px", marginBottom: "24px",
          }}>
            <div style={{ height: "1px", width: "60px", backgroundColor: "rgb(180,160,110)" }} />
            <span style={{ fontSize: "14px", color: "rgb(180,160,110)" }}>✦</span>
            <div style={{ height: "1px", width: "60px", backgroundColor: "rgb(180,160,110)" }} />
          </div>

          <h1 style={{
            fontFamily: '"SanguSuruhee", "MVTypewriter", "Noto Sans Thaana", sans-serif',
            fontSize: "clamp(2.8rem, 7vw, 5rem)",
            color: "rgb(60,45,20)",
            lineHeight: 1.5,
            fontWeight: 400,
          }}>
            {category.name}
          </h1>
          <p style={{
            fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
            fontSize: "13px",
            color: "rgb(130,110,70)",
            lineHeight: 2,
            marginTop: "6px",
          }}>
            ހަފްތާއަކު އެއް ހިސާބު — ކިޔާލާ، ގެއްލިދޭ
          </p>
          <p style={{
            fontFamily: '"MVTypewriter", sans-serif',
            fontSize: "11px",
            color: "rgb(160,140,90)",
            lineHeight: 2,
          }}>
            {total} ވާހަކަ
          </p>

          {/* Decorative bottom rule */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: "12px", marginTop: "24px",
          }}>
            <div style={{ height: "1px", width: "40px", backgroundColor: "rgb(200,180,130)" }} />
            <span style={{ fontSize: "10px", color: "rgb(200,180,130)" }}>◆ ◆ ◆</span>
            <div style={{ height: "1px", width: "40px", backgroundColor: "rgb(200,180,130)" }} />
          </div>
        </header>

        {/* Book-shelf grid */}
        <div className="max-w-4xl mx-auto px-6 mb-16">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {articles.map((article: any, i: number) => (
              <Link key={article.id} href={`/${category.slug}/${article.slug}`} className="group block">
                {/* Book cover card */}
                <div
                  className="relative overflow-hidden transition-all duration-500"
                  style={{
                    aspectRatio: "2/3",
                    borderRadius: "4px 12px 12px 4px",
                    boxShadow: "4px 6px 20px rgba(60,40,10,0.18), inset -3px 0 8px rgba(0,0,0,0.08)",
                    transform: "perspective(600px) rotateY(-2deg)",
                  }}
                >
                  {/* Cover image or parchment fallback */}
                  {article.featured_image ? (
                    <img
                      src={article.featured_image}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div style={{
                      width: "100%", height: "100%",
                      background: `linear-gradient(160deg, rgb(220,205,165), rgb(195,175,120))`,
                      display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center",
                      padding: "20px",
                    }}>
                      <span style={{ fontSize: "28px", marginBottom: "12px", opacity: 0.4 }}>📖</span>
                      <p style={{
                        fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
                        fontWeight: 700,
                        fontSize: "13px",
                        color: "rgb(60,45,20)",
                        lineHeight: 2,
                        textAlign: "center",
                        opacity: 0.8,
                      }}>
                        {article.title}
                      </p>
                    </div>
                  )}

                  {/* Book spine shadow (left edge) */}
                  <div style={{
                    position: "absolute", top: 0, right: 0, bottom: 0, width: "8px",
                    background: "linear-gradient(to left, rgba(0,0,0,0.2), transparent)",
                    pointerEvents: "none",
                  }} />

                  {/* Hover overlay */}
                  <div className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      opacity: 0,
                      background: "linear-gradient(to top, rgba(40,28,8,0.7) 0%, transparent 50%)",
                    }}>
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p style={{
                        fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
                        fontSize: "11px",
                        color: "rgb(240,230,200)",
                        lineHeight: 1.8,
                      }}>
                        ކިޔާލާ →
                      </p>
                    </div>
                  </div>

                  {/* Episode badge */}
                  {article.published_at && (
                    <div style={{
                      position: "absolute", top: "10px", left: "10px",
                      backgroundColor: "rgba(240,234,210,0.92)",
                      borderRadius: "4px",
                      padding: "2px 8px",
                    }}>
                      <span style={{
                        fontFamily: '"MVTypewriter", sans-serif',
                        fontSize: "9px",
                        color: "rgb(100,80,30)",
                        lineHeight: 2,
                      }}>
                        {formatDhivehiDate(article.published_at)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Below book: title + meta */}
                <div className="mt-3 px-1">
                  <h3 className="line-clamp-2 group-hover:opacity-60 transition-opacity" style={{
                    fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
                    fontWeight: 700,
                    fontSize: "13px",
                    color: "rgb(50,35,10)",
                    lineHeight: 2,
                  }}>
                    {article.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    {article.author?.full_name && (
                      <span style={{
                        fontFamily: '"MVTypewriter", sans-serif',
                        fontSize: "10px",
                        color: "rgb(140,115,65)",
                        lineHeight: 2,
                      }}>
                        {article.author.full_name}
                      </span>
                    )}
                    {article.reading_time_minutes && (
                      <span style={{
                        fontFamily: '"MVTypewriter", sans-serif',
                        fontSize: "10px",
                        color: "rgb(160,135,85)",
                        lineHeight: 2,
                      }}>
                        · {article.reading_time_minutes} މިނެޓު
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 pb-16">
            {page > 1 && (
              <Link href={`/${category.slug}?page=${page - 1}`}
                className="px-5 py-2 rounded-full border transition-colors"
                style={{
                  fontFamily: '"MVTypewriter", sans-serif', fontSize: "12px",
                  color: "rgb(100,80,30)", borderColor: "rgb(200,180,130)",
                  backgroundColor: "rgb(230,218,180)",
                }}>
                ← ކުރީގެ
              </Link>
            )}
            <span style={{
              fontFamily: '"MVTypewriter", sans-serif', fontSize: "12px",
              color: "rgb(140,115,65)", lineHeight: 2, padding: "8px 16px",
            }}>
              {page} / {totalPages}
            </span>
            {page < totalPages && (
              <Link href={`/${category.slug}?page=${page + 1}`}
                className="px-5 py-2 rounded-full border transition-colors"
                style={{
                  fontFamily: '"MVTypewriter", sans-serif', fontSize: "12px",
                  color: "rgb(100,80,30)", borderColor: "rgb(200,180,130)",
                  backgroundColor: "rgb(230,218,180)",
                }}>
                ފަހަތަށް →
              </Link>
            )}
          </div>
        )}

        {/* Newsletter — parchment tinted */}
        <div style={{ backgroundColor: "#F0EAD6" }}>
          <NewsletterCTA />
        </div>
      </div>
    </div>
  );
}

// ─── Page entry point ─────────────────────────────────────────────────────────
export default async function CategoryPage({ params, searchParams }: PageProps) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));
  const data = await getCategoryData(params.category, page);
  if (!data) notFound();

  const { category, articles, total, totalPages } = data;

  if (category.slug === "vaahaka") {
    return <StoriesCategoryPage category={category} articles={articles} total={total} totalPages={totalPages} page={page} />;
  }

  if (category.slug === "raha") {
    return <ReviewsCategoryPage category={category} articles={articles} total={total} totalPages={totalPages} page={page} />;
  }

  return <DefaultCategoryPage category={category} articles={articles} total={total} totalPages={totalPages} page={page} />;
}
