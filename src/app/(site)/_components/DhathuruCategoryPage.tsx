import { Suspense } from "react";
import Link from "next/link";
import { AdSlot } from "./AdSlot";
import { StandardArticleCard } from "./StandardArticleCard";

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
  "@media(max-width:1024px){.dhathuru-top{grid-template-columns:1fr!important;}}",
  "@media(max-width:768px){.dhathuru-grid{grid-template-columns:1fr 1fr!important;}}",
  "@media(max-width:480px){.dhathuru-grid{grid-template-columns:1fr!important;}}",
].join("");

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

function ScoreOverlay({ score, size = 40 }: { score: number; size?: number }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg"
      style={{ width: size, height: size, backgroundColor: "rgb(26,26,26)", color: "rgb(249,248,245)" }}
    >
      <span style={{ fontFamily: FONT, fontSize: size > 44 ? "16px" : "13px", fontWeight: 700, lineHeight: 1 }}>
        {score}
      </span>
      <span style={{ fontFamily: FONT, fontSize: "8px", color: "rgb(200,198,192)", lineHeight: 1.3 }}>
        /5
      </span>
    </div>
  );
}

function getTypeLabel(article: any): string | null {
  return article.review_type && article.review_type in TYPE_LABELS
    ? TYPE_LABELS[article.review_type as DestType]
    : null;
}

function FeaturedCard({ article, categorySlug }: { article: any; categorySlug: string }) {
  const isReview = article.review_score != null;
  const typeLabel = getTypeLabel(article);

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
            {article.review_score != null && <ScoreOverlay score={article.review_score} size={48} />}
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
  category, featured, articles, activeType,
}: {
  category: any;
  featured?: any | null;
  articles: any[];
  activeType: DestType | null;
}) {
  return (
    <div className="bg-[#F4F7F6] min-h-screen" dir="rtl">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header style={{ maxWidth: "84rem", margin: "0 auto", padding: "2rem 1.5rem 1.5rem", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
          <span style={{ color: "rgba(0,0,0,0.18)", fontSize: "11px" }}>{"✦"}</span>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(2rem,5vw,3.5rem)", color: TEAL, lineHeight: 1.5, fontWeight: 400, margin: 0 }}>
            {category.name}
          </h1>
          <span style={{ color: "rgba(0,0,0,0.18)", fontSize: "11px" }}>{"✦"}</span>
        </div>
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
                {articles.map((a: any) => (
                  <StandardArticleCard
                    key={a.id}
                    href={`/${category.slug}/${a.slug}`}
                    title={a.review_subject || a.title}
                    excerpt={a.excerpt}
                    featuredImage={a.featured_image}
                    badgeLabel={getTypeLabel(a)}
                    eyebrow={a.review_area || null}
                    imageOverlayTopStart={<ContentKindBadge isReview={a.review_score != null} />}
                    imageOverlayTopEnd={a.review_score != null ? <ScoreOverlay score={a.review_score} /> : undefined}
                    imageSizes="(max-width: 480px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                ))}
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

        <div style={{ marginBottom: "2rem" }}>
          <Suspense fallback={null}>
            <AdSlot id="dhathuru-hero-rail" breakpoint="mobile" />
          </Suspense>
        </div>

        <div style={{ display: "flex", justifyContent: "center", paddingTop: "1rem", borderTop: "0.5px solid " + DIVIDER }}>
          <Link href={"/" + category.slug + "/archive" + (activeType ? "?type=" + activeType : "")}
            style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: TEAL, textDecoration: "none", padding: "8px 20px", border: "0.5px solid " + TEAL, borderRadius: "8px" }}>
            {"އިތުރު ލިޔުންތައް ←"}
          </Link>
        </div>

      </div>
    </div>
  );
}
