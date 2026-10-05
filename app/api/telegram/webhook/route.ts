import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { tg, buildKeyboard, esc, type CommentState } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (
    req.headers.get("x-telegram-bot-api-secret-token") !==
    process.env.TELEGRAM_WEBHOOK_SECRET
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const update = await req.json();
  const cb = update.callback_query;
  if (!cb) return NextResponse.json({ ok: true });

  // Only moderators in the configured chat may act
  const chatId = String(cb.message?.chat?.id ?? "");
  if (chatId !== String(process.env.TELEGRAM_CHAT_ID)) {
    await tg("answerCallbackQuery", {
      callback_query_id: cb.id,
      text: "Not allowed",
      show_alert: true,
    });
    return NextResponse.json({ ok: true });
  }

  const [action, id] = String(cb.data ?? "").split(":");
  if (!id || !["h", "r", "d"].includes(action)) {
    return NextResponse.json({ ok: true });
  }

  const supabase = createAdminClient();
  let state: CommentState;
  let error = null;

  if (action === "d") {
    ({ error } = await supabase.from("comments").delete().eq("id", id));
    state = "deleted";
  } else {
    const approved = action === "r";
    ({ error } = await supabase
      .from("comments")
      .update({ is_approved: approved })
      .eq("id", id));
    state = approved ? "visible" : "hidden";
  }

  if (error) {
    await tg("answerCallbackQuery", {
      callback_query_id: cb.id,
      text: "Failed, try again",
      show_alert: true,
    });
    return NextResponse.json({ ok: true });
  }

  const label =
    state === "hidden" ? "🙈 <b>Hidden</b>" :
    state === "deleted" ? "🗑 <b>Deleted</b>" : "✅ <b>Visible</b>";

  // Keep the original text (Telegram entities → plain HTML-safe), swap status line
  const original: string = cb.message.text ?? "";
  const base = original.split("\n\n").slice(0, -1).length
    ? original.replace(/\n\n(🙈 Hidden|🗑 Deleted|✅ Visible)$/, "")
    : original;

  await tg("editMessageText", {
    chat_id: cb.message.chat.id,
    message_id: cb.message.message_id,
    text: `${esc(base)}\n\n${label}`,
    parse_mode: "HTML",
    reply_markup: buildKeyboard(id, state),
  });

  await tg("answerCallbackQuery", { callback_query_id: cb.id });

  return NextResponse.json({ ok: true });
}
