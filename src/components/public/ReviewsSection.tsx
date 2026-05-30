"use client";
// components/public/ReviewsSection.tsx

import Link from "next/link";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  reading_time_minutes: number | null;
  category: { name: string; slug: string } | null;
}

export default function ReviewsSection({ articles }: { articles: Article[] }) {
  if (!articles?.length) return null;

  return (
    <section className="px-6 py-12" style={{ backgroundColor: "#f7f1e2" }} dir="rtl">
      <div className="max-w-6xl mx-auto">

        <h2
          className="text-center mb-10"
          style={{
            fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
            fontWeight: 400,
            fontSize: "26px",
            color: "rgb(26, 26, 26)",
            lineHeight: 2,
          }}
        >
          ރިވިއު
        </h2>

        <div
          className="md:grid md:grid-cols-3 flex gap-5 overflow-x-auto pb-2 md:pb-0 md:overflow-visible no-scrollbar"
          style={{ scrollbarWidth: "none" }}
        >
          {articles.slice(0, 3).map((article, i) => (
            <div key={article.id} className="flex flex-row md:contents">

              {i > 0 && (
                <div
                  className="hidden md:block w-px self-stretch"
                  style={{ background: "rgb(210, 207, 200)" }}
                />
              )}

              <Link
                href={`/${article.category?.slug ?? "article"}/${article.slug}`}
                className="group flex flex-col items-center text-center flex-shrink-0 w-[75vw] md:w-auto md:px-8"
              >
                <div className="w-full aspect-[3/4] overflow-hidden mb-4 rounded-lg bg-[#e8e5de]">
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

                {article.category && (
                  <div className="mb-2">
                    <span
                      className="inline-block text-[10px] px-2.5 py-1 rounded-full border"
                      style={{
                        fontFamily: "'MVTypewriter', 'MV Boli', sans-serif",
                        color: "rgb(100, 100, 100)",
                        borderColor: "rgb(210, 207, 200)",
                        backgroundColor: "rgb(240, 239, 233)",
                        lineHeight: 2,
                      }}
                    >
                      {article.category.name}
                    </span>
                  </div>
                )}

                <h3
                  className="line-clamp-2 group-hover:opacity-70 transition-opacity"
                  style={{
                    fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
                    fontWeight: 700,
                    fontSize: "16px",
                    color: "rgb(26, 26, 26)",
                    lineHeight: 2,
                  }}
                >
                  {article.title}
                </h3>

                {article.excerpt && (
                  <p
                    className="mt-1.5 line-clamp-3"
                    style={{
                      fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
                      fontWeight: 400,
                      fontSize: "13px",
                      color: "rgb(110, 108, 102)",
                      lineHeight: 2,
                    }}
                  >
                    {article.excerpt}
                  </p>
                )}

                {article.reading_time_minutes && (
                  <p
                    className="mt-2"
                    style={{
                      fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
                      fontWeight: 400,
                      fontSize: "10px",
                      color: "rgb(160, 158, 152)",
                      lineHeight: 2,
                    }}
                  >
                    {article.reading_time_minutes} މިނެޓު
                  </p>
                )}
              </Link>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
