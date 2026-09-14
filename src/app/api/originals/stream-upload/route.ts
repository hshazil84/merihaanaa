// src/app/api/originals/stream-upload/route.ts
// tus creation proxy for Cloudflare Stream.
//
// tus-js-client POSTs here to create an upload, reads the Location header,
// then PATCHes file bytes directly to Cloudflare — video never passes
// through Vercel. Resumable: a dropped connection retries from the last
// confirmed offset instead of restarting.

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const API_TOKEN  = process.env.CLOUDFLARE_STREAM_API_TOKEN!;

const MAX_DURATION_SECONDS = 2400;

function b64(value: string): string {
  return Buffer.from(value, "utf8").toString("base64");
}

// Cloudflare reads upload settings from Upload-Metadata on this endpoint,
// not from a JSON body. Merge our defaults into what the client sent.
function buildUploadMetadata(clientMetadata: string | null): string {
  const parts = clientMetadata
    ? clientMetadata.split(",").map((p) => p.trim()).filter(Boolean)
    : [];
  const keys = new Set(parts.map((p) => p.split(" ")[0]));

  if (!keys.has("name")) parts.push("name " + b64("Untitled"));
  if (!keys.has("maxDurationSeconds")) {
    parts.push("maxDurationSeconds " + b64(String(MAX_DURATION_SECONDS)));
  }
  return parts.join(",");
}

export async function POST(req: NextRequest) {
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

  const uploadLength = req.headers.get("upload-length");
  if (!uploadLength) {
    return NextResponse.json(
      { error: "Missing Upload-Length header — client must use tus" },
      { status: 400 }
    );
  }

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream`,
    {
      method: "POST",
      headers: {
        Authorization:     `Bearer ${API_TOKEN}`,
        "Tus-Resumable":   "1.0.0",
        "Upload-Length":   uploadLength,
        "Upload-Metadata": buildUploadMetadata(req.headers.get("upload-metadata")),
      },
    }
  );

  if (res.status !== 201) {
    const detail = await res.text().catch(() => "");
    console.error("Stream tus creation failed:", res.status, detail);
    return NextResponse.json(
      { error: "Stream upload could not be created", detail },
      { status: 500 }
    );
  }

  const location = res.headers.get("Location");
  const streamId = res.headers.get("stream-media-id");

  if (!location || !streamId) {
    console.error("Stream returned 201 without Location/stream-media-id");
    return NextResponse.json({ error: "Malformed response from Stream" }, { status: 500 });
  }

  return new NextResponse(null, {
    status: 201,
    headers: {
      "Location":                      location,
      "stream-media-id":               streamId,
      "Tus-Resumable":                 "1.0.0",
      "Access-Control-Expose-Headers": "Location, stream-media-id, Tus-Resumable",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Tus-Resumable":                 "1.0.0",
      "Tus-Version":                   "1.0.0",
      "Tus-Extension":                 "creation",
      "Access-Control-Expose-Headers": "Location, stream-media-id, Tus-Resumable",
    },
  });
}
