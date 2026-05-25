// app/api/og-preview/route.ts
// Platform-specific preview fetcher
// X: Twitter oEmbed (public) · Instagram: URL parse fallback · TikTok: oEmbed (public)

import { NextRequest, NextResponse } from "next/server";

export interface OGPreviewResult {
  url: string;
  provider: "twitter" | "instagram" | "tiktok";
  // X / TikTok
  authorName: string | null;
  authorHandle: string | null;
  text: string | null;
  thumbnailUrl: string | null;
  // Instagram fallback
  instagramHandle: string | null;
}

function detectProvider(url: string): "twitter" | "instagram" | "tiktok" | null {
  if (url.includes("twitter.com") || url.includes("x.com")) return "twitter";
  if (url.includes("instagram.com")) return "instagram";
  if (url.includes("tiktok.com")) return "tiktok";
  return null;
}

function extractInstagramHandle(url: string): string | null {
  // https://www.instagram.com/p/ABC123/ or https://www.instagram.com/username/
  const match = url.match(/instagram\.com\/([^/?#]+)/);
  if (match && match[1] !== "p" && match[1] !== "reel") return `@${match[1]}`;
  // Try to get from /p/ post URL — extract from path
  const postMatch = url.match(/instagram\.com\/(?:p|reel)\/([^/?#]+)/);
  return postMatch ? null : null;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

  const provider = detectProvider(url);
  if (!provider) return NextResponse.json({ error: "Unsupported platform" }, { status: 400 });

  try {
    // ── X / Twitter ──────────────────────────────────────
    if (provider === "twitter") {
      const res = await fetch(
        `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true&dnt=true`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (!res.ok) throw new Error(`Twitter oEmbed: ${res.status}`);
      const data = await res.json();

      // Extract plain text from oEmbed HTML
      const html: string = data.html ?? "";
      const text = html
        .replace(/<a[^>]*>([^<]*)<\/a>/gi, "$1")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 280);

      const result: OGPreviewResult = {
        url,
        provider: "twitter",
        authorName: data.author_name ?? null,
        authorHandle: `@${data.author_name ?? ""}`,
        text,
        thumbnailUrl: null,
        instagramHandle: null,
      };
      return NextResponse.json(result, {
        headers: { "Cache-Control": "public, max-age=3600" },
      });
    }

    // ── Instagram ────────────────────────────────────────
    if (provider === "instagram") {
      // Instagram oEmbed requires FB token — use URL parse fallback
      const handle = extractInstagramHandle(url);
      const result: OGPreviewResult = {
        url,
        provider: "instagram",
        authorName: null,
        authorHandle: handle,
        text: null,
        thumbnailUrl: null,
        instagramHandle: handle,
      };
      return NextResponse.json(result, {
        headers: { "Cache-Control": "public, max-age=3600" },
      });
    }

    // ── TikTok ───────────────────────────────────────────
    if (provider === "tiktok") {
      const res = await fetch(
        `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (!res.ok) throw new Error(`TikTok oEmbed: ${res.status}`);
      const data = await res.json();

      const result: OGPreviewResult = {
        url,
        provider: "tiktok",
        authorName: data.author_name ?? null,
        authorHandle: data.author_unique_id ? `@${data.author_unique_id}` : null,
        text: data.title ?? null,
        thumbnailUrl: data.thumbnail_url ?? null,
        instagramHandle: null,
      };
      return NextResponse.json(result, {
        headers: { "Cache-Control": "public, max-age=3600" },
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Fetch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
