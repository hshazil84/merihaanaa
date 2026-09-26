"use client";
// src/components/public/ViewTracker.tsx
// Drop this into any article page — fires once on mount

import { useEffect } from "react";

export default function ViewTracker({ articleId }: { articleId: string }) {
  useEffect(() => {
    if (!articleId) return;
    const fbclid = new URLSearchParams(window.location.search).get("fbclid");
    const referrer = document.referrer || null; // the actual previous page, not this one
    fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ article_id: articleId, fbclid, referrer }),
    }).catch(() => {});
  }, [articleId]);

  return null;
}
