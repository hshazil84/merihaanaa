"use client";
// components/public/ArticleBody.tsx

import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Youtube from "@tiptap/extension-youtube";
import { Node, mergeAttributes } from "@tiptap/core";
import { useMemo } from "react";

interface Props {
  body: Record<string, unknown> | null;
}

// ── Quote nodes (must match editor definitions exactly) ───

const PullQuoteNode = Node.create({
  name: "pullQuote",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      text:   { default: "" },
      author: { default: "" },
    };
  },
  parseHTML() { return [{ tag: "div[data-pull-quote]" }]; },
  renderHTML({ HTMLAttributes }) {
    const { text, author } = HTMLAttributes;
    return [
      "div", mergeAttributes({ "data-pull-quote": "" }, {
        style: "margin:2.5rem auto;padding:0 2rem;text-align:center;max-width:600px;",
      }),
      ["p", { style: "font-family:'MVTypewriter','Noto Sans Thaana',sans-serif;font-size:1.35rem;font-weight:700;color:rgb(26,26,26);line-height:1.8;margin:0 0 0.5rem;" }, `"${text}"`],
      ...(author ? [["p", { style: "font-family:'MVTypewriter',sans-serif;font-size:11px;color:rgb(160,158,152);line-height:2;margin:0;" }, `— ${author}`]] : []),
    ];
  },
});

const InterviewNode = Node.create({
  name: "interview",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      question: { default: "" },
      answer:   { default: "" },
    };
  },
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
  addAttributes() {
    return {
      text:   { default: "" },
      author: { default: "" },
    };
  },
  parseHTML() { return [{ tag: "div[data-styled-blockquote]" }]; },
  renderHTML({ HTMLAttributes }) {
    const { text, author } = HTMLAttributes;
    return [
      "div", mergeAttributes({ "data-styled-blockquote": "" }, {
        style: "margin:1.5rem 0;padding:4px 20px 4px 0;border-right:2px solid rgba(0,0,0,0.5);direction:rtl;",
      }),
      ["p", { style: "font-family:'MVTypewriter','Noto Sans Thaana',sans-serif;font-size:16px;color:rgb(60,58,52);line-height:2;margin:0 0 4px;" }, text],
      ...(author ? [["p", { style: "font-family:'MVTypewriter',sans-serif;font-size:11px;color:rgb(160,158,152);line-height:2;margin:0;" }, `— ${author}`]] : []),
    ];
  },
});

// ── Vimeo + Social (needed for generateHTML to not throw) ─

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
        ["iframe", { src: `https://player.vimeo.com/video/${videoId}`, style: "position:absolute;top:0;left:0;width:100%;height:100%;border:0;", allowfullscreen: "true" }],
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
      ...(thumb ? [["img", { src: thumb, alt: "", style: "width:100%;height:180px;object-fit:cover;" }]] : []),
      ["div", { style: "padding:12px;" },
        ["strong", { style: "font-size:12px;display:block;margin-bottom:6px;" }, author ?? ""],
        ...(text ? [["p", { style: "font-size:12px;color:#666;margin:0 0 8px;" }, text]] : []),
        ["a", { href: url ?? "", target: "_blank", style: "font-size:11px;color:#999;" }, url ?? ""],
      ],
    ];
  },
});

export default function ArticleBody({ body }: Props) {
  const html = useMemo(() => {
    if (!body) return "";
    try {
      return generateHTML(body as any, [
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
      ]);
    } catch {
      return "";
    }
  }, [body]);

  if (!html) return null;

  return (
    <div
      className="article-body"
      dir="rtl"
      dangerouslySetInnerHTML={{ __html: html }}
      style={{
        fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
        fontSize: "17px",
        lineHeight: 2.2,
        color: "rgb(26,26,26)",
      }}
    />
  );
}
