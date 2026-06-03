// src/app/api/originals/grab-thumbnail/route.ts
// Fetches Cloudflare Stream auto-thumbnail and saves it to R2
import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  const { streamId } = await req.json();
  if (!streamId) return NextResponse.json({ error: "streamId required" }, { status: 400 });

  const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
  const CF_STREAM_TOKEN = process.env.CLOUDFLARE_STREAM_API_TOKEN!;

  // Fetch video metadata from Stream to get thumbnail URL
  const metaRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream/${streamId}`,
    { headers: { Authorization: `Bearer ${CF_STREAM_TOKEN}` } }
  );
  const meta = await metaRes.json();
  if (!meta.success) return NextResponse.json({ error: "Stream video not found" }, { status: 404 });

  const thumbnailUrl: string = meta.result.thumbnail;

  // Fetch the actual thumbnail image
  const imgRes = await fetch(thumbnailUrl);
  if (!imgRes.ok) return NextResponse.json({ error: "Could not fetch thumbnail" }, { status: 500 });
  const imgBuffer = Buffer.from(await imgRes.arrayBuffer());

  // Upload to R2
  const key = `originals/thumbs/${streamId}.jpg`;
  await s3.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    Body: imgBuffer,
    ContentType: "image/jpeg",
  }));

  const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`;
  return NextResponse.json({ url: publicUrl });
}
