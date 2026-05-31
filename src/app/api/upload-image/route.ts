// app/api/upload-image/route.ts
import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const formData  = await req.formData();
    const file      = formData.get("file") as File | null;
    const folder    = (formData.get("folder") as string) || "images";
    const saveMedia = formData.get("saveMedia") === "true";

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const bytes    = await file.arrayBuffer();
    const buffer   = Buffer.from(bytes);
    const ext      = file.name.split(".").pop() ?? "jpg";
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    await s3.send(new PutObjectCommand({
      Bucket:      process.env.CLOUDFLARE_R2_BUCKET_NAME!,
      Key:         filename,
      Body:        buffer,
      ContentType: file.type,
    }));

    const url = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${filename}`;

    // Save to media table if requested
    if (saveMedia) {
      try {
        const supabase = await createServerSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();

        // Try to get image dimensions from buffer
        let width: number | null = null;
        let height: number | null = null;

        await supabase.from("media").insert({
          url,
          filename: file.name,
          size_bytes: file.size,
          width,
          height,
          uploaded_by: session?.user?.id ?? null,
        });
      } catch (e) {
        console.error("Media table insert failed:", e);
      }
    }

    return NextResponse.json({ url });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
