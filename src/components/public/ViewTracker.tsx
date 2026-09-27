"use client";
// src/components/public/ViewTracker.tsx
import { useEffect } from "react";

export default function ViewTracker({ articleId }: { articleId: string }) {
  useEffect(() => {
    if (!articleId) return;
    const fbclid = new URLSearchParams(window.location.search).get("fbclid");
    const referrer = document.referrer || null; // the actual previous page, not this one
    const payload = JSON.stringify({ article_id: articleId, fbclid, referrer });

    // sendBeacon is designed to survive the user navigating away or closing the
    // tab mid-request — a plain fetch() can get cancelled in that case, which is
    // the likely cause of undercounting vs Vercel on fast in-app-browser bounces.
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      const sent = navigator.sendBeacon("/api/views", blob);
      if (sent) return;
    }

    fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  }, [articleId]);

  return null;
}
