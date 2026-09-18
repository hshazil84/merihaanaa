import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { AdSlot } from "./AdSlot";
import { getFirstTag } from "@/lib/tags";

interface Article {
  id: string; title: string; slug: string; excerpt: string | null;
  featured_image: string | null; reading_time_minutes: number | null;
  published_at: string | null; tags: any[] | null;
  category: { name: string; slug: string } | null;
  author?: { full_name: string } | null;
}
interface Props {
  featured: Article | null;
  articles: Article[];
  categorySlug: string;
}

const OCHRE = "rgb(178,134,43)";
const BG = "#F5F3EF";
const BG_CARD = "#EBE8E1";
const TEXT = "rgb(26,26,26)";
const TEXT_MUTED = "rgb(140,138,132)";
const DIVIDER = "rgba(0,0,0,0.07)";
const FONT = '"MVTypewriter","Noto Sans Thaana",sans-serif';
const FONT_DISPLAY = '"SanguSuruhee","MVTypewriter","Noto Sans Thaana",sans-serif';

const CSS = [
  ".thakethi-top{display:grid;grid-template-columns:1fr 300px;gap:1.5rem;align-items:stretch;}",
  ".thakethi-hero{display:grid;grid-template-columns:1.1fr 1fr;gap:1.75rem;align-items:stretch;margin-bottom:1.5rem;}",
  ".thakethi-3col{display:grid;grid-template-columns:1fr 1fr 1fr;gap:1.25rem;}",
  ".lc2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}",
  ".lc4{display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;}",
  "@media(max-width:1024px){.thakethi-top{grid-template-columns:1fr!important;}}",
  "@media(max-width:768px){.thakethi-hero{grid-template-columns:1fr!important;gap:1.25rem!important;}.thakethi-3col{grid-template-columns:1fr 1fr!important;}}",
  "@media(max-width:480px){.thakethi-3col{grid-template-columns:1fr!important;}}",
].join("");

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function ArticleCard({ article, categorySlug }: { article: Article; categorySlug: string }) {
  const slug = article.category?.slug ?? categorySlug;
  const tag = getFirstTag(article.tags);
  return (
    <Link href={"/" + slug + "/" + article.slug} style={{ textDecoration: "none", display: "block" }}>
      <div style={{ aspectRatio: "4/3", overflow: "hidden", borderRadius: "8px", backgroundColor: BG_CARD, marginBottom: "10px", position: "relative" }}>
        {article.featured_image
          ? <Image src={article.featured_image} alt={article.title} fill sizes="(max-width: 480px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover" style={{ transition: "transform 0.5s ease" }} />
          : <div style={{ width: "100%", height: "100%", backgroundColor: BG_CARD }} />
        }
      </div>
      {tag && <span style={{ fontFamily: FONT, fontSize: "9px", fontWeight: 700, color: OCHRE, border: "1px solid " + OCHRE, padding: "2px 8px", borderRadius: "20px", display: "inline-block", marginBottom: "5px" }}>{tag}</span>}
      <h3 style={{ fontFamily: FONT, fontWeight: 700, fontSize: "13px", color: TEXT, lineHeight: 1.9, margin: "0 0 4px" }} className="lc2">{article.title}</h3>
      {article.author && <p style={{ fontFamily: FONT, fontSize: "10px", color: TEXT_MUTED, margin: 0 }}>{article.author.full_name}</p>}
    </Link>
  );
}

export default function ThakethiCategoryPage({ featured, articles, categorySlug }: Props) {
  return (
    <div style={{ backgroundColor: BG, minHeight: "100vh" }} dir="rtl">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header style={{ maxWidth: "84rem", margin: "0 auto", padding: "2rem 1.5rem 1.5rem", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
          <span style={{ color: "rgba(0,0,0,0.18)", fontSize: "11px" }}>{"✦"}</span>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(2rem,5vw,3.5rem)", color: OCHRE, lineHeight: 1.5, fontWeight: 400, margin: 0 }}>ތަކެތި</h1>
          <span style={{ color: "rgba(0,0,0,0.18)", fontSize: "11px" }}>{"✦"}</span>
        </div>
      </header>

      <div style={{ maxWidth: "84rem", margin: "0 auto", padding: "0 1.5rem 4rem" }}>

        <div className="thakethi-top" style={{ marginBottom: "2rem" }}>

          <div>
            {featured && (
              <div className="thakethi-hero">
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
                    <span style={{ fontFamily: FONT, fontSize: "10px", fontWeight: 700, color: OCHRE, border: "1.5px solid " + OCHRE, padding: "4px 12px", borderRadius: "20px", display: "inline-block", alignSelf: "flex-start", marginBottom: "12px", letterSpacing: "0.05em", lineHeight: 1.6 }}>
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
                    style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: OCHRE, textDecoration: "none", display: "inline-flex", alignSelf: "flex-start", alignItems: "center", gap: "4px", marginBottom: "16px", borderBottom: "1px solid rgba(178,134,43,0.4)", paddingBottom: "1px" }}>
                    {"މުޅި އާޓިކަލް ކިޔާލަން ←"}
                  </Link>
                  <div>
                    {featured.author && <p style={{ fontFamily: FONT, fontSize: "11px", color: TEXT_MUTED, margin: "0 0 3px" }}>{featured.author.full_name}</p>}
                    {featured.published_at && <p style={{ fontFamily: "system-ui,sans-serif", fontSize: "11px", color: TEXT_MUTED, margin: "0 0 3px", opacity: 0.75 }}>{formatDate(featured.published_at)}</p>}
                    {featured.reading_time_minutes && <p style={{ fontFamily: FONT, fontSize: "10px", color: TEXT_MUTED, margin: 0 }}>{featured.reading_time_minutes + " މިނެޓު"}</p>}
                  </div>
                </div>
              </div>
            )}

            {articles.length > 0 && (
              <div className="thakethi-3col">
                {articles.map(function(a) { return <ArticleCard key={a.id} article={a} categorySlug={categorySlug} />; })}
              </div>
            )}
          </div>

          <div className="thakethi-ad-rail">
            <Suspense fallback={null}>
              <AdSlot id="thakethi-hero-rail" breakpoint="desktop" />
            </Suspense>
          </div>

        </div>

        <div style={{ marginBottom: "2rem" }}>
          <Suspense fallback={null}>
            <AdSlot id="thakethi-hero-rail" breakpoint="mobile" />
          </Suspense>
        </div>

        <div style={{ display: "flex", justifyContent: "center", paddingTop: "1rem", borderTop: "0.5px solid " + DIVIDER }}>
          <Link href={"/" + categorySlug + "/archive"}
            style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: OCHRE, textDecoration: "none", padding: "8px 20px", border: "0.5px solid " + OCHRE, borderRadius: "8px" }}>
            {"އިތުރު ލިޔުންތައް ←"}
          </Link>
        </div>

      </div>
    </div>
  );
}
