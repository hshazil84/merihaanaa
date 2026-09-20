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
const BG_CARD = "#E2ECEA";

type DestType = "resort" | "guesthouse" | "liveaboard";

const TABS: { value: DestType | null; label: string }[] = [
  { value: null,         label: "ހުރިހާ" },
  { value: "resort",     label: "ރިސޯޓް" },
  { value: "guesthouse", label: "ގެސްޓްހައުސް" },
  { value: "liveaboard", label: "ލިވްއަބޯޑް" },
];

const TYPE_LABELS: Record<DestType, string> = { resort: "ރިސޯޓް", guesthouse: "ގެސްޓްހައުސް", liveaboard: "ލިވްއަބޯޑް" };

// Every flexible track is minmax(0,1fr), never a bare 1fr. A bare 1fr is
// minmax(auto,1fr) and refuses to shrink below its content's min-content
// width; when that floor is hit the grid overflows its container, and
// because this page is RTL the overflow spills LEFT, shoving the 300px ad
// rail outside the container. overflow-wrap:anywhere lets the text wrap
// into the now-shrinkable tracks (it is the value that also reduces an
// element's min-content size). .dhathuru-hero-text clips and pads so the
// text can never sit flush against — or slide under — the hero image.
const CSS = [
  ".dhathuru-top{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:1.5rem;align-items:stretch;}",
  ".dhathuru-top>*{min-width:0;}",
  ".dhathuru-ad-rail{min-height:650px;}",
  ".dhathuru-hero{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:1.75rem;align-items:stretch;}",
  ".dhathuru-hero>*{min-width:0;}",
  ".dhathuru-hero-text{min-width:0;overflow:hidden;padding-inline-end:1.5rem;}",
  ".dhathuru-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1.25rem;}",
  ".dhathuru-grid>*{min-width:0;}",
  ".dhathuru-top h2,.dhathuru-top h3,.dhathuru-top p,.dhathuru-top span,.dhathuru-top a{overflow-wrap:anywhere;}",
  "@media(max-width:1024px){.dhathuru-top{grid-template-columns:minmax(0,1fr)!important;}.dhathuru-ad-rail{min-height:0!important;}}",
  "@media(max-width:768px){.dhathuru-hero{grid-template-columns:minmax(0,1fr)!important;gap:1.25rem!important;}.dhathuru-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;}}",
  "@media(max-width:480px){.dhathuru-grid{grid-template-columns:minmax(0,1fr)!important;}}",
].join("");

function TealOutlineBadge({ label }: { label: string }) {
  return (
    <span style={{ fontFamily: FONT, fontSize: "10px", fontWeight: 700, color: TEAL, border: "1.5px solid " + TEAL, padding: "4px 12px", borderRadius: "9999px", display: "inline-block", alignSelf: "flex-start", letterSpacing: "0.03em", lineHeight: 1.6 }}>
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
      style={{ width: size, height: size, flexShrink: 0, backgroundColor: "rgb(26,26,26)", color: "rgb(249,248,245)" }}
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
    <div className="dhathuru-hero">
      <Link href={`/${categorySlug}/${article.slug}`} style={{ textDecoration: "none", display: "block" }}>
        <div style={{ aspectRatio: "3/2", overflow: "hidden", borderRadius: "12px", background: BG_CARD, position: "relative", height: "100%" }}>
          {article.featured_image && (
            <img src={article.featured_image} alt={article.title}
              className="w-full h-full object-cover"
              style={{ objectPosition: "50% 30%" }} />
          )}
          <div style={{ position: "absolute", top: 12, insetInlineEnd: 12 }}>
            <ContentKindBadge isReview={isReview} />
          </div>
        </div>
      </Link>

      <div className="dhathuru-hero-text" style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
        {typeLabel && <div style={{ marginBottom: "12px" }}><TealOutlineBadge label={typeLabel} /></div>}
        {article.review_area && (
          <p style={{ fontFamily: FONT, fontSize: "11px", color: TEAL, margin: "0 0 6px", fontWeight: 700 }}>{article.review_area}</p>
        )}
        <div className="flex items-start justify-between gap-4" style={{ minWidth: 0 }}>
          <Link href={`/${categorySlug}/${article.slug}`} style={{ textDecoration: "none", minWidth: 0 }}>
            <h2 className="line-clamp-2" style={{ fontFamily: FONT, fontWeight: 700, fontSize: "clamp(1.2rem,2.6vw,1.7rem)", lineHeight: 1.75, margin: 0, color: TEXT }}>
              {article.review_subject || article.title}
            </h2>
          </Link>
          {article.review_score != null && <ScoreOverlay score={article.review_score} size={48} />}
        </div>
        {article.excerpt && (
          <p className="line-clamp-2" style={{ fontFamily: FONT, fontSize: "14px", color: "rgb(60,58,52)", lineHeight: 2, margin: "14px 0 0" }}>
            {article.excerpt}
          </p>
        )}
      </div>
    </div>
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

      <header style={{ maxWidth: "84rem", margin: "0 auto", padding: "2rem 1.5rem 1rem", textAlign: "center" }}>
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
                <div style={{ marginBottom: "1.5rem" }}>
                  <FeaturedCard article={featured} categorySlug={category.slug} />
                </div>
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
