// Telegram bot webhook — handles Hide / Restore / Delete button taps.

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  tg,
  buildMessage,
  buildKeyboard,
  loadCommentContext,
  type CommentState,
} from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (
    req.headers.get("x-telegram-bot-api-secret-token") !==
    process.env.TELEGRAM_WEBHOOK_SECRET
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const update = await req.json();
  const cb = update?.callback_query;
  if (!cb) return NextResponse.json({ ok: true });

  const deny = async (text: string) => {
    await tg("answerCallbackQuery", { callback_query_id: cb.id, text, show_alert: true });
    return NextResponse.json({ ok: true });
  };

  // Only the configured moderator chat may act
  if (String(cb.message?.chat?.id ?? "") !== String(process.env.TELEGRAM_CHAT_ID)) {
    return deny("Not allowed");
  }

  // Optional: restrict to specific Telegram user IDs (comma separated)
  const allowed = (process.env.TELEGRAM_ALLOWED_USER_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (allowed.length && !allowed.includes(String(cb.from?.id))) {
    return deny("Not allowed");
  }

  const [action, id] = String(cb.data ?? "").split(":");
  if (!id || !["h", "r", "d"].includes(action)) {
    return NextResponse.json({ ok: true });
  }

  const supabase = createAdminClient();

  // Load context first so the message can still be rebuilt after a delete
  const ctx = await loadCommentContext(supabase, id);
  if (!ctx) {
    await tg("answerCallbackQuery", {
      callback_query_id: cb.id,
      text: "Comment no longer exists",
    });
    await tg("editMessageReplyMarkup", {
      chat_id: cb.message.chat.id,
      message_id: cb.message.message_id,
      reply_markup: { inline_keyboard: [] },
    });
    return NextResponse.json({ ok: true });
  }

  let state: CommentState;
  let error: unknown = null;

  if (action === "d") {
    ({ error } = await supabase.from("comments").delete().eq("id", id));
    state = "deleted";
  } else {
    const approved = action === "r";
    ({ error } = await supabase.from("comments").update({ is_approved: approved }).eq("id", id));
    state = approved ? "visible" : "hidden";
  }

  if (error) {
    console.error("Comment moderation failed:", error);
    return deny("Failed, try again");
  }

  const edit = await tg("editMessageText", {
    chat_id: cb.message.chat.id,
    message_id: cb.message.message_id,
    text: buildMessage(ctx, state),
    parse_mode: "HTML",
    reply_markup: buildKeyboard(ctx, state),
    disable_web_page_preview: true,
  });

  if (!edit?.ok) {
    console.error("editMessageText failed:", JSON.stringify(edit));
    // Fallback: at least swap the buttons
    const fallback = await tg("editMessageReplyMarkup", {
      chat_id: cb.message.chat.id,
      message_id: cb.message.message_id,
      reply_markup: buildKeyboard(ctx, state),
    });
    if (!fallback?.ok) {
      console.error("editMessageReplyMarkup failed:", JSON.stringify(fallback));
    }
  }

  await tg("answerCallbackQuery", { callback_query_id: cb.id });

  return NextResponse.json({ ok: true });
}
