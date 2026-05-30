// app/(site)/layout.tsx
import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import NavWrapper from "@/components/public/NavWrapper";
import MainWrapper from "@/components/public/MainWrapper";
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

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategories();
  return (
    <div className="min-h-screen bg-[#F5F3EF]" dir="rtl">
      <NavWrapper categories={categories} />
      <MainWrapper>{children}</MainWrapper>
      <PublicFooter categories={categories} />
    </div>
  );
}
