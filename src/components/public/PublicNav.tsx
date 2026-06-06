"use client";
// components/public/PublicNav.tsx

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, User, X, Menu } from "lucide-react";

interface Category { id: string; name: string; slug: string; }
interface Props {
  categories: Category[];
  static?: boolean;
}
interface SearchResult {
  id: string;
  title: string;
  slug: string;
  category: { name: string; slug: string } | null;
}

const LOGO_BAR_HEIGHT = 72;
const CAT_BAR_HEIGHT  = 56;
const COMPACT_HEIGHT  = 48;
const GPU             = "translateZ(0)";

export default function PublicNav({ categories, static: isStatic = false }: Props) {
  const router = useRouter();

  const navWrapperRef     = useRef<HTMLDivElement>(null);
  const logoBarRef        = useRef<HTMLDivElement>(null);
  const catBarRef         = useRef<HTMLDivElement>(null);
  const compactDesktopRef = useRef<HTMLDivElement>(null);
  const compactMobileRef  = useRef<HTMLDivElement>(null);
  const staticWrapperRef  = useRef<HTMLDivElement>(null);

  // Home page scroll state — all via refs, zero setState
  const phaseRef         = useRef<"rising" | "merged">("rising");
  const homeCompactRef   = useRef(false);
  const lastScrollY      = useRef(0);

  // Static page scroll state — all via refs, zero setState
  const staticCompactRef    = useRef(false);
  const lastScrollYStatic   = useRef(0);

  // Icon nodes cached once on mount — no querySelectorAll on every scroll
  const iconNodesRef = useRef<HTMLElement[]>([]);

  const [searchOpen, setSearchOpen]         = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery]       = useState("");
  const [searchResults, setSearchResults]   = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading]   = useState(false);
  const searchRef   = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<NodeJS.Timeout | null>(null);

  // ── Home page scroll handler ──────────────────────────────────────────────
  useEffect(() => {
    if (isStatic) return;

    // Cache icon nodes once
    if (logoBarRef.current) {
      iconNodesRef.current = Array.from(
        logoBarRef.current.querySelectorAll<HTMLElement>(".nav-icon")
      );
    }

    // Set initial cat bar position
    const heroHeight = window.innerHeight;
    if (catBarRef.current) {
      const naturalY = heroHeight - CAT_BAR_HEIGHT;
      catBarRef.current.style.transform = `translateY(${naturalY}px) ${GPU}`;
      catBarRef.current.style.visibility = "visible";
      catBarRef.current.style.opacity = "1";
    }

    let ticking = false;

    const update = () => {
      const scrollY  = window.scrollY;
      const vh       = window.innerHeight;
      const naturalY = vh - CAT_BAR_HEIGHT - scrollY;
      const clampedY = Math.max(LOGO_BAR_HEIGHT, naturalY);
      const merged   = naturalY <= LOGO_BAR_HEIGHT;
      const offset   = LOGO_BAR_HEIGHT + CAT_BAR_HEIGHT;

      if (phaseRef.current === "rising") {
        if (catBarRef.current) {
          catBarRef.current.style.transform = `translateY(${clampedY}px) ${GPU}`;
        }
        if (logoBarRef.current) {
          logoBarRef.current.style.backgroundColor = merged
            ? "rgb(249,248,245)"
            : "transparent";
          const color = merged ? "rgb(26,26,26)" : "rgb(255,255,255)";
          iconNodesRef.current.forEach((el) => { el.style.color = color; });
        }
        if (merged) {
          phaseRef.current = "merged";
          if (catBarRef.current) {
            catBarRef.current.style.transform = `translateY(${LOGO_BAR_HEIGHT}px) ${GPU}`;
          }
        }
      }

      if (phaseRef.current === "merged") {
        const shouldCompact = scrollY > lastScrollY.current;
        if (shouldCompact !== homeCompactRef.current) {
          homeCompactRef.current = shouldCompact;
          if (navWrapperRef.current) {
            navWrapperRef.current.style.transform = shouldCompact
              ? `translateY(-${offset}px) ${GPU}`
              : `translateY(0) ${GPU}`;
          }
          const co = shouldCompact
            ? `translateY(0) ${GPU}`
            : `translateY(-${COMPACT_HEIGHT}px) ${GPU}`;
          if (compactDesktopRef.current) compactDesktopRef.current.style.transform = co;
          if (compactMobileRef.current)  compactMobileRef.current.style.transform  = co;
        }

        // Scroll back past merge point — return to rising phase
        if (naturalY > LOGO_BAR_HEIGHT) {
          phaseRef.current = "rising";
          homeCompactRef.current = false;
          if (navWrapperRef.current)     navWrapperRef.current.style.transform     = `translateY(0) ${GPU}`;
          if (compactDesktopRef.current) compactDesktopRef.current.style.transform = `translateY(-${COMPACT_HEIGHT}px) ${GPU}`;
          if (compactMobileRef.current)  compactMobileRef.current.style.transform  = `translateY(-${COMPACT_HEIGHT}px) ${GPU}`;
          if (logoBarRef.current) {
            logoBarRef.current.style.backgroundColor = "transparent";
            iconNodesRef.current.forEach((el) => { el.style.color = "rgb(255,255,255)"; });
          }
          if (catBarRef.current) {
            catBarRef.current.style.transform = `translateY(${clampedY}px) ${GPU}`;
          }
        }
      }

      lastScrollY.current = scrollY;
      ticking = false;
    };

    const requestTick = () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    };

    update();
    window.addEventListener("scroll", requestTick, { passive: true });
    window.addEventListener("resize", requestTick, { passive: true });
    return () => {
      window.removeEventListener("scroll", requestTick);
      window.removeEventListener("resize", requestTick);
    };
  }, [isStatic]);

  // ── Static page scroll handler — pure DOM, zero setState ─────────────────
  useEffect(() => {
    if (!isStatic) return;

    const offset = LOGO_BAR_HEIGHT + CAT_BAR_HEIGHT;
    let ticking = false;

    const update = () => {
      const scrollY      = window.scrollY;
      const shouldCompact = scrollY > 80 && scrollY > lastScrollYStatic.current;

      if (shouldCompact !== staticCompactRef.current) {
        staticCompactRef.current = shouldCompact;

        if (staticWrapperRef.current) {
          staticWrapperRef.current.style.transform = shouldCompact
            ? `translateY(-${offset}px) ${GPU}`
            : `translateY(0) ${GPU}`;
        }
        const co = shouldCompact
          ? `translateY(0) ${GPU}`
          : `translateY(-${COMPACT_HEIGHT}px) ${GPU}`;
        if (compactDesktopRef.current) compactDesktopRef.current.style.transform = co;
        if (compactMobileRef.current)  compactMobileRef.current.style.transform  = co;
      }

      lastScrollYStatic.current = scrollY;
      ticking = false;
    };

    const requestTick = () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    };

    window.addEventListener("scroll", requestTick, { passive: true });
    return () => window.removeEventListener("scroll", requestTick);
  }, [isStatic]);

  // ── Search ────────────────────────────────────────────────────────────────
  const handleSearchInput = useCallback((val: string) => {
    setSearchQuery(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (val.trim().length < 2) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(val.trim())}`);
        const data = await res.json();
        setSearchResults(data.results ?? []);
      } catch { setSearchResults([]); }
      finally { setSearchLoading(false); }
    }, 300);
  }, []);

  const openSearch = () => {
    setSearchOpen(true);
    setSearchQuery("");
    setSearchResults([]);
    setTimeout(() => searchRef.current?.focus(), 100);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") closeSearch();
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      closeSearch();
    }
  };

  // ── Static pages render ───────────────────────────────────────────────────
  if (isStatic) {
    return (
      <>
        {/* Static nav wrapper — controlled via DOM ref, no state */}
        <div
          ref={staticWrapperRef}
          className="fixed top-0 right-0 left-0 z-50 will-change-transform"
          style={{ transform: `translateY(0) ${GPU}`, transition: "transform 0.3s ease" }}
        >
          <header style={{ height: `${LOGO_BAR_HEIGHT}px`, backgroundColor: "rgb(249,248,245)" }}>
            <div className="max-w-7xl mx-auto px-5 md:px-6 h-full flex items-center justify-center relative">
              <Link href="/" className="flex items-center">
                <Image src="/logo.svg" alt="މެރިހާނaa" width={60} height={60} priority className="object-contain" />
              </Link>
              <div className="absolute right-5 md:hidden">
                <button type="button" onClick={() => setMobileMenuOpen(true)}
                  className="p-2 rounded-full hover:bg-black/5 transition-colors"
                  style={{ color: "rgb(26,26,26)" }}>
                  <Menu className="w-5 h-5" />
                </button>
              </div>
              <div className="absolute left-5 md:hidden">
                <button type="button" aria-label="ހޯދާ" onClick={openSearch}
                  className="p-2 rounded-full hover:bg-black/5 transition-colors"
                  style={{ color: "rgb(26,26,26)" }}>
                  <Search className="w-[18px] h-[18px]" />
                </button>
              </div>
              <div className="absolute left-5 md:left-6 hidden md:flex items-center gap-3">
                <button type="button" aria-label="ހޯދާ" onClick={openSearch}
                  className="p-2 rounded-full hover:bg-black/5 transition-colors"
                  style={{ color: "rgb(26,26,26)" }}>
                  <Search className="w-[18px] h-[18px]" />
                </button>
                <Link href="/login" className="p-2 rounded-full hover:bg-black/5 transition-colors" style={{ color: "rgb(26,26,26)" }}>
                  <User className="w-[18px] h-[18px]" />
                </Link>
              </div>
            </div>
          </header>
          <div className="hidden md:block" style={{ height: `${CAT_BAR_HEIGHT}px`, backgroundColor: "rgb(249,248,245)", borderBottom: "1px solid rgb(224,221,214)" }}>
            <div className="max-w-7xl mx-auto px-6 h-full">
              <div className="flex items-center justify-center gap-1 h-full">
                {categories.map((cat) => (
                  <Link key={cat.id} href={`/${cat.slug}`}
                    target={cat.slug === "originals" ? "_blank" : undefined}
                    rel={cat.slug === "originals" ? "noopener noreferrer" : undefined}
                    className="whitespace-nowrap px-4 py-2 transition-colors hover:text-[rgb(26,26,26)]"
                    style={{ fontFamily: "'MVTypewriter','MV Boli',sans-serif", fontSize: "13px", color: "rgb(153,153,153)" }}>
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop compact — DOM ref controlled */}
        <div
          ref={compactDesktopRef}
          className="fixed top-0 right-0 left-0 z-50 hidden md:block will-change-transform"
          style={{
            height: `${COMPACT_HEIGHT}px`,
            backgroundColor: "rgb(249,248,245)",
            borderBottom: "1px solid rgb(224,221,214)",
            transform: `translateY(-${COMPACT_HEIGHT}px) ${GPU}`,
            transition: "transform 0.3s ease",
          }}
        >
          <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between" dir="rtl">
            <Link href="/" className="flex items-center flex-shrink-0">
              <Image src="/logo.svg" alt="މެރިހާނaa" width={32} height={32} className="object-contain" />
            </Link>
            <div className="flex items-center overflow-x-auto no-scrollbar">
              {categories.map((cat, i) => (
                <span key={cat.id} className="flex items-center">
                  <Link href={`/${cat.slug}`}
                    className="whitespace-nowrap px-3 py-1 transition-colors hover:text-[rgb(26,26,26)]"
                    style={{ fontFamily: "'MVTypewriter','MV Boli',sans-serif", fontSize: "12px", color: "rgb(153,153,153)" }}>
                    {cat.name}
                  </Link>
                  {i < categories.length - 1 && (
                    <span style={{ color: "rgb(210,207,200)", fontSize: "10px", userSelect: "none" }}>·</span>
                  )}
                </span>
              ))}
            </div>
            <button type="button" aria-label="ހޯދާ" onClick={openSearch}
              className="p-2 rounded-full hover:bg-black/5 transition-colors flex-shrink-0"
              style={{ color: "rgb(26,26,26)" }}>
              <Search className="w-[16px] h-[16px]" />
            </button>
          </div>
        </div>

        {/* Mobile compact — DOM ref controlled */}
        <div
          ref={compactMobileRef}
          className="fixed top-0 right-0 left-0 z-50 md:hidden will-change-transform"
          style={{
            height: `${COMPACT_HEIGHT}px`,
            backgroundColor: "rgb(249,248,245)",
            borderBottom: "1px solid rgb(224,221,214)",
            transform: `translateY(-${COMPACT_HEIGHT}px) ${GPU}`,
            transition: "transform 0.3s ease",
          }}
        >
          <div className="px-5 h-full flex items-center justify-between" dir="rtl">
            <Link href="/" className="flex items-center flex-shrink-0">
              <Image src="/logo.svg" alt="މެރިހާނaa" width={32} height={32} className="object-contain" />
            </Link>
            <div className="flex items-center gap-1">
              <button type="button" aria-label="ހޯދާ" onClick={openSearch}
                className="p-2 rounded-full hover:bg-black/5 transition-colors"
                style={{ color: "rgb(26,26,26)" }}>
                <Search className="w-[16px] h-[16px]" />
              </button>
              <button type="button" onClick={() => setMobileMenuOpen(true)}
                className="p-2 rounded-full hover:bg-black/5 transition-colors"
                style={{ color: "rgb(26,26,26)" }}>
                <Menu className="w-[18px] h-[18px]" />
              </button>
            </div>
          </div>
        </div>

        {searchOpen && (
          <SearchDropdown
            searchRef={searchRef} searchQuery={searchQuery} searchResults={searchResults}
            searchLoading={searchLoading} onInput={handleSearchInput} onKeyDown={handleKeyDown}
            onClose={closeSearch}
            topOffset={staticCompactRef.current ? COMPACT_HEIGHT : LOGO_BAR_HEIGHT + CAT_BAR_HEIGHT}
          />
        )}
        {searchOpen && <div className="fixed inset-0 z-[55]" onClick={closeSearch} />}
        <MobileMenu
          categories={categories} open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          topOffset={staticCompactRef.current ? COMPACT_HEIGHT : LOGO_BAR_HEIGHT}
        />
      </>
    );
  }

  // ── Home page render ──────────────────────────────────────────────────────
  return (
    <>
      <div
        ref={navWrapperRef}
        className="fixed top-0 right-0 left-0 z-50 will-change-transform"
        style={{ transform: `translateY(0) ${GPU}`, transition: "none" }}
      >
        {/* Logo bar */}
        <div
          ref={logoBarRef}
          style={{
            height: `${LOGO_BAR_HEIGHT}px`,
            backgroundColor: "transparent",
            transition: "background-color 0.25s ease",
            transform: GPU,
          }}
        >
          <div className="max-w-7xl mx-auto px-5 md:px-6 h-full flex items-center justify-center relative">
            <Link href="/" className="flex items-center">
              <Image src="/logo.svg" alt="މެރިހާނaa" width={60} height={60} priority className="object-contain" />
            </Link>
            <div className="absolute right-5 md:hidden">
              <button type="button" onClick={() => setMobileMenuOpen(true)}
                className="nav-icon p-2 rounded-full hover:bg-white/10 transition-colors"
                style={{ color: "rgb(255,255,255)" }}>
                <Menu className="w-5 h-5" />
              </button>
            </div>
            <div className="absolute left-5 md:hidden">
              <button type="button" aria-label="ހޯދާ" onClick={openSearch}
                className="nav-icon p-2 rounded-full hover:bg-white/10 transition-colors"
                style={{ color: "rgb(255,255,255)" }}>
                <Search className="w-[18px] h-[18px]" />
              </button>
            </div>
            <div className="absolute left-5 md:left-6 hidden md:flex items-center gap-3">
              <button type="button" aria-label="ހޯދާ" onClick={openSearch}
                className="nav-icon p-2 rounded-full hover:bg-black/5 transition-colors"
                style={{ color: "rgb(255,255,255)" }}>
                <Search className="w-[18px] h-[18px]" />
              </button>
              <Link href="/login"
                className="nav-icon p-2 rounded-full hover:bg-black/5 transition-colors"
                style={{ color: "rgb(255,255,255)" }}>
                <User className="w-[18px] h-[18px]" />
              </Link>
            </div>
          </div>
        </div>

        {/* Cat bar */}
        <div
          ref={catBarRef}
          className="hidden md:block will-change-transform"
          style={{
            position: "absolute", top: 0, left: 0, right: 0,
            height: `${CAT_BAR_HEIGHT}px`,
            backgroundColor: "rgb(249,248,245)",
            borderBottom: "1px solid rgb(224,221,214)",
            transform: `translateY(110vh) ${GPU}`,
            visibility: "hidden",
            opacity: 0,
          }}
        >
          <div className="max-w-7xl mx-auto px-6 h-full">
            <div className="flex items-center justify-center gap-1 h-full">
              {categories.map((cat) => (
                <Link key={cat.id} href={`/${cat.slug}`}
                  target={cat.slug === "originals" ? "_blank" : undefined}
                  rel={cat.slug === "originals" ? "noopener noreferrer" : undefined}
                  className="whitespace-nowrap px-4 py-2 transition-colors hover:text-[rgb(26,26,26)]"
                  style={{ fontFamily: "'MVTypewriter','MV Boli',sans-serif", fontSize: "13px", color: "rgb(153,153,153)" }}>
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Compact desktop */}
      <div
        ref={compactDesktopRef}
        className="fixed top-0 right-0 left-0 z-50 hidden md:block will-change-transform"
        style={{
          height: `${COMPACT_HEIGHT}px`,
          backgroundColor: "rgb(249,248,245)",
          borderBottom: "1px solid rgb(224,221,214)",
          transform: `translateY(-${COMPACT_HEIGHT}px) ${GPU}`,
          transition: "transform 0.3s ease",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between" dir="rtl">
          <Link href="/" className="flex items-center flex-shrink-0">
            <Image src="/logo.svg" alt="މެރިހާنaa" width={32} height={32} className="object-contain" />
          </Link>
          <div className="flex items-center overflow-x-auto no-scrollbar">
            {categories.map((cat, i) => (
              <span key={cat.id} className="flex items-center">
                <Link href={`/${cat.slug}`}
                  className="whitespace-nowrap px-3 py-1 transition-colors hover:text-[rgb(26,26,26)]"
                  style={{ fontFamily: "'MVTypewriter','MV Boli',sans-serif", fontSize: "12px", color: "rgb(153,153,153)" }}>
                  {cat.name}
                </Link>
                {i < categories.length - 1 && (
                  <span style={{ color: "rgb(210,207,200)", fontSize: "10px", userSelect: "none" }}>·</span>
                )}
              </span>
            ))}
          </div>
          <button type="button" aria-label="ހޯދާ" onClick={openSearch}
            className="p-2 rounded-full hover:bg-black/5 transition-colors flex-shrink-0"
            style={{ color: "rgb(26,26,26)" }}>
            <Search className="w-[16px] h-[16px]" />
          </button>
        </div>
      </div>

      {/* Compact mobile */}
      <div
        ref={compactMobileRef}
        className="fixed top-0 right-0 left-0 z-50 md:hidden will-change-transform"
        style={{
          height: `${COMPACT_HEIGHT}px`,
          backgroundColor: "rgb(249,248,245)",
          borderBottom: "1px solid rgb(224,221,214)",
          transform: `translateY(-${COMPACT_HEIGHT}px) ${GPU}`,
          transition: "transform 0.3s ease",
        }}
      >
        <div className="px-5 h-full flex items-center justify-between" dir="rtl">
          <Link href="/" className="flex items-center flex-shrink-0">
            <Image src="/logo.svg" alt="މެރިހާنaa" width={32} height={32} className="object-contain" />
          </Link>
          <div className="flex items-center gap-1">
            <button type="button" aria-label="ހޯދާ" onClick={openSearch}
              className="p-2 rounded-full hover:bg-black/5 transition-colors"
              style={{ color: "rgb(26,26,26)" }}>
              <Search className="w-[16px] h-[16px]" />
            </button>
            <button type="button" onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-full hover:bg-black/5 transition-colors"
              style={{ color: "rgb(26,26,26)" }}>
              <Menu className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>
      </div>

      {searchOpen && (
        <SearchDropdown
          searchRef={searchRef} searchQuery={searchQuery} searchResults={searchResults}
          searchLoading={searchLoading} onInput={handleSearchInput} onKeyDown={handleKeyDown}
          onClose={closeSearch}
          topOffset={homeCompactRef.current ? COMPACT_HEIGHT : LOGO_BAR_HEIGHT}
        />
      )}
      {searchOpen && <div className="fixed inset-0 z-[55]" onClick={closeSearch} />}
      <MobileMenu
        categories={categories} open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        topOffset={homeCompactRef.current ? COMPACT_HEIGHT : LOGO_BAR_HEIGHT}
      />
    </>
  );
}

// ── Search dropdown ───────────────────────────────────────────────────────────
function SearchDropdown({
  searchRef, searchQuery, searchResults, searchLoading,
  onInput, onKeyDown, onClose, topOffset,
}: {
  searchRef: React.RefObject<HTMLInputElement>;
  searchQuery: string;
  searchResults: SearchResult[];
  searchLoading: boolean;
  onInput: (val: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onClose: () => void;
  topOffset: number;
}) {
  const router = useRouter();
  return (
    <div className="fixed left-0 right-0 z-[60] bg-[#F5F3EF] border-b border-black/10 shadow-sm" style={{ top: `${topOffset}px` }}>
      <div className="max-w-2xl mx-auto px-6 py-4">
        <div className="flex items-center gap-3 border border-black/15 rounded-full px-4 py-2.5 bg-white">
          <Search className="w-4 h-4 text-black/30 flex-shrink-0" />
          <input
            ref={searchRef} type="text" value={searchQuery}
            onChange={(e) => onInput(e.target.value)} onKeyDown={onKeyDown}
            placeholder="ހޯދާ..." dir="rtl"
            className="flex-1 bg-transparent outline-none text-[15px]"
            style={{ fontFamily: '"MVTypewriter","Noto Sans Thaana",sans-serif', color: "rgb(26,26,26)" }}
          />
          <button type="button" onClick={onClose}
            className="text-[12px] text-black/40 hover:text-black/70 transition-colors flex-shrink-0"
            style={{ fontFamily: '"MVTypewriter",sans-serif' }}>
            ކެންސަލް
          </button>
        </div>
        {searchQuery.trim().length >= 2 && (
          <div className="mt-3 pb-2">
            {searchLoading && (
              <p className="text-center py-4" style={{ fontFamily: '"MVTypewriter",sans-serif', fontSize: "12px", color: "rgb(160,158,152)" }}>ހޯދަނީ...</p>
            )}
            {!searchLoading && searchResults.length > 0 && (
              <>
                <p className="mb-2" style={{ fontFamily: '"MVTypewriter","Noto Sans Thaana",sans-serif', fontSize: "11px", color: "rgb(160,158,152)", lineHeight: 2 }}>ނަތީޖާ</p>
                <div className="space-y-0">
                  {searchResults.slice(0, 5).map((result) => (
                    <Link key={result.id} href={`/${result.category?.slug ?? "article"}/${result.slug}`} onClick={onClose}
                      className="flex items-center justify-between py-3 border-b border-black/6 hover:opacity-60 transition-opacity">
                      <h3 style={{ fontFamily: '"MVTypewriter","Noto Sans Thaana",sans-serif', fontSize: "14px", fontWeight: 700, color: "rgb(26,26,26)", lineHeight: 1.6 }}>
                        {result.title}
                      </h3>
                      {result.category && (
                        <span className="flex-shrink-0 mr-4 text-[10px] px-2.5 py-1 rounded-full border" style={{
                          fontFamily: "'MVTypewriter',sans-serif", color: "rgb(100,100,100)",
                          borderColor: "rgb(210,207,200)", backgroundColor: "rgb(240,239,233)", lineHeight: 2,
                        }}>
                          {result.category.name}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <Link href={`/search?q=${encodeURIComponent(searchQuery.trim())}`} onClick={onClose}
                    className="inline-flex items-center justify-center px-6 py-2.5 rounded-full transition-colors hover:opacity-80"
                    style={{ backgroundColor: "rgb(26,26,26)", color: "rgb(249,248,245)", fontFamily: '"MVTypewriter","Noto Sans Thaana",sans-serif', fontSize: "12px", fontWeight: 700 }}>
                    އިތުރު އާޓިކަލް ބެލުމަށް
                  </Link>
                </div>
              </>
            )}
            {!searchLoading && searchResults.length === 0 && (
              <p className="text-center py-4" style={{ fontFamily: '"MVTypewriter","Noto Sans Thaana",sans-serif', fontSize: "13px", color: "rgb(160,158,152)", lineHeight: 2 }}>ނަތީޖާ ނެތް</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Mobile menu ───────────────────────────────────────────────────────────────
function MobileMenu({ categories, open, onClose, topOffset }: {
  categories: Category[];
  open: boolean;
  onClose: () => void;
  topOffset: number;
}) {
  return (
    <div
      className="fixed inset-0 z-[55] transition-opacity duration-300"
      style={{
        backgroundColor: "rgb(249,248,245)",
        top: `${topOffset}px`,
        opacity: open ? 1 : 0,
        pointerEvents: open ? "auto" : "none",
      }}
    >
      <button type="button" onClick={onClose} className="absolute top-4 left-5 p-2 hover:bg-black/5 rounded-full text-[rgb(26,26,26)]">
        <X className="w-5 h-5" />
      </button>
      <div className="h-full overflow-y-auto px-8 py-12 max-w-md mx-auto flex flex-col" dir="rtl">
        <nav className="flex-1">
          {categories.map((cat, i) => (
            <div key={cat.id} style={{
              opacity: open ? 1 : 0,
              transform: open ? "translateX(0)" : "translateX(20px)",
              transition: `opacity 0.3s ease ${i * 0.04}s, transform 0.3s ease ${i * 0.04}s`,
            }}>
              <Link href={`/${cat.slug}`}
                onClick={cat.slug === "originals" ? undefined : onClose}
                target={cat.slug === "originals" ? "_blank" : undefined}
                rel={cat.slug === "originals" ? "noopener noreferrer" : undefined}
                className="block py-3 border-b border-[#e0ddd6]/60 transition-colors text-[#999] hover:text-[#333]"
                style={{ fontFamily: "'MVTypewriter','MV Boli',sans-serif", fontSize: "1.2rem" }}>
                {cat.name}
              </Link>
            </div>
          ))}
        </nav>
        <div className="pt-6 mt-6 border-t border-[#e0ddd6]/60" style={{
          opacity: open ? 1 : 0,
          transform: open ? "translateX(0)" : "translateX(20px)",
          transition: `opacity 0.3s ease ${categories.length * 0.04 + 0.1}s, transform 0.3s ease ${categories.length * 0.04 + 0.1}s`,
        }}>
          <Link href="/login" onClick={onClose}
            className="flex items-center gap-3 py-3 transition-colors text-[#999] hover:text-[#333]"
            style={{ fontFamily: "'MVTypewriter','MV Boli',sans-serif", fontSize: "1rem" }}>
            <User className="w-4 h-4 flex-shrink-0" />
            ސައިން އިން
          </Link>
        </div>
      </div>
    </div>
  );
}
