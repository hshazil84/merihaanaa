import { Suspense } from "react";
import Link from "next/link";
import { Pagination } from "../[category]/components/Pagination";
import { AdSlot } from "./AdSlot";

const TEAL = "rgb(20,110,110)";
const FONT = '"MVTypewriter","Noto Sans Thaana",sans-serif';
const FONT_DISPLAY = '"SanguSuruhee","MVTypewriter","Noto Sans Thaana",sans-serif';
const TEXT = "rgb(26,26,26)";
const TEXT_MUTED = "rgb(140,138,132)";
const DIVIDER = "rgba(0,0,0,0.07)";

type DestType = "resort" | "guesthouse" | "liveaboard";

const TABS: { value: DestType | null; label: string }[] = [
  { value: null,         label: "ހުރިހާ" },
  { value: "resort",     label: "ރިސޯޓް" },
  { value: "guesthouse", label: "ގެސްޓްހައުސް" },
  { value: "liveaboard", label: "ލިވްއަބޯޑް" },
];

const TYPE_LABELS: Record<DestType, string> = { resort: "ރިސޯޓް", guesthouse: "ގެސްޓްހައުސް", liveaboard: "ލިވްއަބޯޑް" };

const CSS = [
  ".dhathuru-top{display:grid;grid-template-columns:1fr 300px;gap:1.5rem;align-items:stretch;}",
  ".dhathuru-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:1.25rem;}",
  ".lc2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}",
  "@media(max-width:1024px){.dhathuru-top{grid-template-columns:1fr!important;}}",
  "@media(max-width:768px){.dhathuru-grid{grid-template-columns:1fr 1fr!important;}}",
  "@media(max-width:480px){.dhathuru-grid{grid-template-columns:1fr!important;}}",
].join("");

// Neutral pill, matching the homepage / Film grid-card badge — used for the
// type label on grid tiles so the page reads consistently with the rest of
// the site. TEAL is reserved for the hero, same way Film reserves red for
// its hero and uses neutral pills everywhere else.
function NeutralBadge({ label }: { label: string }) {
  return (
    <span
      className="inline-block"
      style={{
        fontFamily: FONT, fontSize: "10px", fontWeight: 700, padding: "3px 10px",
        borderRadius: "9999px", border: "1px solid rgb(210,207,200)",
        backgroundColor: "rgb(240,239,233)", color: "rgb(100,100,100)",
      }}
    >
      {label}
    </span>
  );
}

function TealOutlineBadge({ label }: { label: string }) {
  return (
    <span style={{ fontFamily: FONT, fontSize: "10px", fontWeight: 700, color: TEAL, border: "1.5px solid " + TEAL, padding: "4px 12px", borderRadius: "9999px", display: "inline-block", letterSpacing: "0.03em", lineHeight: 1.6 }}>
      {label}
    </span>
  );
}

function ContentKindBadge({ isReview }: { isReview: boolean }) {
  return (
    <span style={{ fontFamily: FONT, fontSize: "9px", fontWeight: 700, padding: "2px 8px", borderRadius: "9999px", background: isReview ? TEAL : "rgba(0,0,0,0.5)", color: "white" }}>
      {isReview ? "ރިވިއު" : "ގައިޑް"}
    </span>
  );
}

// Right-side slot: score for reviews, read time for guides — fixed size so
// the title row is identical whether a card has this content or not.
function InfoSlot({ article, size = 40 }: { article: any; size?: number }) {
  if (article.review_score != null) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: size, height: size, borderRadius: 10, background: "rgb(26,26,26)", color: "white", flexShrink: 0 }}>
        <span style={{ fontFamily: FONT, fontSize: size > 44 ? "16px" : "13px", fontWeight: 700 }}>{article.review_score}</span>
      </div>
    );
  }
  return (
    <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {article.reading_time_minutes && (
        <span style={{ fontFamily: FONT, fontSize: "10px", color: TEXT_MUTED, textAlign: "center", lineHeight: 1.3 }}>
          {article.reading_time_minutes}
          <br />
          މިނެޓު
        </span>
      )}
    </div>
  );
}

function DestinationCard({ article, categorySlug }: { article: any; categorySlug: string }) {
  const isReview = article.review_score != null;
  const typeLabel = article.review_type && article.review_type in TYPE_LABELS
    ? TYPE_LABELS[article.review_type as DestType]
    : null;

  return (
    <Link href={`/${categorySlug}/${article.slug}`} className="group block" style={{ height: "100%" }}>
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.08)", height: "100%", display: "flex", flexDirection: "column" }}>
        <div className="overflow-hidden relative" style={{ height: "150px", backgroundColor: "#E2ECEA", flexShrink: 0 }}>
          {article.featured_image && (
            <img src={article.featured_image} alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              style={{ objectPosition: "50% 30%" }} />
          )}
          <div style={{ position: "absolute", top: 8, insetInlineEnd: 8 }}>
            <ContentKindBadge isReview={isReview} />
          </div>
        </div>
        <div className="p-3" style={{ backgroundColor: "white", flex: 1, display: "flex", flexDirection: "column" }}>
          {typeLabel && (
            <div className="mb-2"><NeutralBadge label={typeLabel} /></div>
          )}
          <p style={{ fontFamily: FONT, fontSize: "10px", color: TEAL, margin: "0 0 3px", fontWeight: 700, minHeight: "14px", visibility: article.review_area ? "visible" : "hidden" }}>
            {article.review_area || "-"}
          </p>
          <div className="flex items-start justify-between gap-2" style={{ minHeight: "44px" }}>
            <h3 className="line-clamp-2 group-hover:opacity-70 transition-opacity" style={{ fontFamily: FONT, fontWeight: 700, fontSize: "14px", color: TEXT, lineHeight: 1.8, margin: 0 }}>
              {article.review_subject || article.title}
            </h3>
            <InfoSlot article={article} />
          </div>
        </div>
      </div>
    </Link>
  );
}

function FeaturedCard({ article, categorySlug }: { article: any; categorySlug: string }) {
  const isReview = article.review_score != null;
  const typeLabel = article.review_type && article.review_type in TYPE_LABELS
    ? TYPE_LABELS[article.review_type as DestType]
    : null;

  return (
    <Link href={`/${categorySlug}/${article.slug}`} className="group block mb-6">
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
        <div className="overflow-hidden relative" style={{ height: "280px", backgroundColor: "#E2ECEA" }}>
          {article.featured_image && (
            <img src={article.featured_image} alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              style={{ objectPosition: "50% 30%" }} />
          )}
          <div style={{ position: "absolute", top: 12, insetInlineEnd: 12 }}>
            <ContentKindBadge isReview={isReview} />
          </div>
        </div>
        <div className="p-5" style={{ backgroundColor: "white" }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              {typeLabel && <div className="mb-2"><TealOutlineBadge label={typeLabel} /></div>}
              {article.review_area && (
                <p style={{ fontFamily: FONT, fontSize: "11px", color: TEAL, margin: "0 0 4px", fontWeight: 700 }}>{article.review_area}</p>
              )}
              <h2 className="group-hover:opacity-70 transition-opacity line-clamp-2" style={{ fontFamily: FONT, fontWeight: 700, fontSize: "20px", color: TEXT, lineHeight: 1.7, margin: 0 }}>
                {article.review_subject || article.title}
              </h2>
            </div>
            <InfoSlot article={article} size={48} />
          </div>
          {article.excerpt && (
            <p className="line-clamp-2 mt-3" style={{ fontFamily: FONT, fontSize: "13px", color: "rgb(100,98,92)", lineHeight: 2 }}>
              {article.excerpt}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

export function DhathuruCategoryPage({
  category, featured, articles, total, totalPages, page, activeType,
}: {
  category: any;
  featured?: any | null;
  articles: any[];
  total: number;
  totalPages: number;
  page: number;
  activeType: DestType | null;
}) {
  return (
    <div className="bg-[#F4F7F6] min-h-screen" dir="rtl">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header style={{ maxWidth: "84rem", margin: "0 auto", padding: "2rem 1.5rem 1rem", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", marginBottom: "0.75rem" }}>
          <span style={{ color: "rgba(0,0,0,0.18)", fontSize: "11px" }}>{"✦"}</span>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(2rem,5vw,3.5rem)", color: TEAL, lineHeight: 1.5, fontWeight: 400, margin: 0 }}>
            {category.name}
          </h1>
          <span style={{ color: "rgba(0,0,0,0.18)", fontSize: "11px" }}>{"✦"}</span>
        </div>
        <p style={{ fontFamily: FONT, fontSize: "13px", color: TEXT_MUTED, lineHeight: 2, margin: 0 }}>
          ރިސޯޓް، ގެސްޓްހައުސް، ލިވްއަބޯޑް — ދިވެހިރާއްޖޭގެ ދަތުރު ގައިޑް
        </p>
        <p style={{ fontFamily: FONT, fontSize: "11px", color: TEXT_MUTED, lineHeight: 2, margin: 0 }}>{total} ލިޔުން</p>
      </header>

      <div style={{ maxWidth: "84rem", margin: "0 auto", padding: "0 1.5rem 1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
          {TABS.map((tab) => {
            const isActive = activeType === tab.value;
            const href = tab.value ? `/${category.slug}?type=${tab.value}` : `/${category.slug}`;
            return (
              <a key={tab.label} href={href} style={{
                fontFamily: FONT, fontSize: "13px", fontWeight: isActive ? 700 : 400,
                padding: "10px 22px", borderRadius: "9999px",
                border: "1px solid " + (isActive ? TEAL : "rgba(0,0,0,0.12)"),
                backgroundColor: isActive ? TEAL : "white",
                color: isActive ? "white" : "rgb(100,98,92)",
                transition: "all 0.15s ease",
              }}>
                {tab.label}
              </a>
            );
          })}
        </div>
      </div>

      <div style={{ maxWidth: "84rem", margin: "0 auto", padding: "0 1.5rem 4rem" }}>

        <div className="dhathuru-top" style={{ marginBottom: "2rem" }}>
          <div>
            {featured && (
              <>
                <FeaturedCard article={featured} categorySlug={category.slug} />
                <div style={{ borderTop: "0.5px solid " + DIVIDER, marginBottom: "1.5rem" }} />
              </>
            )}
            {articles.length > 0 ? (
              <div className="dhathuru-grid">
                {articles.map((a: any) => <DestinationCard key={a.id} article={a} categorySlug={category.slug} />)}
              </div>
            ) : !featured ? (
              <p className="text-center" style={{ fontFamily: FONT, fontSize: "13px", color: TEXT_MUTED, padding: "3rem 0" }}>ލިޔުމެއް ނެތް</p>
            ) : null}
          </div>

          <div className="dhathuru-ad-rail">
            <Suspense fallback={null}>
              <AdSlot id="dhathuru-hero-rail" breakpoint="desktop" />
            </Suspense>
          </div>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <Suspense fallback={null}>
            <AdSlot id="dhathuru-hero-rail" breakpoint="mobile" />
          </Suspense>
        </div>

      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        categorySlug={category.slug}
        extraParams={activeType ? { type: activeType } : undefined}
      />
    </div>
  );
}
