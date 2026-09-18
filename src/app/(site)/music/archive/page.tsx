import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getFirstTag } from "@/lib/tags";

interface PageProps {
  searchParams: { page?: string };
}

const PAGE_SIZE = 12;
const GREEN = "#71bc22";
const BG = "#2b2a28";
const BG_CARD = "#3a3936";
const TEXT = "#f0ede7";
const TEXT_MUTED = "rgba(240,237,231,0.45)";
const DIVIDER = "rgba(240,237,231,0.08)";
const FONT = '"MVTypewriter","Noto Sans Thaana",sans-serif';
const FONT_DISPLAY = '"SanguSuruhee","MVTypewriter","Noto Sans Thaana",sans-serif';

const CSS = [
  ".archive-grid{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:1.25rem;}",
  ".lc2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}",
  "@media(max-width:1024px){.archive-grid{grid-template-columns:1fr 1fr 1fr!important;}}",
  "@media(max-width:768px){.archive-grid{grid-template-columns:1fr 1fr!important;}}",
  "@media(max-width:480px){.archive-grid{grid-template-columns:1fr!important;}}",
].join("");

export default async function MusicArchivePage({ searchParams }: PageProps) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));
  const supabase = await createServerSupabaseClient();

  const { data: category } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("slug", "music")
    .single();

  if (!category) notFound();

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: articlesRaw, count } = await supabase
    .from("articles")
    .select("id, title, slug, excerpt, featured_image, published_at, tags", { count: "exact" })
    .eq("status", "published")
    .eq("category_id", category.id)
    .order("published_at", { ascending: false })
    .range(from, to);

  const articles = articlesRaw ?? [];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div style={{ backgroundColor: BG, minHeight: "100vh" }} dir="rtl">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header style={{ maxWidth: "84rem", margin: "0 auto", padding: "1.5rem 1.5rem 0" }}>
        <div style={{ fontFamily: FONT, fontSize: "12px", color: TEXT_MUTED, display: "flex", alignItems: "center", gap: "6px", justifyContent: "center" }}>
          <Link href="/music" style={{ color: TEXT_MUTED, textDecoration: "none" }}>މިއުޒިކް</Link>
          <span>{"<"}</span>
          <span style={{ color: GREEN, fontWeight: 700 }}>ލިޔުންތައް</span>
        </div>
      </header>

      <header style={{ maxWidth: "84rem", margin: "0 auto", padding: "1rem 1.5rem 1.5rem", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
          <span style={{ color: "rgba(113,188,34,0.3)", fontSize: "11px" }}>{"✦"}</span>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(2rem,5vw,3.5rem)", color: GREEN, lineHeight: 1.5, fontWeight: 400, margin: 0 }}>މިއުޒިކް ލިޔުންތައް</h1>
          <span style={{ color: "rgba(113,188,34,0.3)", fontSize: "11px" }}>{"✦"}</span>
        </div>
      </header>

      <div style={{ maxWidth: "84rem", margin: "0 auto", padding: "0 1.5rem 4rem" }}>
        {articles.length === 0 ? (
          <p style={{ fontFamily: FONT, fontSize: "13px", color: TEXT_MUTED, textAlign: "center", padding: "3rem 0" }}>
            އަދި ލިޔުމެއް ނެތް
          </p>
        ) : (
          <>
            <div className="archive-grid">
              {articles.map(function (article: any) {
                const tag = getFirstTag(article.tags);
                return (
                  <Link key={article.id} href={"/music/" + article.slug} style={{ textDecoration: "none", display: "block" }}>
                    <div style={{ aspectRatio: "4/3", overflow: "hidden", borderRadius: "8px", backgroundColor: BG_CARD, marginBottom: "10px", position: "relative" }}>
                      {article.featured_image ? (
                        <img src={article.featured_image} alt={article.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", backgroundColor: BG_CARD }} />
                      )}
                    </div>
                    {tag && <span style={{ fontFamily: FONT, fontSize: "9px", fontWeight: 700, color: GREEN, border: "1px solid " + GREEN, padding: "2px 8px", borderRadius: "20px", display: "inline-block", marginBottom: "5px" }}>{tag}</span>}
                    <h3 className="lc2" style={{ fontFamily: FONT, fontWeight: 700, fontSize: "13px", color: TEXT, lineHeight: 1.9, margin: "0 0 4px" }}>{article.title}</h3>
                  </Link>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", paddingTop: "2rem", marginTop: "2rem", borderTop: "0.5px solid " + DIVIDER }}>
                {page > 1 && (
                  <a href={"/music/archive?page=" + (page - 1)} style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: GREEN, textDecoration: "none", padding: "6px 14px", border: "0.5px solid " + GREEN, borderRadius: "6px" }}>
                    {"← ކުރީ"}
                  </a>
                )}
                <span style={{ fontFamily: FONT, fontSize: "12px", color: TEXT_MUTED }}>{page + " / " + totalPages}</span>
                {page < totalPages && (
                  <a href={"/music/archive?page=" + (page + 1)} style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: GREEN, textDecoration: "none", padding: "6px 14px", border: "0.5px solid " + GREEN, borderRadius: "6px" }}>
                    {"ފަހަތް →"}
                  </a>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
