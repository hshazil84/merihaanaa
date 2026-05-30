"use client";
// components/public/NavWrapper.tsx
// Decides nav behavior based on route:
//   "/"  → scroll nav (animates over the hero)
//   else → static nav (locked at top)

import { usePathname } from "next/navigation";
import PublicNav from "@/components/public/PublicNav";

interface Category { id: string; name: string; slug: string; }

export default function NavWrapper({ categories }: { categories: Category[] }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  return <PublicNav categories={categories} static={!isHome} />;
}
