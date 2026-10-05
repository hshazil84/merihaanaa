import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { tg, buildKeyboard, buildMessage } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (req.headers.get("x-webhook-secret") !== process.env.SUPABASE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = await req.json();
  if (payload.type !== "INSERT" || payload.table !== "comments") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const c = payload.record as {
    id: string;
    body: string;
    user_id: string;
    article_id: string;
  };

  const supabase = createAdminClient();

  const [{ data: profile }, { data: article }] = await Promise.all([
    supabase.from("user_profiles").select("full_name").eq("id", c.user_id).single(),
    supabase.from("articles").select("title").eq("id", c.article_id).single(),
  ]);

  await tg("sendMessage", {
    chat_id: process.env.TELEGRAM_CHAT_ID,
    text: buildMessage({
      name: profile?.full_name ?? "Unknown",
      article: article?.title ?? "Unknown article",
      body: c.body,
      state: "visible",
    }),
    parse_mode: "HTML",
    reply_markup: buildKeyboard(c.id, "visible"),
  });

  return NextResponse.json({ ok: true });
}
