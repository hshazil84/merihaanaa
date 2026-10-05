// Called by a Supabase Database Webhook (INSERT on public.comments).
// Posts the new comment to the moderators' Telegram chat with action buttons.

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { tg, buildMessage, buildKeyboard, loadCommentContext } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (req.headers.get("x-webhook-secret") !== process.env.SUPABASE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = await req.json();
  if (payload?.type !== "INSERT" || payload?.table !== "comments" || !payload?.record?.id) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const supabase = createAdminClient();
  const ctx = await loadCommentContext(supabase, payload.record.id);
  if (!ctx) return NextResponse.json({ ok: true, skipped: "not found" });

  const result = await tg("sendMessage", {
    chat_id: process.env.TELEGRAM_CHAT_ID,
    text: buildMessage(ctx),
    parse_mode: "HTML",
    reply_markup: buildKeyboard(ctx),
    disable_web_page_preview: true,
  });

  if (!result?.ok) {
    console.error("Telegram sendMessage failed:", result);
    return NextResponse.json({ error: "telegram failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
