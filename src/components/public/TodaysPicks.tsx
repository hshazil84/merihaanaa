"use client";
// components/public/TodaysPicks.tsx
import Link from "next/link";
import Image from "next/image";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  category: { name: string; slug: string } | null;
}
interface Props {
  articles: Article[];
}

export default function TodaysPicks({ articles }: Props) {
  if (!articles?.length) return null;
  return (
    <section className="max-w-6xl mx-auto px-6 pt-4 pb-12">
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
        މިއަދުގެ ފާހަގަކޮށްލެވޭ
      </h2>
      <div
        className="md:grid md:grid-cols-4 md:gap-8 flex gap-4 overflow-x-auto pb-2 md:pb-0 md:overflow-visible no-scrollbar"
        style={{ scrollbarWidth: "none" }}
        dir="rtl"
      >
        {articles.slice(0, 4).map((article) => (
          <Link
            key={article.id}
            href={"/" + (article.category?.slug ?? "article") + "/" + article.slug}
            className="group block flex-shrink-0 w-[68vw] md:w-auto"
          >
            <div className="aspect-[4/3] overflow-hidden mb-3 rounded-lg bg-[#e8e5de] relative">
              {article.featured_image && (
                <Image
                  src={article.featured_image}
                  alt={article.title}
                  fill
                  sizes="(max-width: 768px) 68vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
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
                  }}
                >
                  {article.category.name}
                </span>
              </div>
            )}
            <h3
              className="leading-none line-clamp-2"
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
                className="mt-1.5 text-sm line-clamp-2"
                style={{
                  fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
                  fontWeight: 400,
                  color: "rgb(100, 100, 100)",
                  lineHeight: 2,
                }}
              >
                {article.excerpt}
              </p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
