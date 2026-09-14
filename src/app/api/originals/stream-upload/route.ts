// src/app/api/originals/stream-upload/route.ts
// tus creation proxy for Cloudflare Stream.
//
// tus-js-client POSTs here to create an upload, reads the Location header,
// then PATCHes the file bytes directly to that URL — the video never passes
// through Vercel. The previous version used /stream/direct_upload, which
// returns a BASIC one-time upload URL that does not speak tus; pointing
// tus-js-client at it produced corrupt uploads that failed to encode.

import { NextRequest, NextResponse } from "next/server";

const MAX_DURATION_SECONDS = 2400;

function b64(value: string): string {
  return Buffer.from(value, "utf8").toString("base64");
}

// Merge our own settings into whatever metadata the client sent.
// Cloudflare reads upload settings from Upload-Metadata on this endpoint,
// not from a JSON body.
function buildUploadMetadata(clientMetadata: string | null): string {
  const parts = clientMetadata ? clientMetadata.split(",").map((p) => p.trim()).filter(Boolean) : [];
  const keys = new Set(parts.map((p) => p.split(" ")[0]));

  if (!keys.has("name")) parts.push("name " + b64("Untitled"));
  if (!keys.has("maxDurationSeconds")) {
    parts.push("maxDurationSeconds " + b64(String(MAX_DURATION_SECONDS)));
  }
  return parts.join(",");
}

export async function POST(req: NextRequest) {
  const CF_ACCOUNT_ID   = process.env.CLOUDFLARE_ACCOUNT_ID!;
  const CF_STREAM_TOKEN = process.env.CLOUDFLARE_STREAM_API_TOKEN!;

  const uploadLength = req.headers.get("upload-length");
  if (!uploadLength) {
    return NextResponse.json(
      { error: "Missing Upload-Length header — client must use tus" },
      { status: 400 }
    );
  }

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream`,
    {
      method: "POST",
      headers: {
        Authorization:     `Bearer ${CF_STREAM_TOKEN}`,
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
      { error: "Stream upload could not be created", status: res.status, detail },
      { status: 500 }
    );
  }

  const location = res.headers.get("Location");
  const streamId = res.headers.get("stream-media-id");

  if (!location || !streamId) {
    console.error("Stream returned 201 without Location/stream-media-id");
    return NextResponse.json({ error: "Malformed response from Stream" }, { status: 500 });
  }

  // tus-js-client reads Location to find where to PATCH the bytes.
  // stream-media-id is exposed so the client can store the UID.
  return new NextResponse(null, {
    status: 201,
    headers: {
      "Location":                        location,
      "stream-media-id":                 streamId,
      "Tus-Resumable":                   "1.0.0",
      "Access-Control-Expose-Headers":   "Location, stream-media-id, Tus-Resumable",
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
