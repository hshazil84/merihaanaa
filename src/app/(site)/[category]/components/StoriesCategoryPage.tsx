import { BookCover } from "./BookCover";
import { Pagination } from "./Pagination";

const GOLD = "rgb(180,160,110)";
const FONT = '"MVTypewriter","Noto Sans Thaana",sans-serif';
const FONT_DISPLAY = '"SanguSuruhee","MVTypewriter","Noto Sans Thaana",sans-serif';
const TEXT = "rgb(60,45,20)";
const TEXT_MUTED = "rgb(140,120,80)";
const DIVIDER = "rgba(180,160,110,0.2)";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.5rem" }}>
      <div style={{ height: "1px", flex: 1, background: GOLD, opacity: 0.4 }} />
      <p style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 700, color: TEXT, margin: 0, letterSpacing: "0.03em" }}>
        {children}
      </p>
      <div style={{ height: "1px", flex: 1, background: GOLD, opacity: 0.4 }} />
    </div>
  );
}

function SeriesBookCover({ series, categorySlug }: { series: any; categorySlug: string }) {
  const articleProp = {
    id: series.id,
    title: series.title,
    slug: series.latest_slug ?? series.slug,
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
            backdropFilter: "blur(4px)",
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
            backdropFilter: "blur(4px)",
          }}>
            {series.chapter_count + " ބައި"}
          </span>
        </div>
      )}

      <div style={{ marginTop: "4px", paddingRight: "4px" }}>
        <h3 style={{ fontFamily: FONT, fontWeight: 700, fontSize: "13px", color: TEXT, lineHeight: 1.9, margin: "0 0 2px" }} dir="rtl"
          className="line-clamp-2">
          {series.title}
        </h3>
        {series.latest_published_at && (
          <span style={{ fontFamily: FONT, fontSize: "10px", color: TEXT_MUTED }}>
            {(function() {
              const date = new Date(series.latest_published_at);
              const months = ["ޖެނުއަރީ","ފެބްރުއަރީ","މާރިޗު","އޭޕްރީލު","މެއި","ޖޫން","ޖުލައި","އޯގަސްޓު","ސެޕްޓެމްބަރު","އޮކްޓޯބަރު","ނޮވެމްބަރު","ޑިސެމްބަރު"];
              return months[date.getMonth()] + " " + date.getDate() + "، " + date.getFullYear();
            })()}
          </span>
        )}
      </div>
    </div>
  );
}

export function StoriesCategoryPage({
  category, articles, recentArticles, seriesList, shortStories, total, totalPages, page,
}: {
  category: any;
  articles?: any[];
  recentArticles?: any[];
  seriesList?: any[];
  shortStories?: any[];
  total: number;
  totalPages: number;
  page: number;
}) {
  const recent = recentArticles ?? articles?.slice(0, 4) ?? [];
  const series = seriesList ?? [];
  const shorts = (shortStories && shortStories.length > 0) ? shortStories : (articles ?? []);

  return (
    <div dir="rtl" style={{ backgroundColor: "#F0EAD6", minHeight: "100vh" }}>
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
        opacity: 0.6,
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>

        <header className="max-w-4xl mx-auto px-6 pt-8 pb-6 text-center">
          <h1 style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px" }}>
            <span style={{ height: "1px", width: "40px", backgroundColor: GOLD, flexShrink: 0, display: "inline-block" }} />
            <span style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(2rem,5vw,3.5rem)", color: TEXT, lineHeight: 1.4, fontWeight: 400 }}>
              {category.name}
            </span>
            <span style={{ height: "1px", width: "40px", backgroundColor: GOLD, flexShrink: 0, display: "inline-block" }} />
          </h1>
        </header>

        <div className="max-w-4xl mx-auto px-6">

          {recent.length > 0 && (
            <section style={{ marginBottom: "3rem" }}>
              <SectionLabel>އެންމެ ފަހުގެ</SectionLabel>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {recent.map(function(article: any) {
                  return (
                    <div key={article.id}>
                      <BookCover article={article} categorySlug={category.slug} />
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {recent.length > 0 && series.length > 0 && (
            <div style={{ borderTop: "0.5px solid " + DIVIDER, marginBottom: "3rem" }} />
          )}

          {series.length > 0 && (
            <section style={{ marginBottom: "3rem" }}>
              <SectionLabel>ދިގު ވާހަކަ</SectionLabel>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {series.map(function(s: any) {
                  return <SeriesBookCover key={s.id} series={s} categorySlug={category.slug} />;
                })}
              </div>
            </section>
          )}

          {series.length > 0 && shorts.length > 0 && (
            <div style={{ borderTop: "0.5px solid " + DIVIDER, marginBottom: "3rem" }} />
          )}

          {shorts.length > 0 && (
            <section style={{ marginBottom: "3rem" }}>
              <SectionLabel>ކުރު ވާހަކަ</SectionLabel>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {shorts.map(function(article: any) {
                  return (
                    <div key={article.id}>
                      <BookCover article={article} categorySlug={category.slug} />
                    </div>
                  );
                })}
              </div>
            </section>
          )}

        </div>

        <Pagination page={page} totalPages={totalPages} categorySlug={category.slug} variant="parchment" />

      </div>
    </div>
  );
}
