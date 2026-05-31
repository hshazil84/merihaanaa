import { createServerSupabaseClient } from "@/lib/supabase/server";
import CommentsClient from "./CommentsClient";

export const dynamic = "force-dynamic";

export default async function CommentsPage() {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("comments")
    .select(`
      id,
      body,
      is_approved,
      created_at,
      article_id,
      articles!comments_article_id_fkey (id, title, slug)
    `)
    .order("created_at", { ascending: false });

  const comments = (data ?? []).map((c: any) => ({
    ...c,
    articles: Array.isArray(c.articles) ? c.articles[0] ?? null : c.articles,
  }));

  return <CommentsClient comments={comments} />;
}
