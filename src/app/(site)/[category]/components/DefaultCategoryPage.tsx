import Link from "next/link";
import NewsletterCTA from "@/components/public/NewsletterCTA";
import { Pagination } from "./Pagination";

export function DefaultCategoryPage({
  category, articles, total, totalPages, page,
}: {
  category: any; articles: any[]; total: number; totalPages: number; page: number;
}) {
  const [featured, ...rest] = articles;

  return (
    <div className="bg-[#F5F3EF] min-h-screen" dir="rtl">
      <header className="max-w-3xl mx-auto px-6 pt-12 pb-10 text-center">
        <h1 style={{
          fontFamily: '"SanguSuruhee", "MVTypewriter", "Noto Sans Thaana", sans-serif',
          fontSize: "clamp(2.5rem, 6vw, 4rem)",
          color: "rgb(26,26,26)", lineHeight: 1.6, fontWeight: 400,
        }}>
          {category.name}
        </h1>
        <p style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "12px", color: "rgb(160,158,152)", lineHeight: 2, marginTop: "4px" }}>
          {total} ލިޔުން
        </p>
      </header>

      {featured && (
        <div className="max-w-5xl mx-auto px-6 mb-14">
          <Link href={`/${category.slug}/${featured.slug}`} className="group block">
            <div className="overflow-hidden rounded-2xl" style={{ aspectRatio: "21/9" }}>
              {featured.featured_image ? (
                <img src={featured.featured_image} alt={featured.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              ) : (
                <div className="w-full h-full bg-[#dedad2]" />
              )}
            </div>
            <div className="mt-5 max-w-2xl">
              <h2 className="group-hover:opacity-70 transition-opacity" style={{
                fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
                fontWeight: 700, fontSize: "clamp(1.2rem, 3vw, 1.6rem)",
                color: "rgb(26,26,26)", lineHeight: 2,
              }}>
                {featured.title}
              </h2>
              {featured.excerpt && (
                <p style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontSize: "14px", color: "rgb(100,98,92)", lineHeight: 2, marginTop: "6px" }}>
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

      {rest.length > 0 && <div className="max-w-5xl mx-auto px-6 mb-10 border-t border-black/10" />}

      {rest.length > 0 && (
        <div className="max-w-5xl mx-auto px-6 mb-16">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-10">
            {rest.map((article: any) => (
              <Link key={article.id} href={`/${category.slug}/${article.slug}`} className="group block">
                <div className="aspect-[4/3] overflow-hidden rounded-lg bg-[#e8e5de] mb-3">
                  {article.featured_image ? (
                    <img src={article.featured_image} alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-[#dedad2]" />
                  )}
                </div>
                <h3 className="line-clamp-3 group-hover:opacity-70 transition-opacity" style={{
                  fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
                  fontWeight: 700, fontSize: "14px", color: "rgb(26,26,26)", lineHeight: 2,
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

      <Pagination page={page} totalPages={totalPages} categorySlug={category.slug} />
      <NewsletterCTA />
    </div>
  );
}
