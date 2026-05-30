import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import ArticleBody from "@/components/public/ArticleBody";
import SocialShare from "@/components/public/SocialShare";

interface PageProps {
  params: { slug: string };
}

const DHIVEHI_MONTHS: Record<number, string> = {
  1: "ޖެނުއަރީ", 2: "ފެބްރުއަރީ", 3: "މާރިޗު", 4: "އޭޕްރީލް",
  5: "މެއި", 6: "ޖޫން", 7: "ޖުލައި", 8: "އޮގަސްޓް",
  9: "ސެޕްޓެމްބަރު", 10: "އޮކްޓޯބަރު", 11: "ނޮވެމްބަރު", 12: "ޑިސެމްބަރު",
};

function formatDhivehiDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${DHIVEHI_MONTHS[d.getMonth() + 1]} ${d.getFullYear()}`;
}

const STATUS_COLORS: Record<string, string> = {
  draft:     "#f59e0b",
  scheduled: "#3b82f6",
  published: "#22c55e",
  archived:  "#6b7280",
};

export default async function PreviewPage({ params }: PageProps) {
  const supabase = await createServerSupabaseClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("user_profiles").select("role").eq("id", session.user.id).single();
  if (!profile || !["admin", "editor", "author"].includes(profile.role)) redirect("/");

  const { data: article } = await supabase
    .from("articles")
    .select(`
      id, title, slug, excerpt, body,
      featured_image, cover_type, cover_url,
      cover_video_id, cover_video_provider, cover_video_thumbnail,
      featured_image_caption, reading_time_minutes,
      published_at, created_at, status, tags,
      category:categories!category_id(id, name, slug),
      author:authors!author_id(full_name, id)
    `)
    .eq("slug", params.slug)
    .single();

  if (!article) notFound();

  const category = article.category as any;
  const author   = article.author as any;
  const statusColor = STATUS_COLORS[article.status] ?? STATUS_COLORS.draft;

  const coverImage =
    article.cover_type === "image"
      ? article.cover_url || article.featured_image
      : article.cover_type === "video"
      ? article.cover_video_thumbnail
      : null;

  const displayDate = article.published_at
    ? formatDhivehiDate(article.published_at)
    : formatDhivehiDate(article.created_at);

  return (
    <div className="bg-[#F5F3EF] min-h-screen" dir="rtl">

      {/* Preview banner */}
      <div style={{ backgroundColor: "rgb(26,26,26)", padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            padding: "3px 10px", borderRadius: "999px",
            backgroundColor: `${statusColor}20`,
            border: `1px solid ${statusColor}40`,
            fontFamily: '"MVTypewriter", sans-serif', fontSize: "11px", color: statusColor,
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: statusColor, display: "inline-block" }} />
            {article.status}
          </span>
          <span style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>
            ޕްރިވިއު
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link href="/admin/articles" style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "11px", color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>
            ← ލިޔުންތައް
          </Link>
          <Link href={`/admin/articles/${article.id}`} style={{
            fontFamily: '"MVTypewriter", sans-serif', fontSize: "11px", fontWeight: 700,
            color: "rgb(255,255,255)", backgroundColor: "rgba(255,255,255,0.12)",
            padding: "6px 14px", borderRadius: "8px", textDecoration: "none",
          }}>
            އެޑިޓް
          </Link>
        </div>
      </div>

      {/* Article header */}
      <header className="max-w-3xl mx-auto px-6 pt-8 pb-6 text-center">
        {category && (
          <div className="mb-5 flex justify-center">
            <span className="inline-block text-[11px] px-3 py-1 rounded-full border" style={{
              fontFamily: "'MVTypewriter', sans-serif",
              color: "rgb(100,100,100)", borderColor: "rgb(210,207,200)",
              backgroundColor: "rgb(240,239,233)", lineHeight: 2,
            }}>
              {category.name}
            </span>
          </div>
        )}
        <h1 className="mb-4" style={{
          fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
          fontWeight: 700, fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
          color: "rgb(26,26,26)", lineHeight: 1.8, textAlign: "center",
        }}>
          {article.title}
        </h1>
        {article.excerpt && (
          <p style={{
            fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
            fontWeight: 400, fontSize: "16px",
            color: "rgb(100,98,92)", lineHeight: 2, textAlign: "center",
          }}>
            {article.excerpt}
          </p>
        )}
      </header>

      {/* Cover */}
      {coverImage && (
        <div className="w-full mb-6">
          <div className="max-w-4xl mx-auto px-4">
            <div className="overflow-hidden rounded-xl" style={{ aspectRatio: "16/9" }}>
              <img src={coverImage} alt={article.title} className="w-full h-full object-cover" />
            </div>
            {article.featured_image_caption && (
              <p className="text-center mt-2" style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "11px", color: "rgb(160,158,152)", lineHeight: 2 }}>
                {article.featured_image_caption}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Byline */}
      <div className="max-w-3xl mx-auto px-6 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-3 py-4 border-t border-b border-black/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgb(210,207,200)" }}>
              <span style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "11px", color: "rgb(100,98,92)" }}>
                {author?.full_name?.[0] ?? "M"}
              </span>
            </div>
            <div>
              {author?.full_name && (
                <p style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontSize: "12px", fontWeight: 700, color: "rgb(26,26,26)", lineHeight: 1.4 }}>
                  {author.full_name}
                </p>
              )}
              <p style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontSize: "10px", color: "rgb(160,158,152)", lineHeight: 1.4 }}>
                {displayDate}
              </p>
            </div>
          </div>
          {article.reading_time_minutes && (
            <span style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontSize: "11px", color: "rgb(160,158,152)", lineHeight: 2 }}>
              {article.reading_time_minutes} މިނެޓު
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-6 pb-12">
        <ArticleBody body={article.body} />
      </div>

      {/* Tags */}
      {Array.isArray(article.tags) && article.tags.length > 0 && (
        <div className="max-w-3xl mx-auto px-6 pb-10">
          <div className="flex flex-wrap gap-2 pt-6 border-t border-black/10">
            {(article.tags as { name: string; slug: string }[]).map((tag) => (
              <span key={tag.slug} className="inline-block text-[11px] px-3 py-1 rounded-full border" style={{
                fontFamily: "'MVTypewriter', sans-serif",
                color: "rgb(100,100,100)", borderColor: "rgb(210,207,200)",
                backgroundColor: "rgb(240,239,233)", lineHeight: 2,
              }}>
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Bottom edit bar */}
      <div className="sticky bottom-0 border-t flex items-center justify-center gap-4 px-6 py-3" style={{ backgroundColor: "rgb(249,248,245)", borderColor: "rgb(224,221,214)" }}>
        <Link href={`/admin/articles/${article.id}`} style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          padding: "8px 20px", borderRadius: "12px",
          backgroundColor: "rgb(26,26,26)", color: "rgb(249,248,245)",
          fontFamily: '"MVTypewriter", sans-serif', fontSize: "13px", fontWeight: 700,
          textDecoration: "none",
        }}>
          ✏️ އެޑިޓް
        </Link>
        <span style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "11px", color: "rgb(160,158,152)" }}>
          މި ޕޭޖް ލައިވް ނޫން
        </span>
      </div>

    </div>
  );
}
