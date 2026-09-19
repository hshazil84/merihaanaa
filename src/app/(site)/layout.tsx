// app/(site)/layout.tsx
import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import NavWrapper from "@/components/public/NavWrapper";
import MainWrapper from "@/components/public/MainWrapper";
import PublicFooter from "@/components/public/PublicFooter";

// Public, non-user-specific data — use a plain client (no cookies) so this
// can be memoized across requests/users instead of refetched every load.
const getCategories = unstable_cache(
  async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase
      .from("categories")
      .select("id, name, slug")
      .eq("is_visible", true)
      .order("sort_order");
    return data ?? [];
  },
  ["site-categories"],
  { revalidate: 300, tags: ["categories"] }
);

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
