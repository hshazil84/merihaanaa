// src/app/originals/layout.tsx
import Link from "next/link";
import Image from "next/image";

export default function OriginalsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Minimal top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <Link href="/" className="pointer-events-auto opacity-80 hover:opacity-100 transition-opacity">
          <Image
            src="/logo.png"
            alt="މެރިހާނާ"
            width={80}
            height={24}
            className="h-6 w-auto object-contain invert"
            priority
          />
        </Link>
        <Link
          href="/originals"
          className="pointer-events-auto text-xs text-white/60 hover:text-white transition-colors"
          style={{ fontFamily: "MVTypewriter, serif" }}
        >
          ހުރިހާ ވިޑިއޯ
        </Link>
      </header>
      {children}
    </div>
  );
}
