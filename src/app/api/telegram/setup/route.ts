// One-click: registers the Telegram webhook. Admin-only.
// Visit https://www.merihaanaa.com/api/telegram/setup while logged in as admin.

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { tg } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "Log in as admin first" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const set = await tg("setWebhook", {
    url: "https://www.merihaanaa.com/api/telegram/webhook",
    secret_token: process.env.TELEGRAM_WEBHOOK_SECRET,
    allowed_updates: ["callback_query"],
    drop_pending_updates: true,
  });

  const info = await tg("getWebhookInfo", {});

  return NextResponse.json({
    setWebhook: set,
    webhook_url: info?.result?.url ?? null,
    last_error: info?.result?.last_error_message ?? null,
  });
}
