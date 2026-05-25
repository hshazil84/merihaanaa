// app/api/upload-image/route.ts
// Uploads image to Cloudflare R2 using AWS SDK S3 client

import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ?? "",
  },
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
    const publicUrl  = process.env.CLOUDFLARE_R2_PUBLIC_URL;

    if (!bucketName || !publicUrl) {
      return NextResponse.json({ error: "R2 not configured" }, { status: 500 });
    }

    const key = `covers/cover-${Date.now()}.webp`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await r2.send(new PutObjectCommand({
      Bucket:      bucketName,
      Key:         key,
      Body:        buffer,
      ContentType: "image/webp",
    }));

    return NextResponse.json({ url: `${publicUrl}/${key}` });

  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed" }, { status: 500 });
  }
}
