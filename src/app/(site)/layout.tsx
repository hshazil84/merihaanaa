// app/(site)/layout.tsx
import { createServerSupabaseClient } from "@/lib/supabase/server";
import NavWrapper from "@/components/public/NavWrapper";
import MainWrapper from "@/components/public/MainWrapper";
import PublicFooter from "@/components/public/PublicFooter";

async function getCategories() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("is_visible", true)
    .order("sort_order");
  return data ?? [];
}

async function isAdminUser() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();
    return profile && ["admin", "editor", "author"].includes(profile.role);
  } catch {
    return false;
  }
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [categories, isAdmin] = await Promise.all([getCategories(), isAdminUser()]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#F5F3EF]" dir="rtl">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF]" dir="rtl">
      <NavWrapper categories={categories} />
      <MainWrapper>{children}</MainWrapper>
      <PublicFooter categories={categories} />
    </div>
  );
}
