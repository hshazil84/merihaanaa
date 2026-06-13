import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface PageProps {
  searchParams: { page?: string };
}

const PAGE_SIZE = 12;

const RED = "#ba2a31";
const FONT = '"MVTypewriter","Noto Sans Thaana",sans-serif';
const FONT_DISPLAY = '"SanguSuruhee","MVTypewriter","Noto Sans Thaana",sans-serif';
const BG = "#F5F3EF";
const BG_CARD = "#EBE8E1";
const TEXT = "rgb(26,26,26)";
const TEXT_MUTED = "rgb(140,138,132)";
const DIVIDER = "rgba(0,0,0,0.07)";

const CSS = [
  ".reviews-grid{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:1.25rem;}",
  ".lc2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}",
  ".lc3{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}",
  "@media(max-width:1024px){.reviews-grid{grid-template-columns:1fr 1fr 1fr!important;}}",
  "@media(max-width:768px){.reviews-grid{grid-template-columns:1fr 1fr!important;}}",
  "@media(max-width:480px){.reviews-grid{grid-template-columns:1fr!important;}}",
].join("");

function hasTag(tags: any[] | null, name: string): boolean {
  if (!tags || !Array.isArray(tags)) return false;
  return tags.some(function (raw) {
    const val = typeof raw === "string" ? raw : raw && typeof raw === "object" ? raw.name : null;
    return typeof val === "string" && val.toLowerCase() === name.toLowerCase();
  });
}

export async function generateMetadata() {
  return {
    title: "ފިލްމު ރިވިއު",
    description: "ފިލްމު ރިވިއު - މެރިހާނާ",
  };
}

export default async function FilmReviewsPage({ searchParams }: PageProps) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));
  const supabase = await createServerSupabaseClient();

  const { data: category } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("slug", "film")
    .single();

  if (!category) notFound();

  // Fetch a wider window of recent film articles, then filter by the
  // ރިވިއު tag client-side (tags are stored as JSON, not relational).
  const { data: articlesRaw } = await supabase
    .from("articles")
    .select(
      "id, title, slug, excerpt, featured_image, cover_portrait_url, reading_time_minutes, published_at, tags, author:authors!author_id(full_name), category:categories!category_id(name, slug)"
    )
    .eq("status", "published")
    .eq("category_id", category.id)
    .order("published_at", { ascending: false })
    .limit(500);

  const allReviews = (articlesRaw ?? []).filter((a: any) => hasTag(a.tags, "ރިވިއު"));

  const total = allReviews.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = (page - 1) * PAGE_SIZE;
  const reviews = allReviews.slice(from, from + PAGE_SIZE);

  return (
    <div style={{ backgroundColor: BG, minHeight: "100vh" }} dir="rtl">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header style={{ maxWidth: "72rem", margin: "0 auto", padding: "1.5rem 1.5rem 0" }}>
        <div style={{ fontFamily: FONT, fontSize: "12px", color: TEXT_MUTED, display: "flex", alignItems: "center", gap: "6px", justifyContent: "center" }}>
          <Link href="/film" style={{ color: TEXT_MUTED, textDecoration: "none" }}>ފިލްމް</Link>
          <span>{"<"}</span>
          <span style={{ color: RED, fontWeight: 700 }}>ރިވިއު</span>
        </div>
      </header>

      <header style={{ maxWidth: "72rem", margin: "0 auto", padding: "1rem 1.5rem 1.5rem", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
          <span style={{ color: "rgba(0,0,0,0.18)", fontSize: "11px" }}>{"✦"}</span>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(2rem,5vw,3.5rem)", color: RED, lineHeight: 1.5, fontWeight: 400, margin: 0 }}>ފިލްމު ރިވިއު</h1>
          <span style={{ color: "rgba(0,0,0,0.18)", fontSize: "11px" }}>{"✦"}</span>
        </div>
      </header>

      <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "0 1.5rem 4rem" }}>
        {reviews.length === 0 ? (
          <p style={{ fontFamily: FONT, fontSize: "13px", color: TEXT_MUTED, textAlign: "center", padding: "3rem 0" }}>
            އަދި ރިވިއު ލިޔުމެއް ނެތް
          </p>
        ) : (
          <>
            <div className="reviews-grid">
              {reviews.map(function (article: any) {
                const slug = article.category?.slug ?? "film";
                const cover = article.cover_portrait_url || article.featured_image;
                return (
                  <Link key={article.id} href={"/" + slug + "/" + article.slug} style={{ textDecoration: "none", display: "block" }}>
                    <div style={{ aspectRatio: "3/4", overflow: "hidden", borderRadius: "10px", backgroundColor: BG_CARD, marginBottom: "10px", position: "relative" }}>
                      {cover ? (
                        <Image src={cover} alt={article.title} fill sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover" />
                      ) : (
                        <div style={{ width: "100%", height: "100%", backgroundColor: BG_CARD }} />
                      )}
                      <div style={{ position: "absolute", top: "10px", right: "10px" }}>
                        <span style={{ fontFamily: FONT, fontSize: "9px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px", background: RED, color: "white" }}>ރިވިއު</span>
                      </div>
                    </div>
                    <h3 style={{ fontFamily: FONT, fontWeight: 700, fontSize: "13px", color: TEXT, lineHeight: 1.9, margin: "0 0 5px" }} className="lc2">{article.title}</h3>
                    {article.excerpt && (
                      <p style={{ fontFamily: FONT, fontSize: "11px", color: TEXT_MUTED, lineHeight: 1.8, margin: 0 }} className="lc3">{article.excerpt}</p>
                    )}
                  </Link>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", paddingTop: "2rem", marginTop: "2rem", borderTop: "0.5px solid " + DIVIDER }}>
                {page > 1 && (
                  <a href={"/film/reviews?page=" + (page - 1)} style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: RED, textDecoration: "none", padding: "6px 14px", border: "0.5px solid " + RED, borderRadius: "6px" }}>
                    {"← ކުރީ"}
                  </a>
                )}
                <span style={{ fontFamily: FONT, fontSize: "12px", color: TEXT_MUTED }}>{page + " / " + totalPages}</span>
                {page < totalPages && (
                  <a href={"/film/reviews?page=" + (page + 1)} style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 700, color: RED, textDecoration: "none", padding: "6px 14px", border: "0.5px solid " + RED, borderRadius: "6px" }}>
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
