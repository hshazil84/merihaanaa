"use client";
// components/public/NewsletterCTA.tsx
// Newsletter subscription — stores in Supabase subscribers table + triggers Resend

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
    } catch (err: unknown) {
      setStatus("error");
      setMessage("ސަބްސްކްރައިބް ނުވި. އަލުން ލޯޑްކޮށްލާ.");
    }
  };

  return (
    <section className="border-t border-black/10 py-20 px-6" dir="rtl">
      <div className="max-w-xl mx-auto text-center space-y-6">

        {/* Decorative */}
        <div className="font-body text-2xl text-foreground/20 tracking-widest">✦ ✦ ✦</div>

        <h2 className="font-display text-3xl text-foreground">
          ނިއުސްލެޓަރ
        </h2>
        <p className="font-body text-sm text-foreground/50 leading-relaxed">
          ހަފްތާއަކު އެއްފަހަރު — ފަންނު، ދިރިއުޅުން، ރިވިއު.
          <br />ތިޔަ އިންބޮކްސްއަށް ސީދާ.
        </p>

        {status === "success" ? (
          <p className="font-body text-sm text-foreground/70 py-4">{message}</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm mx-auto" dir="ltr">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 bg-transparent border-b border-black/30 focus:border-black dark:border-white/30 dark:focus:border-white outline-none font-body text-sm py-2 text-center transition-colors placeholder:text-foreground/30"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="font-body text-xs font-semibold px-5 py-2 rounded-full bg-black text-white dark:bg-white dark:text-black hover:opacity-80 transition-opacity disabled:opacity-40 whitespace-nowrap"
            >
              {status === "loading" ? "..." : "ސަބްސްކްރައިބް"}
            </button>
          </form>
        )}

        {status === "error" && (
          <p className="font-body text-xs text-red-500">{message}</p>
        )}
      </div>
    </section>
  );
}
