import { createServerSupabaseClient } from "@/lib/supabase/server";
import ProductionClient from "./ProductionClient";

export const dynamic = "force-dynamic";

export default async function ProductionPage() {
  const supabase = await createServerSupabaseClient();

  const [
    { data: articles },
    { data: categories },
    { data: team },
    { data: tasks },
    { data: projects },
  ] = await Promise.all([
    supabase.from("articles")
      .select("id, title, slug, status, category_id, published_at, scheduled_at, created_at, category:categories!category_id(name, slug)")
      .not("status", "eq", "archived")
      .order("created_at", { ascending: false })
      .limit(300),
    supabase.from("categories").select("id, name, slug").eq("is_visible", true).order("sort_order"),
    supabase.from("team").select("*").eq("is_active", true).order("full_name"),
    supabase.from("production_tasks").select("id, title, stage, due_date, assignee_ids, article_id, created_at").order("created_at", { ascending: false }),
    supabase.from("production_projects").select("id, title, description, stage, due_date, assignee_ids, created_at").order("created_at", { ascending: false }),
  ]);

  return (
    <ProductionClient
      articles={(articles ?? []) as any[]}
      categories={categories ?? []}
      team={team ?? []}
      tasks={(tasks ?? []) as any[]}
      projects={(projects ?? []) as any[]}
    />
  );
}
