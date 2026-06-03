// src/app/api/originals/stream-upload/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const maxDurationSeconds = body.maxDurationSeconds ?? 2400;

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
        meta: { name: body.title ?? "Untitled" },
      }),
    }
  );

  const json = await res.json();
  if (!json.success) {
    return NextResponse.json({ error: json.errors }, { status: 500 });
  }

  const uploadURL: string = json.result.uploadURL;
  const streamId: string = json.result.uid;

  // Return 201 + Location header so tus-js-client picks up the real upload URL
  return new NextResponse(JSON.stringify({ streamId }), {
    status: 201,
    headers: {
      "Content-Type": "application/json",
      "Location": uploadURL,
      "Access-Control-Expose-Headers": "Location",
    },
  });
}
