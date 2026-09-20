"use client";
// components/public/PublicNav.tsx
// Home: only the transparent hero logo bar — fades out as the in-flow
// CategoryBar (sticky) approaches the top and takes over as the nav.
// Static pages: unchanged compact/logo bars.

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
const COMPACT_HEIGHT  = 48;
const CAT_BAR_HEIGHT  = 56;

export default function PublicNav({ categories, static: isStatic = false }: Props) {
  const router = useRouter();

  // Home: hero logo bar visible until the cat bar gets close to the top
  const [heroVisible, setHeroVisible] = useState(true);
  const heroVisibleRef = useRef(true);
  heroVisibleRef.current = heroVisible;

  // Home mobile: compact bar slides in on scroll-up past the hero
  const [mobileCompactVisible, setMobileCompactVisible] = useState(false);
  const mobileCompactRef = useRef(false);
  mobileCompactRef.current = mobileCompactVisible;

  // Static mobile: hide logo bar on scroll down
  const [staticVisible, setStaticVisible] = useState(true);
  const staticVisibleRef = useRef(true);
  staticVisibleRef.current = staticVisible;
  const lastScrollY = useRef(0);

  const [searchOpen, setSearchOpen]         = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery]       = useState("");
  const [searchResults, setSearchResults]   = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading]   = useState(false);
  const [selectedIndex, setSelectedIndex]   = useState(-1);
  const searchRef   = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<NodeJS.Timeout | null>(null);

  // ── Home scroll: fade hero logo bar before the cat bar arrives ───────────
  useEffect(() => {
    if (isStatic) return;

    let ticking = false;

    const update = () => {
      const scrollY  = window.scrollY;
      const isMobile = window.innerWidth < 768;

      // Desktop: hero is 100svh - CAT_BAR_HEIGHT, fade before the cat bar arrives.
      // Mobile: hero is full 100svh (no cat bar), fade near the hero bottom.
      const fadePoint = isMobile
        ? window.innerHeight - 150
        : window.innerHeight - CAT_BAR_HEIGHT - 150;
      const visible = scrollY < fadePoint;
      if (visible !== heroVisibleRef.current) setHeroVisible(visible);

      // Mobile compact bar: show on scroll-up past the hero, hide on scroll-down
      if (isMobile) {
        const delta = scrollY - lastScrollY.current;
        const pastHero = scrollY > window.innerHeight - 80;
        if (pastHero && delta < -6 && !mobileCompactRef.current) {
          setMobileCompactVisible(true);
        } else if ((delta > 6 || !pastHero) && mobileCompactRef.current) {
          setMobileCompactVisible(false);
        }
        lastScrollY.current = scrollY;
      }

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

  // ── Static pages: mobile logo bar hides on scroll down ───────────────────
  useEffect(() => {
    if (!isStatic) return;

    let ticking = false;

    const update = () => {
      const scrollY = window.scrollY;
      const delta   = scrollY - lastScrollY.current;

      if (scrollY > 80 && delta > 6 && staticVisibleRef.current) {
        setStaticVisible(false);
      } else if ((delta < -6 || scrollY <= 80) && !staticVisibleRef.current) {
        setStaticVisible(true);
      }

      lastScrollY.current = scrollY;
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
    setSelectedIndex(-1);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (val.trim().length < 2) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch("/api/search?q=" + encodeURIComponent(val.trim()));
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
    setSelectedIndex(-1);
    setTimeout(() => searchRef.current?.focus(), 100);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { closeSearch(); return; }

    if (e.key === "ArrowDown" && searchResults.length > 0) {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, Math.min(searchResults.length, 5) - 1));
      return;
    }
    if (e.key === "ArrowUp" && searchResults.length > 0) {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      const picked = selectedIndex >= 0 ? searchResults[selectedIndex] : null;
      if (picked) {
        router.push("/" + (picked.category?.slug ?? "article") + "/" + picked.slug);
        closeSearch();
      } else if (searchQuery.trim()) {
        router.push("/search?q=" + encodeURIComponent(searchQuery.trim()));
        closeSearch();
      }
    }
  };

  // ── Static pages render ───────────────────────────────────────────────────
  if (isStatic) {
    return (
      <>
        {/* DESKTOP: always-compact single bar */}
        <div
          className="hidden md:block fixed top-0 right-0 left-0 z-50"
          style={{
            height: COMPACT_HEIGHT + "px",
            backgroundColor: "rgb(249,248,245)",
            borderBottom: "1px solid rgb(224,221,214)",
          }}
        >
          <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between" dir="rtl">
            <Link href="/" className="flex items-center flex-shrink-0">
              <Image src="/logo.svg" alt="މެރިހާނާ" width={32} height={32} className="object-contain" />
            </Link>
            <div className="flex items-center overflow-x-auto no-scrollbar">
              {categories.map((cat, i) => (
                <span key={cat.id} className="flex items-center">
                  <Link href={"/" + cat.slug}
                    target={cat.slug === "originals" ? "_blank" : undefined}
                    rel={cat.slug === "originals" ? "noopener noreferrer" : undefined}
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
            <div className="flex items-center gap-1 flex-shrink-0">
              <button type="button" aria-label="ހޯދާ" onClick={openSearch}
                className="p-2 rounded-full hover:bg-black/5 transition-colors"
                style={{ color: "rgb(26,26,26)" }}>
                <Search className="w-[16px] h-[16px]" />
              </button>
              <Link href="/login" aria-label="ސައިން އިން" className="p-2 rounded-full hover:bg-black/5 transition-colors" style={{ color: "rgb(26,26,26)" }}>
                <User className="w-[16px] h-[16px]" />
              </Link>
            </div>
          </div>
        </div>

        {/* MOBILE: logo bar, slides away on scroll down */}
        <div
          className="md:hidden fixed top-0 right-0 left-0 z-50"
          style={{
            transform: staticVisible ? "translateY(0)" : "translateY(-100%)",
            transition: "transform 0.28s ease",
          }}
        >
          <header style={{ height: LOGO_BAR_HEIGHT + "px", backgroundColor: "rgb(249,248,245)", borderBottom: "1px solid rgb(224,221,214)" }}>
            <div className="px-5 h-full flex items-center justify-center relative">
              <Link href="/" className="flex items-center">
                <Image src="/logo.svg" alt="މެރިހާނާ" width={48} height={48} priority className="object-contain" />
              </Link>
              <div className="absolute right-5">
                <button type="button" aria-label="މެނޫ" onClick={() => setMobileMenuOpen(true)}
                  className="p-2 rounded-full hover:bg-black/5 transition-colors"
                  style={{ color: "rgb(26,26,26)" }}>
                  <Menu className="w-5 h-5" />
                </button>
              </div>
              <div className="absolute left-5">
                <button type="button" aria-label="ހޯދާ" onClick={openSearch}
                  className="p-2 rounded-full hover:bg-black/5 transition-colors"
                  style={{ color: "rgb(26,26,26)" }}>
                  <Search className="w-[18px] h-[18px]" />
                </button>
              </div>
            </div>
          </header>
        </div>

        <div
          className="fixed inset-0 z-[54] transition-opacity duration-300"
          style={{
            backgroundColor: "rgba(20,18,15,0.4)",
            backdropFilter: "blur(3px)",
            WebkitBackdropFilter: "blur(3px)",
            opacity: searchOpen ? 1 : 0,
            pointerEvents: searchOpen ? "auto" : "none",
          }}
          onClick={closeSearch}
        />
        <SearchDropdown
          open={searchOpen}
          searchRef={searchRef} searchQuery={searchQuery} searchResults={searchResults}
          searchLoading={searchLoading} selectedIndex={selectedIndex}
          onInput={handleSearchInput} onKeyDown={handleKeyDown}
          onHoverIndex={setSelectedIndex}
          onClose={closeSearch}
          topOffset={LOGO_BAR_HEIGHT}
        />
        <MobileMenu
          categories={categories} open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          topOffset={LOGO_BAR_HEIGHT}
        />
      </>
    );
  }

  // ── Home page render: hero logo bar only ─────────────────────────────────
  return (
    <>
        <div
          className="fixed top-0 right-0 left-0 z-50"
          style={{
            height: LOGO_BAR_HEIGHT + "px",
            opacity: heroVisible || mobileMenuOpen ? 1 : 0,
            pointerEvents: heroVisible || mobileMenuOpen ? "auto" : "none",
            backgroundColor: mobileMenuOpen ? "rgb(249,248,245)" : "transparent",
            transition: "opacity 0.3s ease, background-color 0.25s ease",
          }}
        >
        <div className="max-w-7xl mx-auto px-5 md:px-6 h-full flex items-center justify-center relative">
          <Link href="/" className="flex items-center">
            <Image src="/logo.svg" alt="މެރިހާނާ" width={60} height={60} priority className="object-contain" />
          </Link>
          <div className="absolute right-5 md:hidden">
            <button type="button" aria-label="މެނޫ" onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              style={{ color: "rgb(255,255,255)" }}>
              <Menu className="w-5 h-5" />
            </button>
          </div>
          <div className="absolute left-5 md:hidden">
            <button type="button" aria-label="ހޯދާ" onClick={openSearch}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              style={{ color: "rgb(255,255,255)" }}>
              <Search className="w-[18px] h-[18px]" />
            </button>
          </div>
          <div className="absolute left-5 md:left-6 hidden md:flex items-center gap-3">
            <button type="button" aria-label="ހޯދާ" onClick={openSearch}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              style={{ color: "rgb(255,255,255)" }}>
              <Search className="w-[18px] h-[18px]" />
            </button>
            <Link href="/login" aria-label="ސައިން އިން"
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              style={{ color: "rgb(255,255,255)" }}>
              <User className="w-[18px] h-[18px]" />
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile compact bar — slides in on scroll-up past the hero */}
      <div
        className="md:hidden fixed top-0 right-0 left-0 z-50"
        style={{
          height: COMPACT_HEIGHT + "px",
          backgroundColor: "rgb(249,248,245)",
          borderBottom: "1px solid rgb(224,221,214)",
          transform: mobileCompactVisible ? "translateY(0)" : "translateY(-100%)",
          transition: "transform 0.28s ease",
        }}
      >
        <div className="px-5 h-full flex items-center justify-between" dir="rtl">
          <Link href="/" className="flex items-center flex-shrink-0"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
            <Image src="/logo.svg" alt="މެރިހާނާ" width={32} height={32} className="object-contain" />
          </Link>
          <div className="flex items-center gap-1">
            <button type="button" aria-label="ހޯދާ" onClick={openSearch}
              className="p-2 rounded-full hover:bg-black/5 transition-colors"
              style={{ color: "rgb(26,26,26)" }}>
              <Search className="w-[16px] h-[16px]" />
            </button>
            <button type="button" aria-label="މެނޫ" onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-full hover:bg-black/5 transition-colors"
              style={{ color: "rgb(26,26,26)" }}>
              <Menu className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>
      </div>

      <div
        className="fixed inset-0 z-[54] transition-opacity duration-300"
        style={{
          backgroundColor: "rgba(20,18,15,0.4)",
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
          opacity: searchOpen ? 1 : 0,
          pointerEvents: searchOpen ? "auto" : "none",
        }}
        onClick={closeSearch}
      />
      <SearchDropdown
        open={searchOpen}
        searchRef={searchRef} searchQuery={searchQuery} searchResults={searchResults}
        searchLoading={searchLoading} selectedIndex={selectedIndex}
        onInput={handleSearchInput} onKeyDown={handleKeyDown}
        onHoverIndex={setSelectedIndex}
        onClose={closeSearch}
        topOffset={heroVisible ? LOGO_BAR_HEIGHT : CAT_BAR_HEIGHT}
      />
      <MobileMenu
        categories={categories} open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        topOffset={heroVisible ? LOGO_BAR_HEIGHT : CAT_BAR_HEIGHT}
      />
    </>
  );
}

// ── Search dropdown ───────────────────────────────────────────────────────────
function SearchDropdown({
  open, searchRef, searchQuery, searchResults, searchLoading, selectedIndex,
  onInput, onKeyDown, onHoverIndex, onClose, topOffset,
}: {
  open: boolean;
  searchRef: React.RefObject<HTMLInputElement>;
  searchQuery: string;
  searchResults: SearchResult[];
  searchLoading: boolean;
  selectedIndex: number;
  onInput: (val: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onHoverIndex: (i: number) => void;
  onClose: () => void;
  topOffset: number;
}) {
  const visibleResults = searchResults.slice(0, 5);

  return (
    <div
      className="fixed left-0 right-0 z-[60] flex justify-center px-4 transition-all duration-300 ease-out"
      style={{
        top: topOffset + "px",
        opacity: open ? 1 : 0,
        transform: open ? "translateY(0)" : "translateY(-10px)",
        pointerEvents: open ? "auto" : "none",
      }}
    >
      <div
        className="w-full max-w-2xl mt-3 rounded-2xl overflow-hidden"
        style={{ backgroundColor: "#F5F3EF", boxShadow: "0 20px 50px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.06)" }}
      >
        <div className="p-5">
          <div
            className="flex items-center gap-3 rounded-full px-4 py-3 bg-white transition-shadow"
            style={{ boxShadow: "inset 0 0 0 1.5px rgba(0,0,0,0.1)" }}
          >
            <Search className="w-4 h-4 text-black/30 flex-shrink-0" />
            <input
              ref={searchRef} type="text" value={searchQuery}
              onChange={(e) => onInput(e.target.value)} onKeyDown={onKeyDown}
              placeholder="ހޯދާ..." dir="rtl"
              className="flex-1 bg-transparent outline-none text-[15px]"
              style={{ fontFamily: '"MVTypewriter","Noto Sans Thaana",sans-serif', color: "rgb(26,26,26)" }}
            />
            <button type="button" aria-label="ބަންދުކުރޭ" onClick={onClose}
              className="flex-shrink-0 p-1.5 rounded-full hover:bg-black/5 transition-colors text-black/40 hover:text-black/70">
              <X className="w-4 h-4" />
            </button>
          </div>

          {searchQuery.trim().length >= 2 && (
            <div className="mt-4 pb-1">
              {searchLoading && (
                <div className="flex items-center justify-center gap-2 py-6">
                  <span
                    className="w-3.5 h-3.5 rounded-full border-2 border-black/15 animate-spin"
                    style={{ borderTopColor: "rgb(26,26,26)" }}
                  />
                  <p style={{ fontFamily: '"MVTypewriter",sans-serif', fontSize: "12px", color: "rgb(160,158,152)" }}>ހޯދަނީ...</p>
                </div>
              )}
              {!searchLoading && visibleResults.length > 0 && (
                <>
                  <p className="mb-1 px-1" style={{ fontFamily: '"MVTypewriter","Noto Sans Thaana",sans-serif', fontSize: "11px", color: "rgb(160,158,152)", lineHeight: 2 }}>ނަތީޖާ</p>
                  <div className="space-y-0.5">
                    {visibleResults.map((result, i) => {
                      const active = i === selectedIndex;
                      return (
                        <Link key={result.id} href={"/" + (result.category?.slug ?? "article") + "/" + result.slug} onClick={onClose}
                          onMouseEnter={() => onHoverIndex(i)}
                          className="flex items-center justify-between gap-3 py-3 px-3 rounded-xl transition-colors"
                          style={{ backgroundColor: active ? "rgba(0,0,0,0.045)" : "transparent" }}>
                          <span
                            className="text-[13px] flex-shrink-0 transition-transform"
                            style={{ color: "rgb(186,42,49)", transform: active ? "translateX(-2px)" : "translateX(0)" }}
                          >
                            ←
                          </span>
                          <h3 className="flex-1" style={{ fontFamily: '"MVTypewriter","Noto Sans Thaana",sans-serif', fontSize: "14px", fontWeight: 700, color: "rgb(26,26,26)", lineHeight: 1.6 }}>
                            {result.title}
                          </h3>
                          {result.category && (
                            <span className="flex-shrink-0 text-[10px] px-2.5 py-1 rounded-full border" style={{
                              fontFamily: "'MVTypewriter',sans-serif", color: "rgb(100,100,100)",
                              borderColor: "rgb(210,207,200)", backgroundColor: "rgb(240,239,233)", lineHeight: 2,
                            }}>
                              {result.category.name}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                  <div className="mt-4 text-center">
                    <Link href={"/search?q=" + encodeURIComponent(searchQuery.trim())} onClick={onClose}
                      className="inline-flex items-center justify-center px-6 py-2.5 rounded-full transition-colors hover:opacity-80"
                      style={{ backgroundColor: "rgb(26,26,26)", color: "rgb(249,248,245)", fontFamily: '"MVTypewriter","Noto Sans Thaana",sans-serif', fontSize: "12px", fontWeight: 700 }}>
                      އިތުރު އާޓިކަލް ބެލުމަށް
                    </Link>
                  </div>
                </>
              )}
              {!searchLoading && visibleResults.length === 0 && (
                <p className="text-center py-6" style={{ fontFamily: '"MVTypewriter","Noto Sans Thaana",sans-serif', fontSize: "13px", color: "rgb(160,158,152)", lineHeight: 2 }}>ނަތީޖާ ނެތް</p>
              )}
            </div>
          )}
        </div>
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
        top: topOffset + "px",
        opacity: open ? 1 : 0,
        pointerEvents: open ? "auto" : "none",
      }}
    >
      <button type="button" aria-label="ބަންދުކުރޭ" onClick={onClose} className="absolute top-4 left-5 p-2 hover:bg-black/5 rounded-full text-[rgb(26,26,26)]">
        <X className="w-5 h-5" />
      </button>
      <div className="h-full overflow-y-auto px-8 py-12 max-w-md mx-auto flex flex-col" dir="rtl">
        <nav className="flex-1">
          {categories.map((cat, i) => (
            <div key={cat.id} style={{
              opacity: open ? 1 : 0,
              transform: open ? "translateX(0)" : "translateX(20px)",
              transition: "opacity 0.3s ease " + (i * 0.04) + "s, transform 0.3s ease " + (i * 0.04) + "s",
            }}>
              <Link href={"/" + cat.slug}
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
          transition: "opacity 0.3s ease " + (categories.length * 0.04 + 0.1) + "s, transform 0.3s ease " + (categories.length * 0.04 + 0.1) + "s",
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
