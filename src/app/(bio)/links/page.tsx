import { createServerSupabaseClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";

export const metadata = {
  title: "މެރިހާނާ — ލިންކްސް",
  robots: { index: false, follow: false },
};

type LinkArticle = {
  id: string;
  title: string;
  slug: string;
  cover_url: string | null;
  cover_portrait_url: string | null;
  featured_image: string | null;
  category: { slug: string } | null;
};

async function getLatestArticles(): Promise<LinkArticle[]> {
  noStore();
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("articles")
    .select(
      "id, title, slug, cover_url, cover_portrait_url, featured_image, published_at, category:categories!category_id(slug)"
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(9);

  return (data as unknown as LinkArticle[]) ?? [];
}

const WHATSAPP_URL = "https://wa.me/9607718184";
const FACEBOOK_URL = "https://www.facebook.com/Merihaanaadotcom/";
const WEBSITE_URL = "https://www.merihaanaa.com";

export default async function LinksPage() {
  const articles = await getLatestArticles();

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "rgb(249,248,245)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "32px 16px 48px",
      }}
    >
      {/* Header */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          overflow: "hidden",
          marginBottom: 12,
          background: "#000",
        }}
      >
        <img
          src="/logo.png"
          alt="Merihaanaa"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
      <h1
        style={{
          fontFamily: "'SanguSuruhee','Noto Sans Thaana',sans-serif",
          fontSize: 24,
          fontWeight: 400,
          color: "rgb(26,26,26)",
          margin: "0 0 4px",
        }}
      >
        މެރިހާނާ
      </h1>
      <p
        style={{
          fontFamily: "'MVTypewriter','Noto Sans Thaana',sans-serif",
          fontSize: 13,
          color: "rgba(0,0,0,0.5)",
          margin: "0 0 24px",
          textAlign: "center",
        }}
      >
        އެންމެ ފަހުގެ ލިޔުންތައް ބަލާލުމަށް ތިރީގައިވާ ފޮޓޯއަކަށް ފިތާލާ
      </p>

      {/* 3x3 grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 4,
          width: "100%",
          maxWidth: 480,
        }}
      >
        {articles.map((article) => {
          const image =
            article.cover_portrait_url || article.cover_url || article.featured_image;
          const categorySlug = article.category?.slug;
          if (!categorySlug) return null;
          return (
            <a
              key={article.id}
              href={"/" + categorySlug + "/" + article.slug}
              style={{
                position: "relative",
                display: "block",
                aspectRatio: "1/1",
                overflow: "hidden",
                background: "rgb(230,228,222)",
              }}
            >
              {image && (
                <img
                  src={image}
                  alt=""
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              )}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 55%)",
                }}
              />
              <p
                style={{
                  position: "absolute",
                  bottom: 8,
                  right: 8,
                  left: 8,
                  margin: 0,
                  color: "#fff",
                  fontFamily: "'MVTypewriter','Noto Sans Thaana',sans-serif",
                  fontSize: 11,
                  lineHeight: 1.6,
                  fontWeight: 700,
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {article.title}
              </p>
            </a>
          );
        })}
      </div>

      {/* Utility links */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          width: "100%",
          maxWidth: 480,
          marginTop: 28,
        }}
      >
        {[
          { href: WEBSITE_URL, label: "މެރިހާނާ ވެބްސައިޓް" },
          { href: WHATSAPP_URL, label: "ވަޓްސްއެޕުން ގުޅާލާ" },
          { href: FACEBOOK_URL, label: "ފޭސްބުކުން ފޮލޯކުރޭ" },
        ].map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              textAlign: "center",
              padding: "14px 16px",
              borderRadius: 999,
              border: "1.5px solid rgba(0,0,0,0.13)",
              background: "#fff",
              color: "rgb(26,26,26)",
              fontFamily: "'MVTypewriter','Noto Sans Thaana',sans-serif",
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}
