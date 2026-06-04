// src/app/originals/layout.tsx
"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function OriginalsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") { setSearchOpen(false); setSearchQuery(""); }
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false); setSearchQuery("");
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 md:px-8 py-3 bg-gradient-to-b from-black/90 to-transparent">
        {/* Left — search */}
        <div className="flex items-center gap-2">
          {!searchOpen ? (
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-full text-white/60 hover:text-white transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
              <Search className="w-4 h-4 text-white/40 flex-none" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="ހޯދާ..."
                dir="rtl"
                className="bg-transparent outline-none text-sm text-white placeholder-white/30 w-40"
                style={{ fontFamily: "MVTypewriter, serif" }}
              />
              <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }} className="text-white/40 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Right — logo */}
        <Link href="/" className="opacity-90 hover:opacity-100 transition-opacity">
          <Image
            src="/logo.png"
            alt="މެރިހާނާ"
            width={100}
            height={30}
            className="h-7 w-auto object-contain"
            priority
          />
        </Link>
      </header>
      {children}
    </div>
  );
}
