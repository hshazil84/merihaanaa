"use client";
// components/public/PublicNav.tsx

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, User, X, Menu } from "lucide-react";

interface Category { id: string; name: string; slug: string; }
interface Props {
  categories: Category[];
  static?: boolean;
}

const LOGO_BAR_HEIGHT = 72;
const CAT_BAR_HEIGHT  = 56;

export default function PublicNav({ categories, static: isStatic = false }: Props) {
  const [catBarTop, setCatBarTop]           = useState(LOGO_BAR_HEIGHT);
  const [locked, setLocked]                 = useState(false);
  const [logoTransparent, setLogoTransparent] = useState(false);
  const [mounted, setMounted]               = useState(false);
  const [searchOpen, setSearchOpen]         = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // After mount, initialize transparency based on isStatic and scroll
  useEffect(() => {
    setMounted(true);
    if (!isStatic) {
      setLogoTransparent(window.scrollY < 20);
    }
  }, [isStatic]);

  useEffect(() => {
    if (isStatic) {
      setCatBarTop(LOGO_BAR_HEIGHT);
      setLocked(true);
      setLogoTransparent(false);
      return;
    }

    const update = () => {
      const scrollY     = window.scrollY;
      const heroHeight  = window.innerHeight;
      const naturalTop  = heroHeight - CAT_BAR_HEIGHT - scrollY;
      const clampedTop  = Math.max(LOGO_BAR_HEIGHT, naturalTop);
      const isLocked    = naturalTop <= LOGO_BAR_HEIGHT;

      setCatBarTop(clampedTop);
      setLocked(isLocked);
      setLogoTransparent(scrollY < 20);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [isStatic]);

  const iconColor = (mounted && logoTransparent) ? "rgb(255,255,255)" : "rgb(26,26,26)";

  return (
    <>
      {/* ── Logo bar ── */}
      <header
        className="fixed top-0 right-0 left-0 z-50 transition-colors duration-200"
        style={{
          height: `${LOGO_BAR_HEIGHT}px`,
          backgroundColor: (mounted && logoTransparent) ? "transparent" : "rgb(249, 248, 245)",
        }}
      >
        <div className="max-w-7xl mx-auto px-5 md:px-6 h-full flex items-center justify-center relative">

          <Link href="/" className="flex items-center md:relative absolute right-5 md:right-auto">
            <Image src="/logo.svg" alt="މެރިހާނާ" width={60} height={60} priority className="object-contain" />
          </Link>

          <div className="absolute left-5 md:hidden">
            <button type="button" onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-full hover:bg-black/5 transition-colors"
              style={{ color: iconColor }}>
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <div className="absolute right-5 md:right-6 hidden md:flex items-center gap-3">
            <button type="button" aria-label="ހޯދާ"
              onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 100); }}
              className="p-2 rounded-full hover:bg-black/5 transition-colors"
              style={{ color: iconColor }}>
              <Search className="w-[18px] h-[18px]" />
            </button>
            <Link href="/login" className="p-2 rounded-full hover:bg-black/5 transition-colors" style={{ color: iconColor }}>
              <User className="w-[18px] h-[18px]" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Category bar ── */}
      <div
        className="fixed z-40 w-full hidden md:block"
        style={{
          top: `${catBarTop}px`,
          height: `${CAT_BAR_HEIGHT}px`,
          backgroundColor: "rgb(249, 248, 245)",
          borderBottom: "1px solid rgb(224, 221, 214)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-full">
          <div className="flex items-center justify-center gap-1 h-full">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/${cat.slug}`}
                className="whitespace-nowrap px-4 py-2 transition-colors hover:text-[rgb(26,26,26)]"
                style={{ fontFamily: "'MVTypewriter', 'MV Boli', sans-serif", fontSize: "13px", color: "rgb(153,153,153)" }}>
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      <div
        className="fixed inset-0 z-[55] transition-opacity duration-300"
        style={{
          backgroundColor: "rgb(249, 248, 245)",
          top: `${LOGO_BAR_HEIGHT}px`,
          opacity: mobileMenuOpen ? 1 : 0,
          pointerEvents: mobileMenuOpen ? "auto" : "none",
        }}
      >
        <button type="button" onClick={() => setMobileMenuOpen(false)}
          className="absolute top-4 left-5 p-2 hover:bg-black/5 rounded-full text-[rgb(26,26,26)]">
          <X className="w-5 h-5" />
        </button>
        <div className="h-full overflow-y-auto px-8 py-12 max-w-md mx-auto" dir="rtl">
          <nav>
            {categories.map((cat, i) => (
              <div key={cat.id} style={{
                opacity: mobileMenuOpen ? 1 : 0,
                transform: mobileMenuOpen ? "translateX(0)" : "translateX(20px)",
                transition: `opacity 0.3s ease ${i * 0.04}s, transform 0.3s ease ${i * 0.04}s`,
              }}>
                <Link href={`/${cat.slug}`} onClick={() => setMobileMenuOpen(false)}
                  className="block py-3 border-b border-[#e0ddd6]/60 transition-colors text-[#999] hover:text-[#333]"
                  style={{ fontFamily: "'MVTypewriter', 'MV Boli', sans-serif", fontSize: "1.2rem" }}>
                  {cat.name}
                </Link>
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* ── Search overlay ── */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60] bg-[#F5F3EF]/98 backdrop-blur-sm flex items-center justify-center px-6">
          <button type="button" onClick={() => setSearchOpen(false)}
            className="absolute top-6 left-6 w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/10">
            <X size={18} />
          </button>
          <div className="w-full max-w-xl">
            <p style={{ fontFamily: "'MVTypewriter', sans-serif", fontSize: "11px", color: "rgb(160,158,152)" }}
              className="text-center mb-4">ލިޔުންތައް ހޯދާ</p>
            <form action="/search" method="get">
              <input ref={searchRef} name="q" type="text" placeholder="ހޯދާ..." dir="rtl"
                className="w-full bg-transparent border-b-2 border-black/20 focus:border-black outline-none text-3xl text-center pb-3 transition-colors placeholder:text-black/20"
                style={{ fontFamily: "'MVTypewriter', sans-serif" }} />
            </form>
          </div>
        </div>
      )}
    </>
  );
}
