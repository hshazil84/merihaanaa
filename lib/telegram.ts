const API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

export function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function tg(method: string, payload: Record<string, unknown>) {
  const res = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export type CommentState = "visible" | "hidden" | "deleted";

export function buildKeyboard(id: string, state: CommentState) {
  if (state === "deleted") return { inline_keyboard: [] };
  if (state === "hidden") {
    return {
      inline_keyboard: [[
        { text: "↩️ Restore", callback_data: `r:${id}` },
        { text: "🗑 Delete", callback_data: `d:${id}` },
      ]],
    };
  }
  return {
    inline_keyboard: [[
      { text: "🙈 Hide", callback_data: `h:${id}` },
      { text: "🗑 Delete", callback_data: `d:${id}` },
    ]],
  };
}

export function buildMessage(opts: {
  name: string;
  article: string;
  body: string;
  state: CommentState;
}) {
  const status =
    opts.state === "hidden" ? "\n\n🙈 <b>Hidden</b>" :
    opts.state === "deleted" ? "\n\n🗑 <b>Deleted</b>" : "";
  return (
    `💬 <b>New comment</b>\n` +
    `👤 ${esc(opts.name)}\n` +
    `📰 ${esc(opts.article)}\n\n` +
    `${esc(opts.body)}${status}`
  );
}
