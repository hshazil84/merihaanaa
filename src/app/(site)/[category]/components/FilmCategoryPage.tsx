// src/app/(site)/[category]/components/FilmCategoryPage.tsx
import Link from "next/link";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  reading_time_minutes: number | null;
  published_at: string | null;
  category: { name: string; slug: string } | null;
  author?: { full_name: string } | null;
}

interface ChartEntry {
  id: string;
  chart_type: string;
  rank: number;
  title: string;
  subtitle: string | null;
  status: string | null;
  article_id: string | null;
  featured_image: string | null;
}

interface Props {
  articles: Article[];
  cinemaEntries: ChartEntry[];
  videoClubEntries: ChartEntry[];
  categorySlug: string;
  totalCount: number;
  page: number;
}

const CORAL = "#E87060";

function CategoryTag({ name }: { name: string }) {
  return (
    <span
      className="inline-block text-[9px] px-2 py-0.5 rounded-full border"
      style={{
        fontFamily: "'MVTypewriter','MV Boli',sans-serif",
        color: CORAL,
        borderColor: CORAL,
        backgroundColor: "rgba(232,112,96,0.06)",
        lineHeight: 2,
      }}
    >
      {name}
    </span>
  );
}

function ColLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div style={{ width: "3px", height: "16px", background: CORAL, borderRadius: "2px", flexShrink: 0 }} />
      <p style={{ fontFamily: "'MVTypewriter','MV Boli',sans-serif", fontSize: "13px", fontWeight: 700, color: "rgb(26,26,26)", margin: 0 }}>
        {children}
      </p>
    </div>
  );
}

function ArticleCard({ article, categorySlug }: { article: Article; categorySlug: string }) {
  const slug = article.category?.slug ?? categorySlug;
  return (
    <Link href={`/${slug}/${article.slug}`} className="group block">
      <div className="aspect-[3/4] overflow-hidden rounded-lg bg-[#e8e5de] mb-3">
        {article.featured_image ? (
          <img
            src={article.featured_image}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-[#dedad2]" />
        )}
      </div>
      {article.category && <div className="mb-1.5"><CategoryTag name={article.category.name} /></div>}
      <h3
        className="line-clamp-3 group-hover:opacity-70 transition-opacity"
        style={{ fontFamily: '"MVTypewriter","Noto Sans Thaana",sans-serif', fontWeight: 700, fontSize: "13px", color: "rgb(26,26,26)", lineHeight: 2 }}
      >
        {article.title}
      </h3>
    </Link>
  );
}

function ChartSidebar({ cinemaEntries, videoClubEntries }: { cinemaEntries: ChartEntry[]; videoClubEntries: ChartEntry[] }) {
  const cinemaAll = [
    ...cinemaEntries.map(e => ({ ...e, chart_type: "cinema_now" })),
  ];

  return (
    <aside style={{ borderRight: "0.5px solid rgb(224,221,214)", paddingRight: "1.5rem" }}>

      {/* Cinema chart */}
      {cinemaAll.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <ColLabel>ސިނަމާ</ColLabel>
          <p style={{ fontFamily: "'MVTypewriter','MV Boli',sans-serif", fontSize: "10px", color: "rgb(153,153,153)", margin: "0 0 10px" }}>
            އޮލިމްޕަސް — ދައްކާ ފިލްމު
          </p>
          <div style={{ borderTop: "0.5px solid rgb(224,221,214)" }}>
            {cinemaAll.map((entry, i) => (
              <div key={entry.id} style={{ display: "flex", gap: "8px", padding: "8px 0", borderBottom: "0.5px dashed rgb(224,221,214)", alignItems: "flex-start" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: i < 2 ? CORAL : "rgb(153,153,153)", minWidth: "16px", fontFamily: "serif" }}>
                  {entry.rank}
                </span>
                {entry.featured_image && (
                  <div style={{ width: "40px", height: "56px", borderRadius: "4px", overflow: "hidden", flexShrink: 0, background: "rgb(232,229,222)" }}>
                    <img src={entry.featured_image} alt={entry.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: "'MVTypewriter','MV Boli',sans-serif", fontSize: "11px", fontWeight: 700, color: "rgb(26,26,26)", margin: "0 0 4px", lineHeight: 1.5 }} dir="rtl">
                    {entry.title}
                  </p>
                  {entry.status && (
                    <span style={{
                      fontSize: "9px",
                      background: entry.status === "now" ? CORAL : "rgb(240,239,233)",
                      color: entry.status === "now" ? "white" : "rgb(100,100,100)",
                      padding: "1px 6px",
                      borderRadius: "10px",
                      border: entry.status === "now" ? "none" : "0.5px solid rgb(210,207,200)",
                      fontFamily: "'MVTypewriter','MV Boli',sans-serif",
                    }}>
                      {entry.status === "now" ? "ލައިވް" : "އަންނަ"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {cinemaAll.length > 0 && videoClubEntries.length > 0 && (
        <div style={{ borderTop: "0.5px solid rgb(224,221,214)", marginBottom: "1.5rem" }} />
      )}

      {/* Video Club chart */}
      {videoClubEntries.length > 0 && (
        <div>
          <ColLabel>ވީޑިއޯ ކްލަބް</ColLabel>
          <p style={{ fontFamily: "'MVTypewriter','MV Boli',sans-serif", fontSize: "10px", color: "rgb(153,153,153)", margin: "0 0 10px" }}>
            މީޑިއާނެޓް ޓްރެންޑިން
          </p>
          <div style={{ borderTop: "0.5px solid rgb(224,221,214)" }}>
            {videoClubEntries.map((entry, i) => (
              <div key={entry.id} style={{ display: "flex", gap: "8px", padding: "8px 0", borderBottom: i < videoClubEntries.length - 1 ? "0.5px dashed rgb(224,221,214)" : "none", alignItems: "flex-start" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: i < 3 ? CORAL : "rgb(153,153,153)", minWidth: "16px", fontFamily: "serif" }}>
                  {entry.rank}
                </span>
                {entry.featured_image && (
                  <div style={{ width: "40px", height: "56px", borderRadius: "4px", overflow: "hidden", flexShrink: 0, background: "rgb(232,229,222)" }}>
                    <img src={entry.featured_image} alt={entry.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                )}
                <p style={{ fontFamily: "'MVTypewriter','MV Boli',sans-serif", fontSize: "11px", fontWeight: 700, color: "rgb(26,26,26)", margin: 0, lineHeight: 1.5, flex: 1, minWidth: 0 }} dir="rtl">
                  {entry.title}
                </p>
              </div>
            ))}
          </div>
          <p style={{ fontFamily: "'MVTypewriter','MV Boli',sans-serif", fontSize: "10px", color: "rgb(153,153,153)", margin: "8px 0 0" }}>
            ފަހުން އަޕްޑޭޓްކުރީ: ފަހުގެ
          </p>
        </div>
      )}
    </aside>
  );
}

export default function FilmCategoryPage({ articles, cinemaEntries, videoClubEntries, categorySlug, totalCount, page }: Props) {
  if (!articles.length) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12 flex items-center justify-center">
        <p style={{ fontFamily: "'MVTypewriter','MV Boli',sans-serif", fontSize: "13px", color: "rgb(140,138,132)" }}>ލިޔުންތެއް ނެތް</p>
      </div>
    );
  }

  const featured = articles[0];
  const grid3 = articles.slice(1, 4);
  const trending = articles.slice(4, 9);
  const bottomGrid = articles.slice(9, 12);

  const showCharts = cinemaEntries.length > 0 || videoClubEntries.length > 0;

  return (
    <div className="bg-[#F5F3EF]" dir="rtl">
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "1.5rem", borderBottom: "2px solid rgb(26,26,26)", paddingBottom: "10px" }}>
          <h1 style={{ fontFamily: "'MVTypewriter','MV Boli',sans-serif", fontSize: "22px", fontWeight: 700, margin: 0, color: "rgb(26,26,26)" }}>
            ފިލްމު
          </h1>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: showCharts ? "1fr 220px" : "1fr", gap: "2.5rem" }}>

          {/* Main content */}
          <div>

            {/* Featured article */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
              <div>
                {featured.category && <div style={{ marginBottom: "6px" }}><CategoryTag name={featured.category.name} /></div>}
                <Link href={`/${featured.category?.slug ?? categorySlug}/${featured.slug}`} className="group block">
                  <h2
                    className="group-hover:opacity-70 transition-opacity"
                    style={{ fontFamily: '"MVTypewriter","Noto Sans Thaana",sans-serif', fontWeight: 700, fontSize: "18px", lineHeight: 1.8, margin: "0 0 10px", color: "rgb(26,26,26)" }}
                  >
                    {featured.title}
                  </h2>
                </Link>
                {featured.excerpt && (
                  <p style={{ fontFamily: '"MVTypewriter","Noto Sans Thaana",sans-serif', fontSize: "13px", color: "rgb(110,108,102)", lineHeight: 1.8, margin: "0 0 8px" }}>
                    {featured.excerpt}
                  </p>
                )}
                {featured.author && (
                  <p style={{ fontFamily: "'MVTypewriter','MV Boli',sans-serif", fontSize: "11px", color: "rgb(153,153,153)", margin: 0 }}>
                    {featured.author.full_name}
                  </p>
                )}
              </div>
              <Link href={`/${featured.category?.slug ?? categorySlug}/${featured.slug}`} className="group block">
                <div className="aspect-[3/4] overflow-hidden rounded-lg bg-[#e8e5de]">
                  {featured.featured_image ? (
                    <img src={featured.featured_image} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-[#dedad2]" />
                  )}
                </div>
              </Link>
            </div>

            <div style={{ borderTop: "0.5px solid rgb(224,221,214)", marginBottom: "1.5rem" }} />

            {/* 3-column grid */}
            {grid3.length > 0 && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem", marginBottom: "1.5rem" }}>
                  {grid3.map((article) => (
                    <ArticleCard key={article.id} article={article} categorySlug={categorySlug} />
                  ))}
                </div>
                <div style={{ borderTop: "0.5px solid rgb(224,221,214)", marginBottom: "1.5rem" }} />
              </>
            )}

            {/* Trending in ފިލްމު */}
            {trending.length > 0 && (
              <>
                <ColLabel>ފިލްމު ތެރޭ ޓްރެންޑިން</ColLabel>
                <div style={{ borderTop: "0.5px solid rgb(224,221,214)" }}>
                  {trending.map((article, i) => (
                    <Link key={article.id} href={`/${article.category?.slug ?? categorySlug}/${article.slug}`} className="group block">
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 0", borderBottom: "0.5px solid rgb(232,229,222)" }}>
                        <span style={{ fontSize: "22px", fontWeight: 700, color: i < 2 ? CORAL : "rgb(200,197,190)", minWidth: "28px", fontFamily: "serif", lineHeight: 1 }}>
                          {i + 1}
                        </span>
                        <div style={{ width: "56px", height: "72px", borderRadius: "6px", overflow: "hidden", flexShrink: 0, background: "rgb(232,229,222)" }}>
                          {article.featured_image && <img src={article.featured_image} alt={article.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          {article.category && <div style={{ marginBottom: "3px" }}><CategoryTag name={article.category.name} /></div>}
                          <p
                            className="group-hover:opacity-70 transition-opacity"
                            style={{ fontFamily: '"MVTypewriter","Noto Sans Thaana",sans-serif', fontWeight: 700, fontSize: "13px", lineHeight: 1.8, margin: "0 0 3px", color: "rgb(26,26,26)" }}
                          >
                            {article.title}
                          </p>
                          {article.author && (
                            <p style={{ fontFamily: "'MVTypewriter','MV Boli',sans-serif", fontSize: "10px", color: "rgb(153,153,153)", margin: 0 }}>
                              {article.author.full_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <div style={{ borderTop: "0.5px solid rgb(224,221,214)", marginBottom: "1.5rem", marginTop: "0.25rem" }} />
              </>
            )}

            {/* Bottom card grid */}
            {bottomGrid.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem" }}>
                {bottomGrid.map((article) => (
                  <ArticleCard key={article.id} article={article} categorySlug={categorySlug} />
                ))}
              </div>
            )}

          </div>

          {/* Sidebar */}
          {showCharts && (
            <ChartSidebar cinemaEntries={cinemaEntries} videoClubEntries={videoClubEntries} />
          )}

        </div>
      </div>
    </div>
  );
}
