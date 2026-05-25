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
        setMessage("ތިޔަ ސަބްސްކްރިޕްޝަން ލިބިއްޖެ! ތަޝައްކުރު ☺︎");
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
    <section className="border-t border-black/10 py-20 px-6" style={{ backgroundColor: "#F5F3EF" }} dir="rtl">
      <div className="max-w-xl mx-auto text-center space-y-6">

        <div style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "20px", color: "rgba(26,26,26,0.15)", letterSpacing: "0.2em" }}>
          ✦ ✦ ✦
        </div>

        <h2 style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontWeight: 700, fontSize: "22px", color: "rgb(26,26,26)", lineHeight: 2 }}>
          ނިއުސްލެޓަރ
        </h2>

        <p style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontWeight: 400, fontSize: "14px", color: "rgb(110,108,102)", lineHeight: 2 }}>
          ހަފްތާއަކު އެއްފަހަރު — ފަންނު، ދިރިއުޅުން، ރިވިއު.
          <br />ތިޔަ އިންބޮކްސްއަށް ސީދާ.
        </p>

        {status === "success" ? (
          <p style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontSize: "13px", color: "rgb(100,98,92)", lineHeight: 2 }}>
            {message}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm mx-auto" dir="ltr">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 outline-none py-2 text-center transition-colors"
              style={{
                fontFamily: '"MVTypewriter", sans-serif',
                fontSize: "13px",
                color: "rgb(26,26,26)",
                backgroundColor: "transparent",
                borderBottom: "1px solid rgba(26,26,26,0.25)",
              }}
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="hover:opacity-80 transition-opacity disabled:opacity-40 whitespace-nowrap"
              style={{
                fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
                fontSize: "12px",
                fontWeight: 700,
                padding: "8px 20px",
                borderRadius: "999px",
                backgroundColor: "rgb(26,26,26)",
                color: "rgb(249,248,245)",
              }}
            >
              {status === "loading" ? "..." : "ސަބްސްކްރައިބް"}
            </button>
          </form>
        )}

        {status === "error" && (
          <p style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "11px", color: "rgb(200,60,60)" }}>
            {message}
          </p>
        )}
      </div>
    </section>
  );
}
