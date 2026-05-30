"use client";
// components/public/FeatureSplit.tsx

import Link from "next/link";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  category: { name: string; slug: string } | null;
  author: { full_name: string } | null;
}

export default function FeatureSplit({ article }: { article: Article }) {
  if (!article) return null;

  return (
    <div className="w-full bg-[#1a1a1a]" dir="rtl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row-reverse">

        {/* Image — padded within black container */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-12">
          <div className="w-full aspect-square overflow-hidden rounded-sm">
            {article.featured_image && (
              <img
                src={article.featured_image}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </div>

        {/* Text panel — black bg, white text, generous padding */}
        <div className="px-10 py-16 w-full md:w-1/2 flex items-center justify-center md:aspect-square">
          <Link
            href={`/${article.category?.slug ?? "article"}/${article.slug}`}
            className="block text-center max-w-md group"
          >
            {/* Category pill — white outline */}
            {article.category && (
              <div className="inline-flex items-center justify-center border border-white/40 rounded-full px-4 py-1.5 mb-6">
                <span
                  style={{
                    fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
                    fontWeight: 400,
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.8)",
                  }}
                >
                  {article.category.name}
                </span>
              </div>
            )}

            {/* Title */}
            <h2
              className="mb-6 group-hover:opacity-70 transition-opacity"
              style={{
                fontFamily: '"SanguSuruhee", "Noto Sans Thaana", sans-serif',
                fontWeight: 400,
                fontSize: "clamp(1.75rem, 3vw, 2.75rem)",
                color: "rgb(255, 255, 255)",
                lineHeight: 1.3,
              }}
            >
              {article.title}
            </h2>

            {/* Excerpt */}
            {article.excerpt && (
              <p
                className="text-sm line-clamp-4"
                style={{
                  fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
                  fontWeight: 400,
                  color: "rgba(255,255,255,0.6)",
                  lineHeight: 2,
                }}
              >
                {article.excerpt}
              </p>
            )}
          </Link>
        </div>

      </div>
    </div>
  );
}
