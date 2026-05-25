// src/app/api/stream/upload/route.ts
// Cloudflare Stream — direct upload URL generator
// Flow: client requests upload URL → Cloudflare returns unique upload URL → client uploads directly

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const API_TOKEN  = process.env.CLOUDFLARE_STREAM_API_TOKEN!;

export async function POST(req: NextRequest) {
  // Auth check — only admins/editors can upload
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "editor"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { maxDurationSeconds = 3600, requireSignedURLs = false } = body;

    // Request a direct upload URL from Cloudflare Stream
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream/direct_upload`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          maxDurationSeconds,
          requireSignedURLs,
        }),
      }
    );

    const data = await res.json();

    if (!data.success) {
      console.error("Stream upload error:", JSON.stringify(data));
      return NextResponse.json({ error: "Cloudflare error", details: data.errors }, { status: 500 });
    }

    // Return the upload URL and video ID to the client
    return NextResponse.json({
      uploadUrl: data.result.uploadURL,
      videoId: data.result.uid,
    });

  } catch (err) {
    console.error("Stream upload route error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// GET — fetch video details by ID (status, thumbnail, duration)
export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get("id");
  if (!videoId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream/${videoId}`,
      {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
      }
    );

    const data = await res.json();

    if (!data.success) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const video = data.result;

    return NextResponse.json({
      videoId: video.uid,
      status: video.status?.state,          // "ready" | "inprogress" | "error"
      thumbnail: video.thumbnail,            // auto-generated thumbnail URL
      thumbnailTimestampPct: video.thumbnailTimestampPct,
      duration: Math.round(video.duration),  // seconds
      readyToStream: video.readyToStream,
      playback: {
        hls: video.playback?.hls,
        dash: video.playback?.dash,
      },
      meta: video.meta,
    });

  } catch (err) {
    console.error("Stream GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
