// app/(site)/layout.tsx
// Single layout for all public pages. Nav + padding adapt via client wrappers.

import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import NavWrapper from "@/components/public/NavWrapper";
import MainWrapper from "@/components/public/MainWrapper";
import PublicFooter from "@/components/public/PublicFooter";

export const metadata: Metadata = {
    title: { default: "\u0645\u06AC\u0631\u0650\u0647\u0627\u0646\u0627", template: "%s | \u0645\u06AC\u0631\u0650\u0647\u0627\u0646\u0627" },
    description: "People. Reviews. Stories.",
    openGraph: { siteName: "\u0645\u06AC\u0631\u0650\u0647\u0627\u0646\u0627", locale: "dv_MV" },
};

async function getCategories() {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("categories")
      .select("id, name, slug")
      .order("name");
    return data ?? [];
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
    const categories = await getCategories();
    return (
          <div className="min-h-screen bg-[#F5F3EF]" dir="rtl">
                <NavWrapper categories={categories} />
                <MainWrapper>{children}</MainWrapper>MainWrapper>
                <PublicFooter categories={categories} />
          </div>div>
        );
}
</div>
