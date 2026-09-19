"use client";
// components/public/NewsletterCTA.tsx

import { useState } from "react";

export default function NewsletterCTA() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage("ސަބްސްކްރައިބް ކުރެވިއްޖެ");
        setEmail("");
      } else {
        throw new Error(data.error ?? "ނުވި");
      }
    } catch {
      setStatus("error");
      setMessage("ސަބްސްކްރައިބް ނުވި. އަލުން ލޯޑްކޮށްލާ.");
    }
  };

  return (
    <section className="border-t border-black/10 py-8 px-6" style={{ backgroundColor: "#F5F3EF" }}>
      <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4" dir="ltr">

        {status === "success" ? (
          <p dir="rtl" style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontSize: "13px", color: "rgb(100,98,92)", margin: 0 }}>
            {message}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2 w-full md:w-auto" dir="ltr">
            <button
              type="submit"
              disabled={status === "loading"}
              className="hover:opacity-80 transition-opacity disabled:opacity-40 whitespace-nowrap flex-none"
              style={{
                fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
                fontSize: "12px",
                fontWeight: 700,
                padding: "7px 18px",
                borderRadius: "999px",
                backgroundColor: "rgb(26,26,26)",
                color: "rgb(249,248,245)",
              }}
            >
              {status === "loading" ? "..." : "ސަބްސްކްރައިބް"}
            </button>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 md:w-52 outline-none py-1.5 transition-colors"
              style={{
                fontFamily: '"MVTypewriter", sans-serif',
                fontSize: "13px",
                color: "rgb(26,26,26)",
                backgroundColor: "transparent",
                borderBottom: "1px solid rgba(26,26,26,0.25)",
              }}
            />
          </form>
        )}

        <p className="text-center md:text-right" dir="rtl" style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontSize: "14px", lineHeight: 1.8, margin: 0 }}>
          <span style={{ fontWeight: 700, color: "rgb(26,26,26)" }}>ނިއުސްލެޓަރ</span>
          <span style={{ fontWeight: 400, color: "rgb(110,108,102)" }}> — މެރިހާނާ ނިއުސްލެޓަރއަށް ސަބްސްކްރައިބް ކުރެއްވުމަށް</span>
        </p>

      </div>

      {status === "error" && (
        <p className="text-center mt-2" dir="rtl" style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "11px", color: "rgb(200,60,60)" }}>
          {message}
        </p>
      )}
    </section>
  );
}
