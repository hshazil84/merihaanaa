// lib/socialUtils.ts
// oEmbed fetching for social embeds: X/Twitter, Instagram, TikTok

export type SocialProvider = "twitter" | "instagram" | "tiktok";

export interface SocialMeta {
  provider: SocialProvider;
  url: string;
  html: string;        // oEmbed HTML for rendering on article page
  authorName: string;
  authorHandle: string;
  text: string;        // post text preview
  thumbnailUrl: string | null;
}

// ── URL detection ─────────────────────────────────────────

export function detectSocialProvider(url: string): SocialProvider | null {
  if (url.includes("twitter.com") || url.includes("x.com")) return "twitter";
  if (url.includes("instagram.com")) return "instagram";
  if (url.includes("tiktok.com")) return "tiktok";
  return null;
}

// ── oEmbed fetch ──────────────────────────────────────────

export async function fetchSocialMeta(url: string): Promise<SocialMeta> {
  const provider = detectSocialProvider(url);
  if (!provider) throw new Error("ސަޕޯޓް ނުކުރާ ސޯޝަލް ލިންކެއް");

  if (provider === "twitter") {
    const res = await fetch(
      `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true&dnt=true`
    );
    if (!res.ok) throw new Error("X ޕޯސްޓް ލިބޭ ގޮތް ނުވި — ލިންކް ރަނގަޅުތޯ ބަލާ");
    const data = await res.json();
    return {
      provider: "twitter",
      url,
      html: data.html ?? "",
      authorName: data.author_name ?? "",
      authorHandle: `@${data.author_name ?? ""}`,
      text: extractTextFromHtml(data.html ?? ""),
      thumbnailUrl: null,
    };
  }

  if (provider === "instagram") {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/instagram_oembed?url=${encodeURIComponent(url)}&omitscript=true`
    );
    if (!res.ok) throw new Error("Instagram ޕޯސްޓް ލިބޭ ގޮތް ނުވި — ލިންކް ރަނގަޅުތޯ ބަލާ");
    const data = await res.json();
    return {
      provider: "instagram",
      url,
      html: data.html ?? "",
      authorName: data.author_name ?? "",
      authorHandle: `@${data.author_name ?? ""}`,
      text: data.title ?? "",
      thumbnailUrl: data.thumbnail_url ?? null,
    };
  }

  // TikTok
  const res = await fetch(
    `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`
  );
  if (!res.ok) throw new Error("TikTok ވީޑިއޯ ލިބޭ ގޮތް ނުވި — ލިންކް ރަނގަޅުތޯ ބަލާ");
  const data = await res.json();
  return {
    provider: "tiktok",
    url,
    html: data.html ?? "",
    authorName: data.author_name ?? "",
    authorHandle: `@${data.author_unique_id ?? data.author_name ?? ""}`,
    text: data.title ?? "",
    thumbnailUrl: data.thumbnail_url ?? null,
  };
}

// ── Helpers ───────────────────────────────────────────────

function extractTextFromHtml(html: string): string {
  // Strip HTML tags to get plain text preview
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200);
}

export const SOCIAL_CONFIG: Record<SocialProvider, { label: string; color: string; icon: string }> = {
  twitter:   { label: "X (Twitter)", color: "#000000", icon: "𝕏" },
  instagram: { label: "Instagram",   color: "#E1306C", icon: "📸" },
  tiktok:    { label: "TikTok",      color: "#010101", icon: "🎵" },
};
