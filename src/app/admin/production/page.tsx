// src/app/admin/production/page.tsx
import { createServerSupabaseClient } from "@/lib/supabase/server";
import ProductionClient from "./ProductionClient";

export const dynamic = "force-dynamic";

export default async function ProductionPage() {
  const supabase = await createServerSupabaseClient();

  const [{ data: articles }, { data: categories }] = await Promise.all([
    supabase.from("articles")
      .select("id, title, slug, status, category_id, published_at, scheduled_at, created_at, author:authors!author_id(id, full_name), category:categories!category_id(name, slug)")
      .not("status", "eq", "archived")
      .order("created_at", { ascending: false })
      .limit(300),
    supabase.from("categories").select("id, name, slug").eq("is_visible", true).order("sort_order"),
  ]);

  return (
    <ProductionClient
      articles={(articles ?? []) as any[]}
      categories={categories ?? []}
    />
  );
}
