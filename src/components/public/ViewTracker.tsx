"use client";
// src/components/public/ViewTracker.tsx
// Drop this into any article page — fires once on mount

import { useEffect } from "react";

export default function ViewTracker({ articleId }: { articleId: string }) {
  useEffect(() => {
    if (!articleId) return;
    fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ article_id: articleId }),
    }).catch(() => {});
  }, [articleId]);

  return null;
}
