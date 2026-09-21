import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { AdSlot } from "./AdSlot";
import { StandardArticleCard } from "./StandardArticleCard";

const TEAL = "rgb(20,110,110)";
const FONT = '"MVTypewriter","Noto Sans Thaana",sans-serif';
const FONT_DISPLAY = '"SanguSuruhee","MVTypewriter","Noto Sans Thaana",sans-serif';
const BG = "#F4F7F6";
const BG_CARD = "#E2ECEA";
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
  ".dhathuru-top{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:1.5rem;align-items:stretch;}",
  ".dhathuru-top>*{min-width:0;}",
  ".dhathuru-ad-rail{min-height:650px;}",
  ".dhathuru-hero{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:1.75rem;align-items:stretch;margin-bottom:1.5rem;}",
  ".dhathuru-hero>*{min-width:0;}",
  ".dhathuru-hero-text{min-width:0;overflow:hidden;padding-inline-start:1.5rem;}",
  ".dhathuru-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1.25rem;}",
  ".dhathuru-grid>*{min-width:0;}",
  ".dhathuru-top h2,.dhathuru-top h3,.dhathuru-top p,.dhathuru-top span,.dhathuru-top a{overflow-wrap:anywhere;}",
  ".lc4{display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;}",
  "@media(max-width:1024px){.dhathuru-top{grid-template-columns:minmax(0,1fr)!important;}.dhathuru-ad-rail{min-height:0!important;}}",
  "@media(max-width:768px){.dhathuru-hero{grid-template-columns:minmax(0,1fr)!important;gap:1.25rem!important;}.dhathuru-hero-text{padding-inline-start:0!important;}.dhathuru-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;}}",
  "@media(max-width:480px){.dhathuru-grid{grid-template-columns:minmax(0,1fr)!important;}}",
].join("");

function formatDate(d: string | null | undefined) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
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

export function DhathuruCategoryPage({
  category, featured, articles, activeType,
}: {
  category: any;
  featured?: any | null;
  articles: any[];
  activeType: DestType | null;
}) {
  const typeLabel = featured ? getTypeLabel(featured) : null;

  return (
    <div style={{ backgroundColor: BG, minHeight: "100vh" }} dir="rtl">
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
              <div className="dhathuru-hero">
                <Link href={`/${category.slug}/${featured.slug}`} style={{ textDecoration: "none", display: "block" }}>
                  <div style={{ aspectRatio: "3/2", overflow: "hidden", borderRadius: "12px", background: BG_CARD, position: "relative", height: "100%" }}>
                    {featured.featured_image ? (
                      <Image src={featured.featured_image} alt={featured.review_subject || featured.title} fill sizes="(max-width: 768px) 100vw, 40vw" className="object-cover" priority />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: BG_CARD }} />
                    )}
                  </div>
                </Link>

                <div className="dhathuru-hero-text" style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
                  {/* Always rendered so hero content height doesn't shift when
                      an article has no destination type — visibility:hidden
                      keeps the same box reserved either way, mirroring the
                      identical fix on FilmCategoryPage's tag badge. */}
                  <span style={{ fontFamily: FONT, fontSize: "10px", fontWeight: 700, color: TEAL, border: "1.5px solid " + TEAL, padding: "4px 12px", borderRadius: "20px", display: "inline-block", alignSelf: "flex-start", marginBottom: "12px", letterSpacing: "0.05em", lineHeight: 1.6, visibility: typeLabel ? "visible" : "hidden" }}>
                    {typeLabel || " "}
                  </span>

                  <Link href={`/${category.slug}/${featured.slug}`} style={{ textDecoration: "none" }}>
                    <h2 style={{ fontFamily: FONT, fontWeight: 700, fontSize: "clamp(1.2rem,2.6vw,1.7rem)", lineHeight: 1.75, margin: "0 0 12px", color: TEXT }}>
                      {featured.review_subject || featured.title}
                    </h2>
                  </Link>

                  {featured.excerpt && (
                    <p style={{ fontFamily: FONT, fontSize: "14px", color: "rgb(60,58,52)", lineHeight: 2, margin: "0 0 16px" }} className="lc4">
                      {featured.excerpt}
                    </p>
                  )}

                  <Link
                    href={`/${category.slug}/${featured.slug}`}
                    style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: TEAL, textDecoration: "none", display: "inline-flex", alignSelf: "flex-start", alignItems: "center", gap: "4px", marginBottom: "16px", borderBottom: "1px solid rgba(20,110,110,0.3)", paddingBottom: "1px" }}
                  >
                    {"މުޅި އާޓިކަލް ކިޔާލަން ←"}
                  </Link>

                  <div>
                    {featured.author?.full_name && (
                      <p style={{ fontFamily: FONT, fontSize: "11px", color: TEXT_MUTED, margin: "0 0 3px" }}>{featured.author.full_name}</p>
                    )}
                    {featured.published_at && (
                      <p style={{ fontFamily: "system-ui,sans-serif", fontSize: "11px", color: TEXT_MUTED, margin: "0 0 3px", opacity: 0.75 }}>{formatDate(featured.published_at)}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {articles.length > 0 ? (
              <div className="dhathuru-grid">
                {articles.map(function (a) {
                  return (
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
                      imageSizes="(max-width: 480px) 100vw, (max-width: 1024px) 50vw, 22vw"
                    />
                  );
                })}
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
