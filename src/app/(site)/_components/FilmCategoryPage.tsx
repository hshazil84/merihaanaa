import Link from "next/link";
import Image from "next/image";
import { StandardArticleCard } from "./StandardArticleCard";
import { AdSlot } from "./AdSlot";

interface Article {
  id: string; title: string; slug: string; excerpt: string | null;
  featured_image: string | null; cover_portrait_url: string | null;
  reading_time_minutes: number | null;
  published_at: string | null; tags: any[] | null; view_count?: number | null;
  category: { name: string; slug: string } | null;
  author?: { full_name: string } | null;
  created_at?: string | null;
}
interface FeaturedOriginal {
  id: string; title: string; slug: string; description: string | null;
  thumbnail_url: string | null; cloudflare_stream_id: string | null;
  duration_seconds: number | null; type: string | null;
}
interface Props {
  articles: Article[];
  reviews: Article[];
  categorySlug: string;
}

const RED = "#ba2a31";
const FONT = '"MVTypewriter","Noto Sans Thaana",sans-serif';
const FONT_DISPLAY = '"SanguSuruhee","MVTypewriter","Noto Sans Thaana",sans-serif';
const BG = "#F5F3EF";
const BG_CARD = "#EBE8E1";
const TEXT = "rgb(26,26,26)";
const TEXT_MUTED = "rgb(140,138,132)";
const DIVIDER = "rgba(0,0,0,0.07)";

const CSS = [
  ".film-top{display:grid;grid-template-columns:1fr 220px;gap:1.5rem;align-items:stretch;}",
  ".film-hero{display:grid;grid-template-columns:1.1fr 1fr;gap:1.75rem;align-items:stretch;margin-bottom:1.5rem;}",
  ".film-3col{display:grid;grid-template-columns:1fr 1fr 1fr;gap:1.25rem;}",
  ".film-review-grid{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:1.25rem;}",
  ".lc2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}",
  ".lc4{display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;}",
  "@media(max-width:1024px){.film-top{grid-template-columns:1fr!important;}.film-ad-rail{display:none!important;}}",
  "@media(max-width:768px){.film-hero{grid-template-columns:1fr!important;gap:1.25rem!important;}.film-3col{grid-template-columns:1fr 1fr!important;}.film-review-grid{grid-template-columns:1fr 1fr!important;}}",
  "@media(max-width:480px){.film-3col{grid-template-columns:1fr!important;}.film-review-grid{grid-template-columns:1fr 1fr!important;gap:0.75rem!important;}}",
].join("");

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}
function getFirstTag(tags: any[] | null): string | null {
  if (!tags || !Array.isArray(tags) || tags.length === 0) return null;
  const raw = tags[0];
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && raw !== null) return raw.name ?? null;
  return null;
}
function hasTag(tags: any[] | null, name: string): boolean {
  if (!tags || !Array.isArray(tags)) return false;
  return tags.some(function(raw) {
    const val = typeof raw === "string" ? raw : (raw && typeof raw === "object" ? raw.name : null);
    return typeof val === "string" && val.toLowerCase() === name.toLowerCase();
  });
}

function PosterCard({ article, categorySlug }: { article: Article; categorySlug: string }) {
  const slug = article.category?.slug ?? categorySlug;
  const cover = article.cover_portrait_url || article.featured_image;
  return (
    <Link href={"/" + slug + "/" + article.slug} style={{ textDecoration: "none", display: "block" }}>
      <div style={{ aspectRatio: "3/4", overflow: "hidden", borderRadius: "10px", backgroundColor: BG_CARD, marginBottom: "10px", position: "relative" }}>
        {cover
          ? <Image src={cover} alt={article.title} fill sizes="(max-width: 480px) 45vw, (max-width: 768px) 45vw, 20vw" className="object-cover" />
          : <div style={{ width: "100%", height: "100%", backgroundColor: BG_CARD }} />
        }
        <div style={{ position: "absolute", top: "10px", insetInlineEnd: "10px" }}>
          <span style={{ fontFamily: FONT, fontSize: "9px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px", background: RED, color: "white" }}>ރިވިއު</span>
        </div>
      </div>
      <h3 style={{ fontFamily: FONT, fontWeight: 700, fontSize: "13px", color: TEXT, lineHeight: 1.9, margin: 0 }} className="lc2">{article.title}</h3>
    </Link>
  );
}

export default function FilmCategoryPage({ articles, reviews, categorySlug }: Props) {
  const featured = articles[0] ?? null;
  const grid3 = articles.slice(1, 4);
  const reviewArticles = reviews;

  return (
    <div style={{ backgroundColor: BG, minHeight: "100vh" }} dir="rtl">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header style={{ maxWidth: "84rem", margin: "0 auto", padding: "2rem 1.5rem 1.5rem", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
          <span style={{ color: "rgba(0,0,0,0.18)", fontSize: "11px" }}>{"✦"}</span>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(2rem,5vw,3.5rem)", color: RED, lineHeight: 1.5, fontWeight: 400, margin: 0 }}>ފިލްމު</h1>
          <span style={{ color: "rgba(0,0,0,0.18)", fontSize: "11px" }}>{"✦"}</span>
        </div>
      </header>

      <div style={{ maxWidth: "84rem", margin: "0 auto", padding: "0 1.5rem 4rem" }}>

        <div className="film-top" style={{ marginBottom: "2rem" }}>

          <div>
            {featured && (
              <div className="film-hero">
                <Link href={"/" + (featured.category?.slug ?? categorySlug) + "/" + featured.slug} style={{ textDecoration: "none", display: "block" }}>
                  <div style={{ aspectRatio: "3/2", overflow: "hidden", borderRadius: "12px", background: BG_CARD, position: "relative", height: "100%" }}>
                    {featured.featured_image
                      ? <Image src={featured.featured_image} alt={featured.title} fill sizes="(max-width: 768px) 100vw, 40vw" className="object-cover" priority />
                      : <div style={{ width: "100%", height: "100%", background: BG_CARD }} />
                    }
                  </div>
                </Link>
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
                  {getFirstTag(featured.tags) && (
                    <span style={{ fontFamily: FONT, fontSize: "10px", fontWeight: 700, color: RED, border: "1.5px solid " + RED, padding: "4px 12px", borderRadius: "20px", display: "inline-block", alignSelf: "flex-start", marginBottom: "12px", letterSpacing: "0.05em", lineHeight: 1.6 }}>
                      {getFirstTag(featured.tags)}
                    </span>
                  )}
                  <Link href={"/" + (featured.category?.slug ?? categorySlug) + "/" + featured.slug} style={{ textDecoration: "none" }}>
                    <h2 style={{ fontFamily: FONT, fontWeight: 700, fontSize: "clamp(1.2rem,2.6vw,1.7rem)", lineHeight: 1.75, margin: "0 0 12px", color: TEXT }}>{featured.title}</h2>
                  </Link>
                  {featured.excerpt && (
                    <p style={{ fontFamily: FONT, fontSize: "14px", color: "rgb(60,58,52)", lineHeight: 2, margin: "0 0 16px" }} className="lc4">{featured.excerpt}</p>
                  )}
                  <Link href={"/" + (featured.category?.slug ?? categorySlug) + "/" + featured.slug}
                    style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: RED, textDecoration: "none", display: "inline-flex", alignSelf: "flex-start", alignItems: "center", gap: "4px", marginBottom: "16px", borderBottom: "1px solid rgba(186,42,49,0.3)", paddingBottom: "1px" }}>
                    {"މުޅި އާޓިކަލް ކިޔާލަން ←"}
                  </Link>
                  <div>
                    {featured.author && <p style={{ fontFamily: FONT, fontSize: "11px", color: TEXT_MUTED, margin: "0 0 3px" }}>{featured.author.full_name}</p>}
                    {featured.published_at && <p style={{ fontFamily: "system-ui,sans-serif", fontSize: "11px", color: TEXT_MUTED, margin: "0 0 3px", opacity: 0.75 }}>{formatDate(featured.published_at)}</p>}
                  </div>
                </div>
              </div>
            )}

            {grid3.length > 0 && (
              <div className="film-3col">
                {grid3.map(function(a) {
                  return (
                    <StandardArticleCard
                      key={a.id}
                      href={"/" + (a.category?.slug ?? categorySlug) + "/" + a.slug}
                      title={a.title}
                      excerpt={a.excerpt}
                      featuredImage={a.featured_image}
                      badgeLabel={getFirstTag(a.tags)}
                      imageSizes="(max-width: 480px) 100vw, (max-width: 1024px) 50vw, 22vw"
                    />
                  );
                })}
              </div>
            )}
          </div>

          <div className="film-ad-rail">
            <AdSlot variant="rail" />
          </div>

        </div>

        {reviewArticles.length > 0 && (
          <div style={{ marginBottom: "2rem", padding: "1.75rem", borderRadius: "14px", background: "rgba(186,42,49,0.035)" }}>
            <div style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "3px", height: "14px", background: RED, borderRadius: "2px", flexShrink: 0 }} />
                <p style={{ fontFamily: FONT, fontSize: "11px", fontWeight: 700, color: "rgba(0,0,0,0.5)", margin: 0, letterSpacing: "0.04em" }}>ފިލްމު ރިވިއު</p>
              </div>
              <Link href={"/" + categorySlug + "/reviews"} style={{ fontFamily: FONT, fontSize: "11px", fontWeight: 700, color: RED, textDecoration: "none", borderBottom: "1px solid rgba(186,42,49,0.3)", paddingBottom: "1px" }}>
                {"އިތުރު ރިވިއު ←"}
              </Link>
            </div>
            <div className="film-review-grid">
              {reviewArticles.map(function(a) { return <PosterCard key={a.id} article={a} categorySlug={categorySlug} />; })}
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "center", paddingTop: "1rem", borderTop: "0.5px solid " + DIVIDER }}>
          <Link href={"/" + categorySlug + "/archive"}
            style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: RED, textDecoration: "none", padding: "8px 20px", border: "0.5px solid " + RED, borderRadius: "8px" }}>
            {"އިތުރު ލިޔުންތައް ←"}
          </Link>
        </div>

      </div>
    </div>
  );
}
