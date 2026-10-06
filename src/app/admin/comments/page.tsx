import { createServerSupabaseClient } from "@/lib/supabase/server";
import CommentsClient from "./CommentsClient";

export const dynamic = "force-dynamic";

export default async function CommentsPage() {
  const supabase = await createServerSupabaseClient();
  const errors: string[] = [];

  // 1) Comments (plain query: no embeds, so nothing relationship-related can break it)
  const { data: commentRows, error: commentErr } = await supabase
    .from("comments")
    .select("id, body, is_approved, created_at, article_id, user_id, parent_id, author_name")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (commentErr) {
    console.error("admin/comments: comments query failed:", commentErr.message);
    errors.push("comments: " + commentErr.message);
  }
  const rows = (commentRows ?? []) as any[];

  // 2) Published articles (so any article can be locked even with zero comments)
  const { data: artRows, error: artErr } = await supabase
    .from("articles")
    .select("id, title, slug, comments_locked, categories!category_id (slug)")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(300);
  if (artErr) {
    console.error("admin/comments: articles query failed:", artErr.message);
    errors.push("articles: " + artErr.message);
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

  // 3) Articles that have comments but weren't in the list above (unpublished, or beyond the 300)
  const missingIds = Array.from(
    new Set(rows.map((c) => c.article_id).filter((id) => id && !articleMap.has(id)))
  ) as string[];
  if (missingIds.length) {
    const { data: extra, error: extraErr } = await supabase
      .from("articles")
      .select("id, title, slug, comments_locked, categories!category_id (slug)")
      .in("id", missingIds);
    if (extraErr) {
      console.error("admin/comments: extra articles query failed:", extraErr.message);
      errors.push("extra articles: " + extraErr.message);
    }
    (extra ?? []).forEach((a: any) => {
      articleMap.set(a.id, {
        id: a.id,
        title: a.title,
        slug: a.slug,
        category_slug: one(a.categories)?.slug ?? null,
        comments_locked: !!a.comments_locked,
      });
    });
  }

  // 4) Author names (separate query; no dependency on a comments→user_profiles relationship)
  const userIds = Array.from(new Set(rows.map((c) => c.user_id).filter(Boolean)));
  const names = new Map<string, string>();
  if (userIds.length) {
    const { data: profiles, error: profErr } = await supabase
      .from("user_profiles")
      .select("id, full_name")
      .in("id", userIds);
    if (profErr) {
      console.error("admin/comments: profiles query failed:", profErr.message);
      errors.push("profiles: " + profErr.message);
    }
    (profiles ?? []).forEach((p: any) => names.set(p.id, p.full_name ?? ""));
  }

  const comments = rows.map((c) => ({
    id: c.id,
    body: c.body,
    is_approved: c.is_approved,
    created_at: c.created_at,
    article_id: c.article_id,
    parent_id: c.parent_id ?? null,
    author_name: c.author_name ? `${c.author_name} (guest)` : names.get(c.user_id) || null,
  }));

  return (
    <>
      {errors.length > 0 && (
        <div className="max-w-4xl mx-auto px-6 pt-6" dir="ltr">
          <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs p-3 font-mono whitespace-pre-wrap">
            {errors.join("\n")}
          </div>
        </div>
      )}
      <CommentsClient comments={comments} articles={Array.from(articleMap.values())} />
    </>
  );
}
