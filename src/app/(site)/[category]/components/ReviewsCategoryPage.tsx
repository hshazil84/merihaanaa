import Link from "next/link";
import NewsletterCTA from "@/components/public/NewsletterCTA";
import { StarRating } from "./StarRating";
import { Pagination } from "./Pagination";
import { formatDhivehiDate } from "@/lib/formatDhivehiDate";

export function ReviewsCategoryPage({
  category, articles, total, totalPages, page,
}: {
  category: any; articles: any[]; total: number; totalPages: number; page: number;
}) {
  return (
    <div className="bg-[#F5F3EF] min-h-screen" dir="rtl">
      <header className="max-w-4xl mx-auto px-6 pt-12 pb-4 text-center">
        <h1 style={{
          fontFamily: '"SanguSuruhee", "MVTypewriter", "Noto Sans Thaana", sans-serif',
          fontSize: "clamp(2.5rem, 6vw, 4rem)",
          color: "rgb(26,26,26)", lineHeight: 1.6, fontWeight: 400,
        }}>
          {category.name}
        </h1>
        <p style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontSize: "13px", color: "rgb(140,138,132)", lineHeight: 2, marginTop: "4px" }}>
          ކެފޭ، ހޮޓެލް، ތަކެތި، ތަޖުރިބާ — ތެދުވެރި ރިވިއު
        </p>
        <p style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "11px", color: "rgb(160,158,152)", lineHeight: 2 }}>
          {total} ރިވިއު
        </p>
      </header>

      <div className="max-w-4xl mx-auto px-6 mb-10 border-t border-black/10 mt-6" />

      <div className="max-w-4xl mx-auto px-6 mb-16 space-y-6">
        {articles.map((article: any) => (
          <Link key={article.id} href={`/${category.slug}/${article.slug}`} className="group block">
            <div className="flex gap-5 p-5 rounded-2xl transition-all duration-300 hover:shadow-md"
              style={{ backgroundColor: "rgb(244,242,237)", border: "1px solid rgb(224,221,214)" }}>
              <div className="flex-shrink-0 overflow-hidden rounded-xl" style={{ width: "180px", height: "130px" }}>
                {article.featured_image ? (
                  <img src={article.featured_image} alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-[#dedad2]" />
                )}
              </div>
              <div className="flex flex-col justify-between flex-1 py-1">
                <div>
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      {article.review_subject && (
                        <p style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontSize: "11px", color: "rgb(140,138,132)", lineHeight: 2, marginBottom: "2px" }}>
                          {article.review_subject}
                        </p>
                      )}
                      <h2 className="group-hover:opacity-70 transition-opacity line-clamp-2" style={{
                        fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
                        fontWeight: 700, fontSize: "16px", color: "rgb(26,26,26)", lineHeight: 1.8,
                      }}>
                        {article.title}
                      </h2>
                    </div>
                    {article.review_score != null && (
                      <div className="flex-shrink-0 flex flex-col items-center justify-center rounded-xl"
                        style={{ width: "52px", height: "52px", backgroundColor: "rgb(26,26,26)", color: "rgb(249,248,245)" }}>
                        <span style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "18px", fontWeight: 700, lineHeight: 1 }}>
                          {article.review_score}
                        </span>
                        <span style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "9px", color: "rgb(160,158,152)", lineHeight: 1.4 }}>
                          /5
                        </span>
                      </div>
                    )}
                  </div>
                  {article.review_score != null && <div className="mb-2"><StarRating score={article.review_score} /></div>}
                  {article.excerpt && (
                    <p className="line-clamp-2" style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontSize: "13px", color: "rgb(100,98,92)", lineHeight: 2 }}>
                      {article.excerpt}
                    </p>
                  )}
                </div>
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

      <Pagination page={page} totalPages={totalPages} categorySlug={category.slug} />
      <NewsletterCTA />
    </div>
  );
}
