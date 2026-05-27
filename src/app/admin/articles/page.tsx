// app/admin/articles/page.tsx
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ArticlesClient from "./ArticlesClient";

export const dynamic = "force-dynamic";

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string; q?: string };
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/admin/login");

  const page     = Number(searchParams.page ?? 1);
  const pageSize = 20;
  const status   = searchParams.status ?? "all";
  const q        = searchParams.q ?? "";

  let query = supabase
    .from("articles")
    .select(`
      id, title, slug, status, content_type,
      category_id, published_at, created_at, view_count,
      author:authors!author_id(id, full_name, avatar),
      category:categories!category_id(id, name)
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (status !== "all") query = query.eq("status", status);
  if (q.trim())         query = query.ilike("title", `%${q}%`);

  const { data: articles, count, error } = await query;
  if (error) console.error("Articles fetch error:", error.message);

  const mapped = (articles ?? []).map((a: any) => ({
    ...a,
    author: a.author ? {
      id: a.author.id,
      full_name: a.author.full_name,
      avatar_url: a.author.avatar,
    } : null,
  }));

  return (
    <ArticlesClient
      articles={mapped}
      totalCount={count ?? 0}
      page={page}
      pageSize={pageSize}
      currentStatus={status}
      currentQ={q}
    />
  );
}
