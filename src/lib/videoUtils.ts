// lib/videoUtils.ts
// Vimeo + YouTube: URL parsing, oEmbed metadata fetch

export type VideoProvider = "vimeo" | "youtube";

export interface VideoMeta {
  provider: VideoProvider;
  videoId: string;
  title: string;
  thumbnailUrl: string;
  embedUrl: string;
  authorName?: string;
}

// ── URL parsing ───────────────────────────────────────────

export function extractVimeoId(url: string): string | null {
  const patterns = [
    /vimeo\.com\/(\d+)/,
    /vimeo\.com\/video\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function detectVideoProvider(url: string): VideoProvider | null {
  if (url.includes("vimeo.com") || url.includes("player.vimeo.com")) return "vimeo";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  return null;
}

// ── oEmbed fetch ──────────────────────────────────────────

export async function fetchVideoMeta(url: string): Promise<VideoMeta> {
  const provider = detectVideoProvider(url);
  if (!provider) throw new Error("ސަޕޯޓް ނުކުރާ ވީޑިއޯ ލިންކެއް");

  if (provider === "vimeo") {
    const videoId = extractVimeoId(url);
    if (!videoId) throw new Error("ވީޑިއޯ ID ނުލިބުނު");

    const res = await fetch(
      `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}&width=1280`
    );
    if (!res.ok) throw new Error("ވީޑިއޯ މަޢުލޫމާތު ލިބޭ ގޮތް ނުވި");
    const data = await res.json();

    return {
      provider: "vimeo",
      videoId,
      title: data.title ?? "",
      thumbnailUrl: data.thumbnail_url ?? "",
      embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=0&title=0&byline=0&portrait=0`,
      authorName: data.author_name,
    };
  }

  // YouTube
  const videoId = extractYouTubeId(url);
  if (!videoId) throw new Error("ވީޑިއޯ ID ނުލިބުނު");

  // YouTube oEmbed (thumbnail only — no API key needed)
  const res = await fetch(
    `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
  );
  if (!res.ok) throw new Error("ވީޑިއޯ މަޢުލޫމާތު ލިބޭ ގޮތް ނުވި");
  const data = await res.json();

  return {
    provider: "youtube",
    videoId,
    title: data.title ?? "",
    // Use maxresdefault for highest quality thumbnail
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    embedUrl: `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`,
    authorName: data.author_name,
  };
}

// ── Embed URL builders (for rendering on article page) ────

export function buildEmbedUrl(provider: VideoProvider, videoId: string): string {
  if (provider === "vimeo") {
    return `https://player.vimeo.com/video/${videoId}?autoplay=0&title=0&byline=0&portrait=0`;
  }
  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
}
