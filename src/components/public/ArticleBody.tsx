"use client";

import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Youtube from "@tiptap/extension-youtube";
import { Node, mergeAttributes } from "@tiptap/core";
import { useMemo, useEffect, useRef, useState } from "react";

interface Props {
  body: Record<string, unknown> | null;
}

const PullQuoteNode = Node.create({
  name: "pullQuote",
  group: "block",
  atom: true,
  addAttributes() { return { text: { default: "" }, author: { default: "" } }; },
  parseHTML() { return [{ tag: "div[data-pull-quote]" }]; },
  renderHTML({ HTMLAttributes }) {
    const { text, author } = HTMLAttributes;
    return [
      "div", mergeAttributes({ "data-pull-quote": "" }, { style: "margin:2.5rem auto;padding:0 2rem;text-align:center;max-width:600px;" }),
      ["p", { style: "font-family:'MVTypewriter','Noto Sans Thaana',sans-serif;font-size:1.35rem;font-weight:700;color:rgb(26,26,26);line-height:1.8;margin:0 0 0.5rem;" }, '"' + text + '"'],
      ...(author ? [["p", { style: "font-family:'MVTypewriter',sans-serif;font-size:11px;color:rgb(160,158,152);line-height:2;margin:0;" }, "— " + author]] : []),
    ];
  },
});

const InterviewNode = Node.create({
  name: "interview",
  group: "block",
  atom: true,
  addAttributes() { return { question: { default: "" }, answer: { default: "" } }; },
  parseHTML() { return [{ tag: "div[data-interview]" }]; },
  renderHTML({ HTMLAttributes }) {
    const { question, answer } = HTMLAttributes;
    return [
      "div", mergeAttributes({ "data-interview": "" }, { style: "margin:1.5rem 0;" }),
      ["div", { style: "background:rgb(240,239,233);border:1px solid rgb(224,221,214);border-radius:8px;padding:14px 18px;margin-bottom:8px;direction:rtl;" },
        ["p", { style: "font-family:'MVTypewriter',sans-serif;font-size:10px;font-weight:700;color:rgb(100,98,92);letter-spacing:0.05em;margin:0 0 4px;opacity:0.7;" }, "ސ"],
        ["p", { style: "font-family:'MVTypewriter','Noto Sans Thaana',sans-serif;font-size:15px;color:rgb(26,26,26);line-height:2;margin:0;" }, question],
      ],
      ["div", { style: "background:rgb(249,248,245);border:1px solid rgb(224,221,214);border-radius:8px;padding:14px 18px;direction:rtl;" },
        ["p", { style: "font-family:'MVTypewriter',sans-serif;font-size:10px;font-weight:700;color:rgb(100,98,92);letter-spacing:0.05em;margin:0 0 4px;opacity:0.7;" }, "ޖ"],
        ["p", { style: "font-family:'MVTypewriter','Noto Sans Thaana',sans-serif;font-size:15px;color:rgb(26,26,26);line-height:2;margin:0;" }, answer],
      ],
    ];
  },
});

const StyledBlockquoteNode = Node.create({
  name: "styledBlockquote",
  group: "block",
  atom: true,
  addAttributes() { return { text: { default: "" }, author: { default: "" } }; },
  parseHTML() { return [{ tag: "div[data-styled-blockquote]" }]; },
  renderHTML({ HTMLAttributes }) {
    const { text, author } = HTMLAttributes;
    return [
      "div", mergeAttributes({ "data-styled-blockquote": "" }, { style: "margin:1.5rem 0;padding:4px 20px 4px 0;border-right:2px solid rgba(0,0,0,0.5);direction:rtl;" }),
      ["p", { style: "font-family:'MVTypewriter','Noto Sans Thaana',sans-serif;font-size:16px;color:rgb(60,58,52);line-height:2;margin:0 0 4px;" }, text],
      ...(author ? [["p", { style: "font-family:'MVTypewriter',sans-serif;font-size:11px;color:rgb(160,158,152);line-height:2;margin:0;" }, "— " + author]] : []),
    ];
  },
});

const VimeoNode = Node.create({
  name: "vimeo",
  group: "block",
  atom: true,
  addAttributes() { return { videoId: { default: null }, caption: { default: "" } }; },
  parseHTML() { return [{ tag: "div[data-vimeo]" }]; },
  renderHTML({ HTMLAttributes }) {
    const { videoId, caption } = HTMLAttributes;
    return [
      "div", { "data-vimeo": "", style: "margin:1rem 0;" },
      ["div", { style: "position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;background:#000;" },
        ["iframe", { src: "https://player.vimeo.com/video/" + videoId, style: "position:absolute;top:0;left:0;width:100%;height:100%;border:0;", allowfullscreen: "true" }],
      ],
      ...(caption ? [["p", { style: "text-align:center;font-size:11px;color:#888;margin-top:4px;" }, caption]] : []),
    ];
  },
});

const SocialNode = Node.create({
  name: "socialEmbed",
  group: "block",
  atom: true,
  addAttributes() { return { provider: { default: null }, url: { default: null }, author: { default: "" }, text: { default: "" }, thumb: { default: null } }; },
  parseHTML() { return [{ tag: "div[data-social-embed]" }]; },
  renderHTML({ HTMLAttributes }) {
    const { url, author, text, thumb } = HTMLAttributes;
    return [
      "div", { "data-social-embed": "", style: "border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin:1rem 0;max-width:540px;" },
      ...(thumb ? [["img", { src: thumb, alt: "", "data-no-optimize": "", style: "width:100%;height:180px;object-fit:cover;" }]] : []),
      ["div", { style: "padding:12px;" },
        ["strong", { style: "font-size:12px;display:block;margin-bottom:6px;" }, author ?? ""],
        ...(text ? [["p", { style: "font-size:12px;color:#666;margin:0 0 8px;" }, text]] : []),
        ["a", { href: url ?? "", target: "_blank", style: "font-size:11px;color:#999;" }, url ?? ""],
      ],
    ];
  },
});

const CarouselNode = Node.create({
  name: "carousel",
  group: "block",
  atom: true,
  addAttributes() { return { images: { default: "[]" }, ratio: { default: "4:5" } }; },
  parseHTML() { return [{ tag: "div[data-carousel]" }]; },
  renderHTML({ HTMLAttributes }) {
    const { images, ratio } = HTMLAttributes;
    const imagesStr = typeof images === "string" ? images : JSON.stringify(images);
    return [
      "div", mergeAttributes({ "data-carousel": "" }, {
        "data-images": imagesStr,
        "data-ratio": ratio,
        style: "margin:1.5rem 0;",
      }),
    ];
  },
});

// ── Image optimization ────────────────────────────────────
// The body is injected as raw HTML, so next/image can't be used. Instead
// our own image hosts are routed through the /_next/image endpoint with a
// srcset. Third-party hosts (social thumbs) are skipped — they aren't in
// remotePatterns and the optimizer would reject them.

const R2_PUBLIC   = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL ?? "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

const OPTIMIZABLE_HOSTS = [R2_PUBLIC, SUPABASE_URL].filter(Boolean);

// Body column is ~720px; these cover 1x through 3x.
const BODY_WIDTHS = [640, 828, 1080, 1200, 1920];
const BODY_QUALITY = 82;

function nextImageUrl(src: string, width: number) {
  return "/_next/image?url=" + encodeURIComponent(src) + "&w=" + width + "&q=" + BODY_QUALITY;
}

function optimizeBodyImages(html: string): string {
  if (OPTIMIZABLE_HOSTS.length === 0) return html;
  return html.replace(/<img\s([^>]*?)src="([^"]+)"([^>]*?)>/g, (full, pre, src, post) => {
    if (full.includes("data-no-optimize")) return full;
    if (full.includes("srcset=")) return full;
    if (!OPTIMIZABLE_HOSTS.some((host) => src.startsWith(host))) return full;
    const srcset = BODY_WIDTHS.map((w) => nextImageUrl(src, w) + " " + w + "w").join(", ");
    return (
      "<img " + pre +
      'src="' + nextImageUrl(src, 1200) + '" ' +
      'srcset="' + srcset + '" ' +
      'sizes="(max-width: 768px) 100vw, 720px" ' +
      'loading="lazy" decoding="async"' + post + ">"
    );
  });
}

// ── Public Carousel ───────────────────────────────────────

function PublicCarousel({ images, ratio }: { images: string[]; ratio: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const total = images.length;

  const cardWidth = ratio === "1:1" ? "72vw" : "60vw";
  const cardMaxWidth = ratio === "1:1" ? "340px" : "280px";
  const aspectRatio = ratio === "1:1" ? "1/1" : "4/5";

  function scrollTo(index: number) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.children[index] as HTMLElement;
    if (card) card.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    setCurrent(index);
  }

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    function onScroll() {
      if (!track) return;
      const cards = Array.from(track.children) as HTMLElement[];
      const center = track.scrollLeft + track.offsetWidth / 2;
      let closest = 0;
      let minDist = Infinity;
      for (let i = 0; i < cards.length; i++) {
        const cardCenter = cards[i].offsetLeft + cards[i].offsetWidth / 2;
        const dist = Math.abs(center - cardCenter);
        if (dist < minDist) { minDist = dist; closest = i; }
      }
      setCurrent(closest);
    }
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, []);

  const canOptimize = (src: string) =>
    OPTIMIZABLE_HOSTS.some((host) => src.startsWith(host));

  const items: React.ReactNode[] = [];
  for (let i = 0; i < images.length; i++) {
    const src = images[i];
    items.push(
      <div
        key={i}
        className="flex-shrink-0 snap-center overflow-hidden rounded-xl"
        style={{ aspectRatio, width: cardWidth, maxWidth: cardMaxWidth }}
      >
        <img
          src={canOptimize(src) ? nextImageUrl(src, 828) : src}
          srcSet={canOptimize(src) ? [640, 828].map((w) => nextImageUrl(src, w) + " " + w + "w").join(", ") : undefined}
          sizes="(max-width: 768px) 72vw, 340px"
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
    );
  }

  const dots: React.ReactNode[] = [];
  for (let i = 0; i < total; i++) {
    const idx = i;
    dots.push(
      <button
        key={i}
        onClick={() => scrollTo(idx)}
        className={"rounded-full transition-all " + (i === current ? "w-4 h-1.5 bg-gray-800" : "w-1.5 h-1.5 bg-gray-300")}
      />
    );
  }

  return (
    <div className="my-6 select-none" dir="ltr">
      <div
        ref={trackRef}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2"
        style={{ scrollbarWidth: "none" } as React.CSSProperties}
      >
        {items}
      </div>
      {total > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">{dots}</div>
      )}
    </div>
  );
}

// ── Segment types ─────────────────────────────────────────

type Segment =
  | { type: "html"; html: string }
  | { type: "carousel"; images: string[]; ratio: string };

function splitIntoSegments(html: string): Segment[] {
  const SPLIT = "CAROUSEL_PLACEHOLDER_";
  const carouselData: { images: string[]; ratio: string }[] = [];

  const replaced = html.replace(/<div data-carousel=""([^>]*)><\/div>/g, (_, attrs) => {
    const imagesMatch = attrs.match(/data-images="([^"]*)"/);
    const ratioMatch  = attrs.match(/data-ratio="([^"]*)"/);
    let images: string[] = [];
    try { images = JSON.parse((imagesMatch?.[1] ?? "[]").replace(/&quot;/g, '"')); } catch {}
    const ratio = ratioMatch?.[1] ?? "4:5";
    const idx = carouselData.length;
    carouselData.push({ images, ratio });
    return SPLIT + idx + "_END";
  });

  const parts = replaced.split(new RegExp("(" + SPLIT + "\\d+_END)"));
  const segments: Segment[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const match = part.match(new RegExp(SPLIT + "(\\d+)_END"));
    if (match) {
      const idx = parseInt(match[1]);
      segments.push({ type: "carousel", ...carouselData[idx] });
    } else if (part.trim()) {
      segments.push({ type: "html", html: part });
    }
  }

  return segments;
}

// ── Main component ────────────────────────────────────────

export default function ArticleBody({ body }: Props) {
  const html = useMemo(() => {
    if (!body) return "";
    try {
      const raw = generateHTML(body as any, [
        StarterKit,
        Image,
        Link,
        Underline,
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        Youtube,
        VimeoNode,
        SocialNode,
        PullQuoteNode,
        InterviewNode,
        StyledBlockquoteNode,
        CarouselNode,
      ]);
      return optimizeBodyImages(raw);
    } catch {
      return "";
    }
  }, [body]);

  const segments = useMemo(() => splitIntoSegments(html), [html]);

  if (!html) return null;

  const bodyStyle: React.CSSProperties = {
    fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
    fontSize: "17px",
    lineHeight: 2.2,
    color: "rgb(26,26,26)",
  };

  if (segments.length === 1 && segments[0].type === "html") {
    return (
      <div
        className="article-body"
        dir="rtl"
        dangerouslySetInnerHTML={{ __html: (segments[0] as any).html }}
        style={bodyStyle}
      />
    );
  }

  const rendered: React.ReactNode[] = [];
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg.type === "html") {
      rendered.push(
        <div
          key={i}
          className="article-body"
          dir="rtl"
          dangerouslySetInnerHTML={{ __html: seg.html }}
          style={bodyStyle}
        />
      );
    } else {
      rendered.push(
        <PublicCarousel key={i} images={seg.images} ratio={seg.ratio} />
      );
    }
  }

  return <div>{rendered}</div>;
}
