// src/app/api/originals/stream-upload/route.ts
// Gets a direct upload URL from Cloudflare Stream (browser uploads directly — bypasses Vercel)
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const maxDurationSeconds = body.maxDurationSeconds ?? 2400; // 40 min ceiling

  const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
  const CF_STREAM_TOKEN = process.env.CLOUDFLARE_STREAM_API_TOKEN!;

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream/direct_upload`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CF_STREAM_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        maxDurationSeconds,
        requireSignedURLs: false,
        meta: { name: body.title ?? "Untitled Original" },
      }),
    }
  );

  const json = await res.json();
  if (!json.success) {
    return NextResponse.json({ error: json.errors }, { status: 500 });
  }

  return NextResponse.json({
    uploadURL: json.result.uploadURL,
    streamId: json.result.uid,
  });
}
