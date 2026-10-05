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
      user_id,
      user_profiles (full_name, avatar),
      articles!comments_article_id_fkey (id, title, slug)
    `)
    .order("created_at", { ascending: false })
    .limit(500);

  const comments = (data ?? []).map((c: any) => ({
    ...c,
    articles: Array.isArray(c.articles) ? c.articles[0] ?? null : c.articles,
    user_profiles: Array.isArray(c.user_profiles) ? c.user_profiles[0] ?? null : c.user_profiles,
  }));

  return <CommentsClient comments={comments} />;
}
