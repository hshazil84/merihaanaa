"use client";
// components/public/MainWrapper.tsx
// Homepage: no top padding (hero sits under transparent nav).
// All other pages: 128px top padding (72px logo bar + 56px category bar).

import { usePathname } from "next/navigation";

export default function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  return (
    <main style={{ paddingTop: isHome ? "0" : "128px" }}>
      {children}
    </main>
  );
}
