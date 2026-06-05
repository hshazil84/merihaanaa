import NewsletterCTA from "@/components/public/NewsletterCTA";
import { BookCover } from "./BookCover";
import { Pagination } from "./Pagination";

export function StoriesCategoryPage({
  category, articles, total, totalPages, page,
}: {
  category: any; articles: any[]; total: number; totalPages: number; page: number;
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
        <header className="max-w-3xl mx-auto px-6 pt-12 pb-8 text-center">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "24px" }}>
            <div style={{ height: "1px", width: "60px", backgroundColor: "rgb(180,160,110)" }} />
            <span style={{ fontSize: "14px", color: "rgb(180,160,110)" }}>✦</span>
            <div style={{ height: "1px", width: "60px", backgroundColor: "rgb(180,160,110)" }} />
          </div>
          <h1 style={{
            fontFamily: '"SanguSuruhee", "MVTypewriter", "Noto Sans Thaana", sans-serif',
            fontSize: "clamp(2.8rem, 7vw, 5rem)",
            color: "rgb(60,45,20)", lineHeight: 1.5, fontWeight: 400,
          }}>
            {category.name}
          </h1>
          <p style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontSize: "13px", color: "rgb(130,110,70)", lineHeight: 2, marginTop: "6px" }}>
            ހަފްތާއަކު އެއް ހިސާބު — ކިޔާލާ، ގެއްލިދޭ
          </p>
          <p style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "11px", color: "rgb(160,140,90)", lineHeight: 2 }}>
            {total} ވާހަކަ
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginTop: "24px" }}>
            <div style={{ height: "1px", width: "40px", backgroundColor: "rgb(200,180,130)" }} />
            <span style={{ fontSize: "10px", color: "rgb(200,180,130)" }}>◆ ◆ ◆</span>
            <div style={{ height: "1px", width: "40px", backgroundColor: "rgb(200,180,130)" }} />
          </div>
        </header>

        {/* Book-shelf grid */}
        <div className="max-w-4xl mx-auto px-6 mb-16">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {articles.map((article: any) => (
              <BookCover key={article.id} article={article} categorySlug={category.slug} />
            ))}
          </div>
        </div>

        <Pagination page={page} totalPages={totalPages} categorySlug={category.slug} variant="parchment" />

        <div style={{ backgroundColor: "#F0EAD6" }}>
          <NewsletterCTA />
        </div>
      </div>
    </div>
  );
}
