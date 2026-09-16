import Link from "next/link";
import NewsletterCTA from "@/components/public/NewsletterCTA";
import { StarRating } from "./StarRating";
import { Pagination } from "./Pagination";
import { formatDhivehiDate } from "@/lib/formatDhivehiDate";

type ReviewType = "cafe" | "restaurant" | "recipe";

const TABS: { value: ReviewType | null; label: string }[] = [
  { value: null,         label: "ހުރިހާ" },
  { value: "cafe",       label: "ކެފޭ" },
  { value: "restaurant", label: "ރެސްޓޯރެންޓް" },
  { value: "recipe",     label: "ރެސިޕީ" },
];

const TYPE_META: Record<ReviewType, { label: string; bg: string; text: string }> = {
  cafe:       { label: "ކެފޭ",          bg: "rgb(250,240,220)", text: "rgb(150,110,40)" },
  restaurant: { label: "ރެސްޓޯރެންޓް",   bg: "rgb(250,231,224)", text: "rgb(160,75,45)"  },
  recipe:     { label: "ރެސިޕީ",        bg: "rgb(231,240,220)", text: "rgb(75,105,50)"  },
};

function TypeBadge({ type }: { type: string | null }) {
  if (!type || !(type in TYPE_META)) return null;
  const meta = TYPE_META[type as ReviewType];
  return (
    <span
      className="inline-block"
      style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontSize: "11px", padding: "2px 10px", borderRadius: "9999px", backgroundColor: meta.bg, color: meta.text }}
    >
      {meta.label}
    </span>
  );
}

function ScoreBadge({ score, size = 52 }: { score: number; size?: number }) {
  return (
    <div
      className="flex-shrink-0 flex flex-col items-center justify-center rounded-xl"
      style={{ width: size, height: size, backgroundColor: "rgb(26,26,26)", color: "rgb(249,248,245)" }}
    >
      <span style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: size > 44 ? "18px" : "14px", fontWeight: 700, lineHeight: 1 }}>
        {score}
      </span>
      <span style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "9px", color: "rgb(160,158,152)", lineHeight: 1.4 }}>
        /5
      </span>
    </div>
  );
}

function MetaRow({ article }: { article: any }) {
  // Cafés and restaurants show area; recipes have no location, so they
  // show reading time (a stand-in for prep time until a dedicated field exists).
  if (article.review_type === "recipe") {
    return (
      <p style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "11px", color: "rgb(160,158,152)", lineHeight: 1.8 }}>
        {article.reading_time_minutes ? article.reading_time_minutes + " މިނެޓު" : ""}
      </p>
    );
  }
  if (article.review_area) {
    return (
      <p style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontSize: "11px", color: "rgb(160,158,152)", lineHeight: 1.8 }}>
        {article.review_area}
      </p>
    );
  }
  return null;
}

function ReviewCard({ article, categorySlug }: { article: any; categorySlug: string }) {
  return (
    <Link href={`/${categorySlug}/${article.slug}`} className="group block">
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgb(224,221,214)" }}>
        <div className="overflow-hidden" style={{ height: "140px", backgroundColor: "rgb(230,227,218)" }}>
          {article.featured_image ? (
            <img src={article.featured_image} alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              style={{ objectPosition: "50% 20%" }} />
          ) : (
            <div className="w-full h-full" />
          )}
        </div>
        <div className="p-3" style={{ backgroundColor: "rgb(244,242,237)" }}>
          <div className="flex items-center gap-2 mb-1.5">
            <TypeBadge type={article.review_type} />
          </div>
          <h3 className="line-clamp-2 group-hover:opacity-70 transition-opacity" style={{
            fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
            fontWeight: 700, fontSize: "14px", color: "rgb(26,26,26)", lineHeight: 1.8,
          }}>
            {article.review_subject || article.title}
          </h3>
          <div className="flex items-center justify-between mt-1.5">
            <MetaRow article={article} />
            {article.review_score != null && (
              <div className="flex items-center gap-1">
                <StarRating score={article.review_score} />
                <span style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "11px", color: "rgb(140,138,132)" }}>
                  {article.review_score}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function FeaturedCard({ article, categorySlug }: { article: any; categorySlug: string }) {
  return (
    <Link href={`/${categorySlug}/${article.slug}`} className="group block mb-6">
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgb(224,221,214)" }}>
        <div className="overflow-hidden" style={{ height: "260px", backgroundColor: "rgb(230,227,218)" }}>
          {article.featured_image ? (
            <img src={article.featured_image} alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              style={{ objectPosition: "50% 20%" }} />
          ) : (
            <div className="w-full h-full" />
          )}
        </div>
        <div className="p-5" style={{ backgroundColor: "rgb(244,242,237)" }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-1.5"><TypeBadge type={article.review_type} /></div>
              <h2 className="group-hover:opacity-70 transition-opacity line-clamp-2" style={{
                fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
                fontWeight: 700, fontSize: "20px", color: "rgb(26,26,26)", lineHeight: 1.7,
              }}>
                {article.review_subject || article.title}
              </h2>
              <div className="mt-1"><MetaRow article={article} /></div>
            </div>
            {article.review_score != null && <ScoreBadge score={article.review_score} size={56} />}
          </div>
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
              <ReviewCard key={article.id} article={article} categorySlug={category.slug} />
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
