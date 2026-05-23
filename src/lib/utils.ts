import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ── CLASS NAME HELPER ─────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── READING TIME ──────────────────────────────────────────
// Thaana reading speed ~150 words/min

export function calculateReadingTime(body: Record<string, unknown> | null): number {
  if (!body) return 1;

  let text = "";

  function extractText(node: any): void {
    if (node.type === "text" && node.text) {
      text += node.text + " ";
    }
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(extractText);
    }
  }

  extractText(body);

  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / 150);
  return Math.max(1, minutes);
}

// Format reading time in Thaana
export function formatReadingTime(minutes: number): string {
  if (minutes === 1) return "١ ދަޤީޤާ";
  return `${minutes} ދަޤީޤާ`;
}

// ── DATE FORMATTING ───────────────────────────────────────

export function formatDate(date: string | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("dv-MV", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatRelativeTime(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "ދެންމެ";
  if (diffMins < 60) return `${diffMins} ދަޤީޤާ ކުރިން`;
  if (diffHours < 24) return `${diffHours} ގަޑި ކުރިން`;
  if (diffDays < 7) return `${diffDays} ދުވަސް ކުރިން`;
  return formatDate(date);
}

// ── SLUG ─────────────────────────────────────────────────

export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\u0600-\u06FF]/g, (char) => char) // Keep Thaana/Arabic
    .replace(/[^\w\s\u0600-\u06FF-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ── TRUNCATE ──────────────────────────────────────────────

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + "...";
}

// ── CLOUDFLARE R2 URL ────────────────────────────────────

export function getMediaUrl(path: string | null): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${process.env.NEXT_PUBLIC_APP_URL}/api/media/${path}`;
}

// ── CLOUDFLARE STREAM URL ─────────────────────────────────

export function getStreamUrl(streamId: string): string {
  return `https://customer-${process.env.CLOUDFLARE_STREAM_CUSTOMER_ID}.cloudflarestream.com/${streamId}/manifest/video.m3u8`;
}

export function getStreamThumbnail(streamId: string): string {
  return `https://customer-${process.env.CLOUDFLARE_STREAM_CUSTOMER_ID}.cloudflarestream.com/${streamId}/thumbnails/thumbnail.jpg`;
}

// ── HOMEPAGE PLACEMENT LABELS (Thaana) ───────────────────

export const PLACEMENT_LABELS: Record<string, string> = {
  hero:           "ހީރޯ",
  editors_choice: "އެޑިޓަރ ޗޮއިސް",
  review:         "ރިވިއު",
  reel:           "ރީލް",
};

// ── STATUS LABELS (Thaana) ────────────────────────────────

export const STATUS_LABELS: Record<string, string> = {
  published: "ލައިވް",
  draft:     "ޑްރާފްޓް",
  scheduled: "އެޑްމިން",
};

// ── ROLE LABELS (Thaana) ──────────────────────────────────

export const ROLE_LABELS: Record<string, string> = {
  admin:       "އެޑްމިން",
  editor:      "އެޑިޓަރ",
  author:      "ލިޔުންތެރިޔާ",
  reader:      "ކިޔުންތެރިޔާ",
  writer:      "ލިޔުންތެރިޔާ",
  contributor: "ހިއްސާ ކުރި",
  photographer:"ފޮޓޯގްރާފަރ",
};

// ── CONTENT TYPE LABELS (Thaana) ──────────────────────────

export const CONTENT_TYPE_LABELS: Record<string, string> = {
  article:     "ލިޔުން",
  review:      "ރިވިއު",
  interview:   "އިންޓަވިއު",
  photo_essay: "ފޮޓޯ ލިޔުން",
  fiction:     "ވާހަކަ",
};
