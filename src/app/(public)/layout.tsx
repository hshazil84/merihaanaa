// app/(public)/layout.tsx

import type { Metadata } from "next";
import { headers } from "next/headers";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: { default: "މެރިހާނާ", template: "%s | މެރިހާނާ" },
  description: "People. Reviews. Stories.",
  openGraph: { siteName: "މެރިހާނާ", locale: "dv_MV" },
};

async function getCategories() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("categories").select("id, name, slug").order("name");
  return data ?? [];
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategories();

  // Check if we're on an article page — use static nav
  const headersList = headers();
  const pathname = headersList.get("x-pathname") ?? headersList.get("x-invoke-path") ?? "";
  const isArticlePage = pathname.startsWith("/news/") || pathname.startsWith("/category/");

  return (
    <div className="min-h-screen bg-[#F5F3EF]" dir="rtl">
      <PublicNav categories={categories} static={isArticlePage} />
      <main style={{ paddingTop: isArticlePage ? "128px" : "0" }}>
        {children}
      </main>
      <PublicFooter categories={categories} />
    </div>
  );
}
