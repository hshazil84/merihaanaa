import Link from "next/link";
import NewsletterCTA from "@/components/public/NewsletterCTA";
import { StarRating } from "../[category]/components/StarRating";
import { Pagination } from "../[category]/components/Pagination";
import { StandardArticleCard } from "./StandardArticleCard";

type ReviewType = "cafe" | "restaurant" | "recipe";

const TABS: { value: ReviewType | null; label: string }[] = [
  { value: null,         label: "ހުރިހާ" },
  { value: "cafe",       label: "ކެފޭ" },
  { value: "restaurant", label: "ރެސްޓޯރެންޓް" },
  { value: "recipe",     label: "ރެސިޕީ" },
];

const TYPE_LABELS: Record<ReviewType, string> = {
  cafe: "ކެފޭ",
  restaurant: "ރެސްޓޯރެންޓް",
  recipe: "ރެސިޕީ",
};

function NeutralBadge({ label }: { label: string }) {
  return (
    <span
      className="inline-block text-[10px] px-2.5 py-1 rounded-full border"
      style={{
        fontFamily: "'MVTypewriter', 'MV Boli', sans-serif",
        color: "rgb(100, 100, 100)",
        borderColor: "rgb(210, 207, 200)",
        backgroundColor: "rgb(240, 239, 233)",
      }}
    >
      {label}
    </span>
  );
}

function ScoreOverlay({ score, size = 40 }: { score: number; size?: number }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg"
      style={{ width: size, height: size, backgroundColor: "rgb(26,26,26)", color: "rgb(249,248,245)" }}
    >
      <span style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: size > 44 ? "16px" : "13px", fontWeight: 700, lineHeight: 1 }}>
        {score}
      </span>
      <span style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "8px", color: "rgb(200,198,192)", lineHeight: 1.3 }}>
        /5
      </span>
    </div>
  );
}

function ReviewMeta({ article }: { article: any }) {
  if (article.review_type === "recipe") {
    return article.reading_time_minutes ? article.reading_time_minutes + " މިނެޓު" : null;
  }
  return article.review_area || null;
}

function FeaturedCard({ article, categorySlug }: { article: any; categorySlug: string }) {
  return (
    <Link href={`/${categorySlug}/${article.slug}`} className="group block mb-6">
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgb(224,221,214)" }}>
        <div className="overflow-hidden relative" style={{ height: "260px", backgroundColor: "rgb(232,229,222)" }}>
          {article.featured_image ? (
            <img src={article.featured_image} alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              style={{ objectPosition: "50% 20%" }} />
          ) : (
            <div className="w-full h-full" />
          )}
          {article.review_score != null && (
            <div style={{ position: "absolute", top: 12, insetInlineEnd: 12 }}>
              <ScoreOverlay score={article.review_score} size={48} />
            </div>
          )}
        </div>
        <div className="p-5" style={{ backgroundColor: "white" }}>
          {article.review_type && (
            <div className="mb-2"><NeutralBadge label={TYPE_LABELS[article.review_type as ReviewType] ?? article.review_type} /></div>
          )}
          {ReviewMeta({ article }) && (
            <p style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontSize: "11px", fontWeight: 700, color: "rgb(140,138,132)", margin: "0 0 4px" }}>
              {ReviewMeta({ article })}
            </p>
          )}
          <h2 className="group-hover:opacity-70 transition-opacity line-clamp-2" style={{
            fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
            fontWeight: 700, fontSize: "20px", color: "rgb(26,26,26)", lineHeight: 1.7,
          }}>
            {article.review_subject || article.title}
          </h2>
          {article.excerpt && (
            <p className="line-clamp-2 mt-3" style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontSize: "13px", color: "rgb(100,98,92)", lineHeight: 2 }}>
              {article.excerpt}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

export function ReviewsCategoryPage({
  category, featured, articles, total, totalPages, page, activeType,
}: {
  category: any;
  featured?: any | null;
  articles: any[];
  total: number;
  totalPages: number;
  page: number;
  activeType: ReviewType | null;
}) {
  return (
    <div className="bg-[#F5F3EF] min-h-screen" dir="rtl">
      <header className="max-w-5xl mx-auto px-6 pt-8 pb-4 text-center">
        <h1 style={{
          fontFamily: '"SanguSuruhee", "MVTypewriter", "Noto Sans Thaana", sans-serif',
          fontSize: "clamp(2.5rem, 6vw, 4rem)",
          color: "rgb(26,26,26)", lineHeight: 1.6, fontWeight: 400,
        }}>
          {category.name}
        </h1>
        <p style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontSize: "13px", color: "rgb(140,138,132)", lineHeight: 2, marginTop: "4px" }}>
          ކެފޭ، ރެސްޓޯރެންޓް، ރެސިޕީ — ތެދުވެރި ރަހަ ތަޖުރިބާ
        </p>
        <p style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "11px", color: "rgb(160,158,152)", lineHeight: 2 }}>
          {total} ރިވިއު
        </p>
      </header>

      <div className="max-w-5xl mx-auto px-6 mb-6">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {TABS.map((tab) => {
            const isActive = activeType === tab.value;
            const href = tab.value ? `/${category.slug}?type=${tab.value}` : `/${category.slug}`;
            return (
              <a
                key={tab.label}
                href={href}
                style={{
                  fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
                  fontSize: "13px",
                  padding: "6px 18px",
                  borderRadius: "9999px",
                  border: "1px solid " + (isActive ? "rgb(26,26,26)" : "rgb(224,221,214)"),
                  backgroundColor: isActive ? "rgb(26,26,26)" : "transparent",
                  color: isActive ? "rgb(249,248,245)" : "rgb(100,98,92)",
                }}
              >
                {tab.label}
              </a>
            );
          })}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-16">
        {featured && <FeaturedCard article={featured} categorySlug={category.slug} />}

        {articles.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {articles.map((article: any) => (
              <StandardArticleCard
                key={article.id}
                href={`/${category.slug}/${article.slug}`}
                title={article.review_subject || article.title}
                excerpt={article.excerpt}
                featuredImage={article.featured_image}
                badgeLabel={article.review_type ? (TYPE_LABELS[article.review_type as ReviewType] ?? article.review_type) : null}
                eyebrow={ReviewMeta({ article })}
                imageOverlayTopEnd={article.review_score != null ? <ScoreOverlay score={article.review_score} /> : undefined}
                imageSizes="(max-width: 480px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            ))}
          </div>
        ) : !featured ? (
          <p className="text-center py-16" style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontSize: "13px", color: "rgb(160,158,152)" }}>
            ރިވިއު ނެތް
          </p>
        ) : null}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        categorySlug={category.slug}
        extraParams={activeType ? { type: activeType } : undefined}
      />
      <NewsletterCTA />
    </div>
  );
}
