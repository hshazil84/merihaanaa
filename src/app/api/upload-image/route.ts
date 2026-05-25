// app/api/upload-image/route.ts
// Uploads image to Cloudflare Images, returns public URL

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken  = process.env.CLOUDFLARE_STREAM_API_TOKEN;

    if (!accountId || !apiToken) {
      return NextResponse.json({ error: "Cloudflare not configured" }, { status: 500 });
    }

    const cf = new FormData();
    cf.append("file", file);

    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiToken}` },
        body: cf,
      }
    );

    const data = await res.json();
    if (!data.success) {
      return NextResponse.json({ error: data.errors?.[0]?.message ?? "Upload failed" }, { status: 500 });
    }

    // Return the public URL — flexible variant serves original
    const url = data.result.variants.find((v: string) => v.endsWith("/public")) ?? data.result.variants[0];
    return NextResponse.json({ url });

  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed" }, { status: 500 });
  }
}
