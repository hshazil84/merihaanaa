// app/(article)/layout.tsx
// Static layout for article reader, category, search, tag pages
// Nav is always locked at top — no scroll tracking

import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";

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

export default async function ArticleLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategories();
  return (
    <div className="min-h-screen bg-[#F5F3EF]" dir="rtl">
      <PublicNav categories={categories} static />
      {/* 72px logo bar + 56px category bar */}
      <div style={{ paddingTop: "128px" }}>
        <main>{children}</main>
        <PublicFooter categories={categories} />
      </div>
    </div>
  );
}
