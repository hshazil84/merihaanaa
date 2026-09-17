import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { StandardArticleCard } from "../../_components/StandardArticleCard";

interface PageProps {
  searchParams: { page?: string; type?: string };
}

const PAGE_SIZE = 12;

const TEAL = "rgb(20,110,110)";
const FONT = '"MVTypewriter","Noto Sans Thaana",sans-serif';
const FONT_DISPLAY = '"SanguSuruhee","MVTypewriter","Noto Sans Thaana",sans-serif';
const BG = "#F4F7F6";
const TEXT_MUTED = "rgb(140,138,132)";
const DIVIDER = "rgba(0,0,0,0.07)";

const TYPE_LABELS: Record<string, string> = { resort: "ރިސޯޓް", guesthouse: "ގެސްޓްހައުސް", liveaboard: "ލިވްއަބޯޑް" };

const CSS = [
  ".archive-grid{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:1.25rem;}",
  "@media(max-width:1024px){.archive-grid{grid-template-columns:1fr 1fr 1fr!important;}}",
  "@media(max-width:768px){.archive-grid{grid-template-columns:1fr 1fr!important;}}",
  "@media(max-width:480px){.archive-grid{grid-template-columns:1fr!important;}}",
].join("");

export async function generateMetadata() {
  return {
    title: "ދަތުރު ލިޔުންތައް",
    description: "ދަތުރު ލިޔުންތައް - މެރިހާނާ",
  };
}

export default async function DhathuruArchivePage({ searchParams }: PageProps) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));
  const supabase = await createServerSupabaseClient();

  const { data: category } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("slug", "dhathuru")
    .single();

  if (!category) notFound();

  const activeType = ["resort", "guesthouse", "liveaboard"].includes(searchParams.type ?? "")
    ? (searchParams.type as "resort" | "guesthouse" | "liveaboard")
    : null;

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("articles")
    .select(
      "id, title, slug, excerpt, featured_image, review_score, review_subject, review_area, review_type, published_at",
      { count: "exact" }
    )
    .eq("status", "published")
    .eq("category_id", category.id)
    .order("published_at", { ascending: false })
    .range(from, to);

  if (activeType) query = query.eq("review_type", activeType);

  const { data: articlesRaw, count } = await query;
  const articles = articlesRaw ?? [];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const pageHref = (p: number) =>
    "/dhathuru/archive?page=" + p + (activeType ? "&type=" + activeType : "");

  return (
    <div style={{ backgroundColor: BG, minHeight: "100vh" }} dir="rtl">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header style={{ maxWidth: "84rem", margin: "0 auto", padding: "1.5rem 1.5rem 0" }}>
        <div style={{ fontFamily: FONT, fontSize: "12px", color: TEXT_MUTED, display: "flex", alignItems: "center", gap: "6px", justifyContent: "center" }}>
          <Link href="/dhathuru" style={{ color: TEXT_MUTED, textDecoration: "none" }}>ދަތުރު</Link>
          <span>{"<"}</span>
          <span style={{ color: TEAL, fontWeight: 700 }}>ލިޔުންތައް</span>
        </div>
      </header>

      <header style={{ maxWidth: "84rem", margin: "0 auto", padding: "1rem 1.5rem 1.5rem", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
          <span style={{ color: "rgba(0,0,0,0.18)", fontSize: "11px" }}>{"✦"}</span>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(2rem,5vw,3.5rem)", color: TEAL, lineHeight: 1.5, fontWeight: 400, margin: 0 }}>ދަތުރު ލިޔުންތައް</h1>
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
                    href={"/dhathuru/" + article.slug}
                    title={article.review_subject || article.title}
                    excerpt={article.excerpt}
                    featuredImage={article.featured_image}
                    badgeLabel={article.review_type ? (TYPE_LABELS[article.review_type] ?? article.review_type) : null}
                    eyebrow={article.review_area || null}
                    imageSizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 22vw"
                  />
                );
              })}
            </div>

            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", paddingTop: "2rem", marginTop: "2rem", borderTop: "0.5px solid " + DIVIDER }}>
                {page > 1 && (
                  <a href={pageHref(page - 1)} style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: TEAL, textDecoration: "none", padding: "6px 14px", border: "0.5px solid " + TEAL, borderRadius: "6px" }}>
                    {"← ކުރީ"}
                  </a>
                )}
                <span style={{ fontFamily: FONT, fontSize: "12px", color: TEXT_MUTED }}>{page + " / " + totalPages}</span>
                {page < totalPages && (
                  <a href={pageHref(page + 1)} style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: TEAL, textDecoration: "none", padding: "6px 14px", border: "0.5px solid " + TEAL, borderRadius: "6px" }}>
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
