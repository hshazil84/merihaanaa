"use client";
import { usePathname } from "next/navigation";
export default function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  return (
    <main style={{ paddingTop: isHome ? "0" : "128px" }}
      className={isHome ? "" : "md:pt-[128px] pt-[72px]"}
    >
      {children}
    </main>
  );
}
