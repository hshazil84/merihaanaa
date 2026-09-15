import { BookCover } from "./BookCover";
import { BookReviewCard } from "./BookReviewCard";
import { Pagination } from "./Pagination";

const GOLD = "rgb(180,160,110)";
const FONT = '"MVTypewriter","Noto Sans Thaana",sans-serif';
const FONT_DISPLAY = '"SanguSuruhee","MVTypewriter","Noto Sans Thaana",sans-serif';
const TEXT = "rgb(60,45,20)";

const SECTION_LABELS: Record<string, string> = {
  long: "ދިގު ވާހަކަ",
  short: "ކުރު ވާހަކަ",
  review: "ބުކް ރިވިއު",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.5rem" }}>
      <div style={{ height: "1px", flex: 1, background: GOLD, opacity: 0.3 }} />
      <p style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 700, color: TEXT, margin: 0, letterSpacing: "0.03em" }}>
        {children}
      </p>
      <div style={{ height: "1px", flex: 1, background: GOLD, opacity: 0.3 }} />
    </div>
  );
}

function SeeAllLink({ href }: { href: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: "1.25rem" }}>
      
        href={href}
        style={{
          fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: TEXT,
          padding: "8px 20px", borderRadius: "9999px",
          border: "1px solid " + GOLD, backgroundColor: "rgba(180,160,110,0.08)",
        }}
      >
        {"އިތުރަށް ކިޔާލުމަށް →"}
      </a>
    </div>
  );
}

function SeriesBookCover({ series, categorySlug }: { series: any; categorySlug: string }) {
  const articleProp = {
    id: series.id,
    title: series.title,
    slug: series.first_slug ?? series.slug,
    cover_portrait_url: series.thumbnail ?? null,
    featured_image: series.thumbnail ?? null,
    published_at: null,
    author: null,
    reading_time_minutes: null,
  };

  return (
    <div style={{ position: "relative" }}>
      <BookCover article={articleProp} categorySlug={categorySlug} />

      {series.latest_chapter && (
        <div style={{ position: "absolute", bottom: "52px", right: "8px", zIndex: 2 }}>
          <span style={{
            fontFamily: FONT, fontSize: "9px", fontWeight: 700,
            background: "rgba(180,160,110,0.92)", color: "white",
            padding: "2px 8px", borderRadius: "10px", display: "block",
          }}>
            {"އެންމެ ފަހުގެ · " + series.latest_chapter + " ވަނަ ބައި"}
          </span>
        </div>
      )}

      {series.chapter_count > 0 && (
        <div style={{ position: "absolute", top: "10px", right: "10px", zIndex: 2 }}>
          <span style={{
            fontFamily: FONT, fontSize: "9px", fontWeight: 700,
            background: "rgba(0,0,0,0.5)", color: "white",
            padding: "2px 7px", borderRadius: "8px",
          }}>
            {series.chapter_count + " ބައި"}
          </span>
        </div>
      )}
    </div>
  );
}

type FocusedSection = "long" | "short" | "review" | null;

export function StoriesCategoryPage({
  category,
  seriesList,
  shortStories,
  bookReviews,
  seriesTotal,
  shortTotal,
  reviewTotal,
  focusedSection = null,
  page,
  totalPages,
}: {
  category: any;
  seriesList?: any[];
  shortStories?: any[];
  bookReviews?: any[];
  seriesTotal?: number;
  shortTotal?: number;
  reviewTotal?: number;
  focusedSection?: FocusedSection;
  page: number;
  totalPages: number;
}) {
  const series = seriesList ?? [];
  const shorts = shortStories ?? [];
  const reviews = bookReviews ?? [];

  const background = (
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
      backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      opacity: 0.6,
    }} />
  );

  const header = (
    <header className="max-w-4xl mx-auto px-6 pt-8 pb-6 text-center">
      <h1 style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px" }}>
        <span style={{ height: "1px", width: "40px", backgroundColor: GOLD, flexShrink: 0, display: "inline-block" }} />
        <span style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(2rem,5vw,3.5rem)", color: TEXT, lineHeight: 1.4, fontWeight: 400 }}>
          {category.name}
        </span>
        <span style={{ height: "1px", width: "40px", backgroundColor: GOLD, flexShrink: 0, display: "inline-block" }} />
      </h1>
    </header>
  );

  // ── Focused section: one type, fully paginated ──────────────
  if (focusedSection) {
    const items =
      focusedSection === "long" ? series :
      focusedSection === "short" ? shorts :
      reviews;

    return (
      <div dir="rtl" style={{ backgroundColor: "#F0EAD6", minHeight: "100vh" }}>
        {background}
        <div style={{ position: "relative", zIndex: 1 }}>
          {header}
          <div className="max-w-4xl mx-auto px-6 pb-4">
            <a href={"/" + category.slug} style={{ fontFamily: FONT, fontSize: "12px", color: "rgb(140,115,65)" }}>
              {"← ހުރިހާ ވާހަކަ"}
            </a>
          </div>
          <div className="max-w-4xl mx-auto px-6 pb-16">
            <section>
              <SectionLabel>{SECTION_LABELS[focusedSection]}</SectionLabel>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {focusedSection === "long" &&
                  items.map((s: any) => <SeriesBookCover key={s.id} series={s} categorySlug={category.slug} />)}
                {focusedSection === "short" &&
                  items.map((article: any) => (
                    <div key={article.id}><BookCover article={article} categorySlug={category.slug} /></div>
                  ))}
                {focusedSection === "review" &&
                  items.map((article: any) => (
                    <BookReviewCard key={article.id} article={article} categorySlug={category.slug} />
                  ))}
              </div>
            </section>
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            categorySlug={category.slug}
            variant="parchment"
            extraParams={{ section: focusedSection }}
          />
        </div>
      </div>
    );
  }

  // ── Overview: three capped rows, each with a see-all link ───
  return (
    <div dir="rtl" style={{ backgroundColor: "#F0EAD6", minHeight: "100vh" }}>
      {background}
      <div style={{ position: "relative", zIndex: 1 }}>
        {header}

        <div className="max-w-4xl mx-auto px-6 pb-16">

          {series.length > 0 && (
            <section style={{ marginBottom: "3rem" }}>
              <SectionLabel>{SECTION_LABELS.long}</SectionLabel>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {series.map((s: any) => <SeriesBookCover key={s.id} series={s} categorySlug={category.slug} />)}
              </div>
              {(seriesTotal ?? series.length) > series.length && (
                <SeeAllLink href={"/" + category.slug + "?section=long"} />
              )}
            </section>
          )}

          {shorts.length > 0 && (
            <section style={{ marginBottom: "3rem" }}>
              <SectionLabel>{SECTION_LABELS.short}</SectionLabel>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {shorts.map((article: any) => (
                  <div key={article.id}><BookCover article={article} categorySlug={category.slug} /></div>
                ))}
              </div>
              {(shortTotal ?? shorts.length) > shorts.length && (
                <SeeAllLink href={"/" + category.slug + "?section=short"} />
              )}
            </section>
          )}

          {reviews.length > 0 && (
            <section style={{ marginBottom: "2rem" }}>
              <SectionLabel>{SECTION_LABELS.review}</SectionLabel>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {reviews.map((article: any) => (
                  <BookReviewCard key={article.id} article={article} categorySlug={category.slug} />
                ))}
              </div>
              {(reviewTotal ?? reviews.length) > reviews.length && (
                <SeeAllLink href={"/" + category.slug + "?section=review"} />
              )}
            </section>
          )}

        </div>
      </div>
    </div>
  );
}
