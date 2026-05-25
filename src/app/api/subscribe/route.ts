// app/api/subscribe/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "އީމެއިލް ރަނގަޅު ނޫން" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();

  // Check if already subscribed
  const { data: existing } = await supabase
    .from("subscribers")
    .select("id, is_confirmed")
    .eq("email", email)
    .single();

  if (existing) {
    if (existing.is_confirmed) {
      return NextResponse.json({ error: "މިހާރު ވެސް ސަބްސްކްރައިބްވެފައި" }, { status: 409 });
    }
    await supabase.from("subscribers").update({ is_confirmed: true }).eq("email", email);
  } else {
    const { error } = await supabase
      .from("subscribers")
      .insert({ email, is_confirmed: true, subscribed_at: new Date().toISOString() });
    if (error) {
      return NextResponse.json({ error: "ސޭވް ނުވި: " + error.message }, { status: 500 });
    }
  }

  // Send welcome email via Resend
  if (process.env.RESEND_API_KEY) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "މެރިހާނާ <hello@merihaanaa.com>",
          to: [email],
          subject: "މެރިހާނާ ނިއުސްލެޓަރ — ތިޔަ ސަބްސްކްރިޕްޝަން ލިބިއްޖެ",
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:40px 20px;text-align:center;">
              <h1 style="font-size:28px;margin-bottom:8px;">މެރިހާނާ</h1>
              <p style="color:#666;font-size:13px;margin-bottom:24px;">People · Reviews · Stories</p>
              <p style="font-size:15px;line-height:1.6;color:#333;">
                ތިޔަ ސަބްސްކްރިޕްޝަން ލިބިއްޖެ. ހަފްތާއަކު ލިޔުންތަކާ ހަބަރު ތިޔަ އިންބޮކްސްއަށް ފޮނުވޭނެ.
              </p>
              <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
              <p style="font-size:11px;color:#999;">
                <a href="https://merihaanaa.com/unsubscribe?email=${encodeURIComponent(email)}" style="color:#999;">
                  ސަބްސްކްރިޕްޝަން ކެންސަލް
                </a>
              </p>
            </div>
          `,
        }),
      });
    } catch {
      // Don't fail subscription if email fails
    }
  }

  return NextResponse.json({ success: true });
}
