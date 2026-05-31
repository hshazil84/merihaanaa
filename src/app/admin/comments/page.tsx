import { createServerSupabaseClient } from "@/lib/supabase/server";
import CommentsClient from "./CommentsClient";

export const dynamic = "force-dynamic";

export default async function CommentsPage() {
  const supabase = await createServerSupabaseClient();

  const { data: comments } = await supabase
    .from("comments")
    .select(`
      id,
      body,
      is_approved,
      created_at,
      article_id,
      articles!comments_article_id_fkey (id, title, slug),
      user_profiles!comments_user_id_fkey (full_name, avatar)
    `)
    .order("created_at", { ascending: false });

  return <CommentsClient comments={comments ?? []} />;
}
