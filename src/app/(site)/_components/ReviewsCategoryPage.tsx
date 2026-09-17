import { Suspense } from "react";
import Link from "next/link";
import NewsletterCTA from "@/components/public/NewsletterCTA";
import { Pagination } from "../[category]/components/Pagination";
import { StandardArticleCard } from "./StandardArticleCard";
import { AdSlot } from "./AdSlot";

type ReviewType = "cafe" | "restaurant" | "recipe";

const TERRACOTTA = "rgb(193,99,59)";

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

const CSS = [
  ".raha-top{display:grid;grid-template-columns:1fr 300px;gap:1.5rem;align-items:stretch;}",
  ".raha-hero{display:grid;grid-template-columns:1.1fr 1fr;gap:1.75rem;align-items:stretch;}",
  "@media(max-width:1024px){.raha-top{grid-template-columns:1fr!important;}}",
  "@media(max-width:768px){.raha-hero{grid-template-columns:1fr!important;gap:1.25rem!important;}}",
].join("");

function PinIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function TerracottaOutlineBadge({ label }: { label: string }) {
  return (
    <span style={{
      fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontSize: "10px", fontWeight: 700, color: TERRACOTTA,
      border: "1.5px solid " + TERRACOTTA, padding: "4px 12px", borderRadius: "9999px",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      letterSpacing: "0.03em", lineHeight: 1,
      transform: "translateY(-2px)",
    }}>
      {label}
    </span>
  );
}

function ScoreOverlay({ score, size = 40 }: { score: number; size?: number }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg"
      style={{ width: size, height: size, backgroundColor: TERRACOTTA, color: "white" }}
    >
      <span style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: size > 44 ? "16px" : "13px", fontWeight: 700, lineHeight: 1 }}>
        {score}
      </span>
      <span style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "8px", color: "rgba(255,255,255,0.75)", lineHeight: 1.3 }}>
        /5
      </span>
    </div>
  );
}

function FeaturedCard({ article, categorySlug }: { article: any; categorySlug: string }) {
  return (
    <div className="raha-hero" style={{ marginBottom: "1.5rem" }}>
      <Link href={`/${categorySlug}/${article.slug}`} style={{ textDecoration: "none", display: "block" }}>
        <div className="overflow-hidden relative rounded-2xl" style={{ aspectRatio: "3/2", backgroundColor: "rgb(232,229,222)", height: "100%" }}>
          {article.featured_image ? (
            <img src={article.featured_image} alt={article.title}
              className="w-full h-full object-cover"
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
      </Link>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
        {article.review_type && (
          <div className="mb-2"><TerracottaOutlineBadge label={TYPE_LABELS[article.review_type as ReviewType] ?? article.review_type} /></div>
        )}
        {article.review_area && (
          <p className="flex items-center gap-1" style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontSize: "11px", fontWeight: 700, color: TERRACOTTA, margin: "0 0 6px" }}>
            <PinIcon />
            {article.review_area}
          </p>
        )}
        <Link href={`/${categorySlug}/${article.slug}`} style={{ textDecoration: "none" }}>
          <h2 className="line-clamp-2" style={{
            fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
            fontWeight: 700, fontSize: "clamp(1.2rem,2.6vw,1.7rem)", color: "rgb(26,26,26)", lineHeight: 1.75, margin: 0,
          }}>
            {article.review_subject || article.title}
          </h2>
        </Link>
        {article.excerpt && (
          <p className="line-clamp-2" style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontSize: "14px", color: "rgb(100,98,92)", lineHeight: 2, margin: "14px 0 0" }}>
            {article.excerpt}
          </p>
        )}
      </div>
    </div>
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
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="max-w-[84rem] mx-auto px-6 pt-8 pb-4 text-center">
        <div className="flex items-center justify-center gap-4">
          <span style={{ color: "rgba(0,0,0,0.18)", fontSize: "11px" }}>{"✦"}</span>
          <h1 style={{
            fontFamily: '"SanguSuruhee", "MVTypewriter", "Noto Sans Thaana", sans-serif',
            fontSize: "clamp(2.5rem, 6vw, 4rem)",
            color: TERRACOTTA, lineHeight: 1.6, fontWeight: 400, margin: 0,
          }}>
            {category.name}
          </h1>
          <span style={{ color: "rgba(0,0,0,0.18)", fontSize: "11px" }}>{"✦"}</span>
        </div>
        <p style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontSize: "13px", color: "rgb(140,138,132)", lineHeight: 2, marginTop: "4px" }}>
          ކެފޭ، ރެސްޓޯރެންޓް، ރެސިޕީ — ތެދުވެރި ރަހަ ތަޖުރިބާ
        </p>
        <p style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "11px", color: "rgb(160,158,152)", lineHeight: 2 }}>
          {total} ރިވިއު
        </p>
      </header>

      <div className="max-w-[84rem] mx-auto px-6 mb-6">
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
                  border: "1px solid " + (isActive ? TERRACOTTA : "rgb(224,221,214)"),
                  backgroundColor: isActive ? TERRACOTTA : "transparent",
                  color: isActive ? "white" : "rgb(100,98,92)",
                }}
              >
                {tab.label}
              </a>
            );
          })}
        </div>
      </div>

      <div className="max-w-[84rem] mx-auto px-6 pb-16">
        <div className="raha-top" style={{ marginBottom: "2rem" }}>
          <div>
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
                    eyebrow={article.review_area || null}
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

          <div className="raha-ad-rail">
            <Suspense fallback={null}>
              <AdSlot id="raha-hero-rail" breakpoint="desktop" />
            </Suspense>
          </div>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <Suspense fallback={null}>
            <AdSlot id="raha-hero-rail" breakpoint="mobile" />
          </Suspense>
        </div>
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
