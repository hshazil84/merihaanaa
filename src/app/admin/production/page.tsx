// src/app/admin/production/page.tsx
import { createServerSupabaseClient } from "@/lib/supabase/server";
import ProductionClient from "./ProductionClient";

export const dynamic = "force-dynamic";

export default async function ProductionPage() {
  const supabase = await createServerSupabaseClient();

  const [
    { data: articles },
    { data: categories },
    { data: team },
    { data: events },
    { data: tasks },
  ] = await Promise.all([
    supabase.from("articles")
      .select("id, title, slug, status, category_id, published_at, scheduled_at, created_at, author:authors!author_id(id, full_name), category:categories!category_id(name, slug)")
      .not("status", "eq", "archived")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("categories").select("id, name, slug").eq("is_visible", true).order("sort_order"),
    supabase.from("team").select("*").eq("is_active", true).order("full_name"),
    supabase.from("production_events")
      .select("*, schedule_items:production_schedule_items(*)")
      .order("event_date", { ascending: false }),
    supabase.from("production_tasks").select("*").order("created_at", { ascending: false }),
  ]);

  return (
    <ProductionClient
      articles={(articles ?? []) as any[]}
      categories={categories ?? []}
      team={team ?? []}
      events={(events ?? []) as any[]}
      tasks={tasks ?? []}
    />
  );
}
