"use client";
// components/public/PublicFooter.tsx

import Link from "next/link";
import Image from "next/image";

interface Category { id: string; name: string; slug: string; }

export default function PublicFooter({ categories }: { categories: Category[] }) {
  return (
    <footer style={{ backgroundColor: "rgb(26, 26, 26)" }} dir="rtl">

      {/* Logo */}
      <div className="max-w-5xl mx-auto px-6 pt-14 pb-8 flex flex-col items-center gap-3 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <Image
          src="/logo.svg"
          alt="މެރިހާނާ"
          width={72}
          height={22}
          className="invert opacity-80"
        />
        <p style={{
          fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
          fontWeight: 400,
          fontSize: "10px",
          color: "rgba(255,255,255,0.25)",
          lineHeight: 2,
          letterSpacing: "0.12em",
        }}>
          People · Reviews · Stories
        </p>
      </div>

      {/* Category links */}
      <div className="max-w-5xl mx-auto px-6 py-8 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
          {categories.map((cat) => (
            <Link key={cat.id} href={`/${cat.slug}`}
              style={{
                fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
                fontWeight: 400,
                fontSize: "12px",
                color: "rgba(255,255,255,0.4)",
                lineHeight: 2,
              }}
              className="hover:text-white transition-colors">
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-5xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-4">

        {/* Social icons */}
        <div className="flex items-center gap-5 order-1 md:order-2">
          <a href="https://instagram.com/merihaanaa" target="_blank" rel="noopener noreferrer" aria-label="Instagram"
            className="transition-opacity hover:opacity-60" style={{ color: "rgba(255,255,255,0.4)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <circle cx="12" cy="12" r="4.5"/>
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
            </svg>
          </a>
          <a href="https://x.com/merihaanaa" target="_blank" rel="noopener noreferrer" aria-label="X"
            className="transition-opacity hover:opacity-60" style={{ color: "rgba(255,255,255,0.4)" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          <a href="https://tiktok.com/@merihaanaa" target="_blank" rel="noopener noreferrer" aria-label="TikTok"
            className="transition-opacity hover:opacity-60" style={{ color: "rgba(255,255,255,0.4)" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.16 8.16 0 0 0 4.77 1.52V6.75a4.85 4.85 0 0 1-1-.06z"/>
            </svg>
          </a>
          <a href="https://www.facebook.com/Merihaanaadotcom/" target="_blank" rel="noopener noreferrer" aria-label="Facebook"
            className="transition-opacity hover:opacity-60" style={{ color: "rgba(255,255,255,0.4)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
            </svg>
          </a>
        </div>

        {/* Legal links */}
        <div className="flex items-center gap-6 order-2 md:order-1">
          {[
            { href: "/privacy", label: "ޕްރައިވެސީ" },
            { href: "/terms",   label: "ޝަރުތުތައް" },
            { href: "/contact", label: "ގުޅުން" },
          ].map(({ href, label }) => (
            <Link key={href} href={href}
              style={{
                fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
                fontSize: "10px",
                color: "rgba(255,255,255,0.4)",
                lineHeight: 2,
              }}
              className="hover:text-white transition-colors">
              {label}
            </Link>
          ))}
        </div>

        <p className="order-3" style={{
          fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
          fontSize: "10px",
          color: "rgba(255,255,255,0.4)",
          lineHeight: 2,
        }}>
          © {new Date().getFullYear()} މެރިހާނާ
        </p>
      </div>
    </footer>
  );
}
