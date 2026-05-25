"use client";
// components/public/ArticleBody.tsx
// Renders TipTap JSON body as styled HTML

import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Youtube from "@tiptap/extension-youtube";
import { useMemo } from "react";

interface Props {
  body: Record<string, unknown> | null;
}

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
