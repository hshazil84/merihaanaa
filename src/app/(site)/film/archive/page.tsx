import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { StandardArticleCard } from "../../_components/StandardArticleCard";
import { getFirstTag, hasTag } from "@/lib/tags";

interface PageProps {
  searchParams: { page?: string };
}

const PAGE_SIZE = 12;

const RED = "#ba2a31";
const FONT = '"MVTypewriter","Noto Sans Thaana",sans-serif';
const FONT_DISPLAY = '"SanguSuruhee","MVTypewriter","Noto Sans Thaana",sans-serif';
const BG = "#F5F3EF";
const TEXT_MUTED = "rgb(140,138,132)";
const DIVIDER = "rgba(0,0,0,0.07)";

const CSS = [
  ".archive-grid{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:1.25rem;}",
  "@media(max-width:1024px){.archive-grid{grid-template-columns:1fr 1fr 1fr!important;}}",
  "@media(max-width:768px){.archive-grid{grid-template-columns:1fr 1fr!important;}}",
  "@media(max-width:480px){.archive-grid{grid-template-columns:1fr!important;}}",
].join("");

export async function generateMetadata() {
  return {
    title: "ފިލްމު ލިޔުންތައް",
    description: "ފިލްމު ލިޔުންތައް - މެރިހާނާ",
  };
}

export default async function FilmArchivePage({ searchParams }: PageProps) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));
  const supabase = await createServerSupabaseClient();

  const { data: category } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("slug", "film")
    .single();

  if (!category) notFound();

  const { data: articlesRaw } = await supabase
    .from("articles")
    .select(
      "id, title, slug, excerpt, featured_image, cover_portrait_url, reading_time_minutes, published_at, tags, view_count, author:authors!author_id(full_name), category:categories!category_id(name, slug)"
    )
    .eq("status", "published")
    .eq("category_id", category.id)
    .order("published_at", { ascending: false })
    .limit(500);

  const allArticles = (articlesRaw ?? []).filter((a: any) => !hasTag(a.tags, "ރިވިއު"));

  const total = allArticles.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = (page - 1) * PAGE_SIZE;
  const articles = allArticles.slice(from, from + PAGE_SIZE);

  return (
    <div style={{ backgroundColor: BG, minHeight: "100vh" }} dir="rtl">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header style={{ maxWidth: "84rem", margin: "0 auto", padding: "1.5rem 1.5rem 0" }}>
        <div style={{ fontFamily: FONT, fontSize: "12px", color: TEXT_MUTED, display: "flex", alignItems: "center", gap: "6px", justifyContent: "center" }}>
          <Link href="/film" style={{ color: TEXT_MUTED, textDecoration: "none" }}>ފިލްމް</Link>
          <span>{"<"}</span>
          <span style={{ color: RED, fontWeight: 700 }}>ލިޔުންތައް</span>
        </div>
      </header>

      <header style={{ maxWidth: "84rem", margin: "0 auto", padding: "1rem 1.5rem 1.5rem", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
          <span style={{ color: "rgba(0,0,0,0.18)", fontSize: "11px" }}>{"✦"}</span>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(2rem,5vw,3.5rem)", color: RED, lineHeight: 1.5, fontWeight: 400, margin: 0 }}>ފިލްމު ލިޔުންތައް</h1>
          <span style={{ color: "rgba(0,0,0,0.18)", fontSize: "11px" }}>{"✦"}</span>
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
                return (
                  <StandardArticleCard
                    key={article.id}
                    href={"/" + (article.category?.slug ?? "film") + "/" + article.slug}
                    title={article.title}
                    excerpt={article.excerpt}
                    featuredImage={article.featured_image}
                    badgeLabel={getFirstTag(article.tags)}
                    imageSizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 22vw"
                  />
                );
              })}
            </div>

            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", paddingTop: "2rem", marginTop: "2rem", borderTop: "0.5px solid " + DIVIDER }}>
                {page > 1 && (
                  <a href={"/film/archive?page=" + (page - 1)} style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: RED, textDecoration: "none", padding: "6px 14px", border: "0.5px solid " + RED, borderRadius: "6px" }}>
                    {"← ކުރީ"}
                  </a>
                )}
                <span style={{ fontFamily: FONT, fontSize: "12px", color: TEXT_MUTED }}>{page + " / " + totalPages}</span>
                {page < totalPages && (
                  <a href={"/film/archive?page=" + (page + 1)} style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: RED, textDecoration: "none", padding: "6px 14px", border: "0.5px solid " + RED, borderRadius: "6px" }}>
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
