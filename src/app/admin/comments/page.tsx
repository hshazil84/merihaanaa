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
      parent_id,
      articles!comments_article_id_fkey (id, title, slug, comments_locked, categories!category_id (slug))
    `)
    .order("created_at", { ascending: false })
    .limit(1000);

  const rows = (data ?? []) as any[];

  // Published articles, so any article can be locked even before it has comments
  const { data: artRows, error: artError } = await supabase
    .from("articles")
    .select("id, title, slug, comments_locked, categories!category_id (slug)")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(300);
  if (artError) console.error("admin/comments articles query failed:", artError.message);

  // Author names fetched separately (no dependency on a comments→user_profiles relationship)
  const userIds = Array.from(new Set(rows.map((c) => c.user_id).filter(Boolean)));
  const names = new Map<string, string>();
  if (userIds.length) {
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("id, full_name")
      .in("id", userIds);
    (profiles ?? []).forEach((p: any) => names.set(p.id, p.full_name ?? ""));
  }

  const one = (x: any) => (Array.isArray(x) ? x[0] ?? null : x);

  const articleMap = new Map<string, any>();
  (artRows ?? []).forEach((a: any) => {
    articleMap.set(a.id, {
      id: a.id,
      title: a.title,
      slug: a.slug,
      category_slug: one(a.categories)?.slug ?? null,
      comments_locked: !!a.comments_locked,
    });
  });

  const comments = rows.map((c) => {
    const a = one(c.articles);
    if (a && !articleMap.has(a.id)) {
      articleMap.set(a.id, {
        id: a.id,
        title: a.title,
        slug: a.slug,
        category_slug: one(a.categories)?.slug ?? null,
        comments_locked: !!a.comments_locked,
      });
    }
    return {
      id: c.id,
      body: c.body,
      is_approved: c.is_approved,
      created_at: c.created_at,
      article_id: c.article_id,
      parent_id: c.parent_id ?? null,
      author_name: names.get(c.user_id) || null,
    };
  });

  return <CommentsClient comments={comments} articles={Array.from(articleMap.values())} />;
}
