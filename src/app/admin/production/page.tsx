// src/app/admin/production/page.tsx
import { createServerSupabaseClient } from "@/lib/supabase/server";
import ProductionClient from "./ProductionClient";

export const dynamic = "force-dynamic";

export default async function ProductionPage() {
  const supabase = await createServerSupabaseClient();

  const { data: articles } = await supabase
    .from("articles")
    .select("id, title, slug, status, category_id, published_at, scheduled_at, created_at, author:authors!author_id(id, full_name), category:categories!category_id(name, slug)")
    .not("status", "eq", "archived")
    .order("created_at", { ascending: false })
    .limit(200);

  return <ProductionClient articles={articles ?? []} />;
}
