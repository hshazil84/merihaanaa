// src/app/api/originals/grab-thumbnail/route.ts
// Returns the Cloudflare Stream auto-thumbnail URL for a video.
//
// The thumbnail is already served from Cloudflare's CDN without auth, so
// there is nothing to gain by copying it into R2 — doing so only adds a
// step that can fail. The previous version also read R2_* env vars that
// do not exist in this project (the working names are CLOUDFLARE_R2_*),
// so the S3 client threw and Next returned an HTML 500, which the client
// then failed to parse as JSON.

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const API_TOKEN  = process.env.CLOUDFLARE_STREAM_API_TOKEN!;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { streamId } = await req.json().catch(() => ({}));
    if (!streamId) {
      return NextResponse.json({ error: "streamId required" }, { status: 400 });
    }

    const metaRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream/${streamId}`,
      { headers: { Authorization: `Bearer ${API_TOKEN}` } }
    );
    const meta = await metaRes.json();

    if (!meta.success) {
      console.error("Stream lookup failed:", JSON.stringify(meta.errors));
      return NextResponse.json({ error: "Stream video not found" }, { status: 404 });
    }

    const video = meta.result;

    // A video still encoding has no usable thumbnail yet.
    if (!video.readyToStream) {
      return NextResponse.json(
        { error: "Video is still processing", state: video.status?.state ?? null },
        { status: 409 }
      );
    }

    if (!video.thumbnail) {
      return NextResponse.json({ error: "No thumbnail available" }, { status: 404 });
    }

    return NextResponse.json({
      url: video.thumbnail,
      duration: video.duration ? Math.round(video.duration) : null,
    });
  } catch (err) {
    console.error("grab-thumbnail error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
