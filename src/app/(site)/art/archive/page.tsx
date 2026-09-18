import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { StandardArticleCard } from "../../_components/StandardArticleCard";
import { getFirstTag } from "@/lib/tags";

interface PageProps {
  searchParams: { page?: string };
}

const PAGE_SIZE = 12;
const VIOLET = "rgb(122,74,163)";
const FONT = '"MVTypewriter","Noto Sans Thaana",sans-serif';
const FONT_DISPLAY = '"SanguSuruhee","MVTypewriter","Noto Sans Thaana",sans-serif';
const BG = "#F5F3EF";
const TEXT_MUTED = "rgb(160,158,152)";
const DIVIDER = "rgba(0,0,0,0.07)";

const CSS = [
  ".archive-grid{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:1.25rem;}",
  "@media(max-width:1024px){.archive-grid{grid-template-columns:1fr 1fr 1fr!important;}}",
  "@media(max-width:768px){.archive-grid{grid-template-columns:1fr 1fr!important;}}",
  "@media(max-width:480px){.archive-grid{grid-template-columns:1fr!important;}}",
].join("");

export default async function ArtArchivePage({ searchParams }: PageProps) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));
  const supabase = await createServerSupabaseClient();

  const { data: category } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("slug", "art")
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
          <Link href="/art" style={{ color: TEXT_MUTED, textDecoration: "none" }}>{category.name}</Link>
          <span>{"<"}</span>
          <span style={{ color: VIOLET, fontWeight: 700 }}>ލިޔުންތައް</span>
        </div>
      </header>

      <header style={{ maxWidth: "84rem", margin: "0 auto", padding: "1rem 1.5rem 1.5rem", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
          <span style={{ color: "rgba(0,0,0,0.18)", fontSize: "11px" }}>{"✦"}</span>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(2rem,5vw,3.5rem)", color: VIOLET, lineHeight: 1.5, fontWeight: 400, margin: 0 }}>
            {category.name} ލިޔުންތައް
          </h1>
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
              {articles.map((article: any) => (
                <StandardArticleCard
                  key={article.id}
                  href={"/" + category.slug + "/" + article.slug}
                  title={article.title}
                  excerpt={article.excerpt}
                  featuredImage={article.featured_image}
                  badgeLabel={getFirstTag(article.tags)}
                  imageSizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 22vw"
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", paddingTop: "2rem", marginTop: "2rem", borderTop: "0.5px solid " + DIVIDER }}>
                {page > 1 && (
                  <a href={"/art/archive?page=" + (page - 1)} style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: VIOLET, textDecoration: "none", padding: "6px 14px", border: "0.5px solid " + VIOLET, borderRadius: "6px" }}>
                    {"← ކުރީ"}
                  </a>
                )}
                <span style={{ fontFamily: FONT, fontSize: "12px", color: TEXT_MUTED }}>{page + " / " + totalPages}</span>
                {page < totalPages && (
                  <a href={"/art/archive?page=" + (page + 1)} style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: VIOLET, textDecoration: "none", padding: "6px 14px", border: "0.5px solid " + VIOLET, borderRadius: "6px" }}>
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
