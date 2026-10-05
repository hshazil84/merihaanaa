// Telegram helpers for comment moderation.
// Server-only — uses the service-role client via createAdminClient().

const API = () => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

export type CommentState = "visible" | "hidden" | "deleted";

export type CommentContext = {
  id: string;
  body: string;
  authorName: string;
  articleTitle: string;
  articleUrl: string | null;
  state: CommentState;
};

export function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function tg(method: string, payload: Record<string, unknown>) {
  const res = await fetch(`${API()}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// Loads a comment plus its author name and article details.
// Profiles are fetched separately so this doesn't depend on a PostgREST
// relationship between comments and user_profiles.
export async function loadCommentContext(
  supabase: any,
  id: string
): Promise<CommentContext | null> {
  const { data: c } = await supabase
    .from("comments")
    .select("id, body, is_approved, user_id, article_id")
    .eq("id", id)
    .maybeSingle();
  if (!c) return null;

  const [{ data: profile }, { data: article }] = await Promise.all([
    c.user_id
      ? supabase.from("user_profiles").select("full_name").eq("id", c.user_id).maybeSingle()
      : Promise.resolve({ data: null }),
    c.article_id
      ? supabase
          .from("articles")
          .select("title, slug, categories(slug)")
          .eq("id", c.article_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const cat = Array.isArray(article?.categories) ? article.categories[0] : article?.categories;
  const site = (process.env.NEXT_PUBLIC_APP_URL || "https://merihaanaa.com").replace(/\/$/, "");

  return {
    id: c.id,
    body: c.body,
    authorName: profile?.full_name || "Unknown",
    articleTitle: article?.title || "Unknown article",
    articleUrl: article?.slug && cat?.slug ? `${site}/${cat.slug}/${article.slug}` : null,
    state: c.is_approved === true ? "visible" : "hidden",
  };
}

export function buildMessage(ctx: CommentContext, state: CommentState = ctx.state): string {
  const status =
    state === "hidden" ? "\n\n🙈 <b>Hidden</b>" :
    state === "deleted" ? "\n\n🗑 <b>Deleted</b>" : "";
  return (
    `💬 <b>New comment</b>\n` +
    `👤 ${esc(ctx.authorName)}\n` +
    `📰 ${esc(ctx.articleTitle)}\n\n` +
    `${esc(ctx.body)}${status}`
  );
}

export function buildKeyboard(ctx: CommentContext, state: CommentState = ctx.state) {
  const rows: any[][] = [];
  if (state === "visible") {
    rows.push([
      { text: "🙈 Hide", callback_data: `h:${ctx.id}` },
      { text: "🗑 Delete", callback_data: `d:${ctx.id}` },
    ]);
  } else if (state === "hidden") {
    rows.push([
      { text: "↩️ Restore", callback_data: `r:${ctx.id}` },
      { text: "🗑 Delete", callback_data: `d:${ctx.id}` },
    ]);
  }
  if (ctx.articleUrl && state !== "deleted") {
    rows.push([{ text: "🔗 Open article", url: ctx.articleUrl }]);
  }
  return { inline_keyboard: rows };
}
