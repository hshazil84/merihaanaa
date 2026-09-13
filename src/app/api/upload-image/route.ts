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

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png":  "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif":  "gif",
};

// The canvas pipeline always emits JPEG, but the original filename may
// still say .png/.heic — trust the MIME type so the key matches ContentType.
function extFor(file: File): string {
  return EXT_BY_MIME[file.type] ?? (file.name.split(".").pop() || "jpg").toLowerCase();
}

function keyFor(folder: string, file: File, suffix = ""): string {
  const rand = Math.random().toString(36).slice(2);
  return `${folder}/${Date.now()}-${rand}${suffix}.${extFor(file)}`;
}

// Minimal dimension reader — JPEG SOF markers and the PNG IHDR chunk.
// Avoids pulling sharp/image-size into the edge-adjacent bundle.
function readDimensions(buf: Buffer): { width: number | null; height: number | null } {
  try {
    // PNG
    if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
      return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    }
    // JPEG
    if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
      let i = 2;
      while (i < buf.length - 9) {
        if (buf[i] !== 0xff) { i++; continue; }
        const marker = buf[i + 1];
        // SOF0-SOF15, excluding DHT (c4), DNL (c8) and DAC (cc)
        if (
          marker >= 0xc0 && marker <= 0xcf &&
          marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc
        ) {
          return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
        }
        i += 2 + buf.readUInt16BE(i + 2);
      }
    }
  } catch {
    // fall through
  }
  return { width: null, height: null };
}

async function putObject(key: string, buffer: Buffer, contentType: string) {
  await s3.send(new PutObjectCommand({
    Bucket:       process.env.CLOUDFLARE_R2_BUCKET_NAME!,
    Key:          key,
    Body:         buffer,
    ContentType:  contentType,
    // Keys are unique per upload, so they can be cached forever.
    CacheControl: "public, max-age=31536000, immutable",
  }));
  return `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`;
}

export async function POST(req: NextRequest) {
  try {
    const formData  = await req.formData();
    const file      = formData.get("file") as File | null;
    // Optional 1200x630 social card produced by processOGImage().
    const ogFile    = formData.get("ogFile") as File | null;
    const folder    = (formData.get("folder") as string) || "images";
    const saveMedia = formData.get("saveMedia") === "true";

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const key    = keyFor(folder, file);
    const url    = await putObject(key, buffer, file.type);

    let ogUrl: string | null = null;
    if (ogFile) {
      try {
        const ogBuffer = Buffer.from(await ogFile.arrayBuffer());
        const ogKey    = keyFor(`${folder}/og`, ogFile, "-og");
        ogUrl = await putObject(ogKey, ogBuffer, ogFile.type);
      } catch (e) {
        // A failed social card should not fail the cover upload.
        console.error("OG upload failed:", e);
      }
    }

    if (saveMedia) {
      try {
        const supabase = await createServerSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        const { width, height } = readDimensions(buffer);

        await supabase.from("media").insert({
          url,
          og_url: ogUrl,
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

    return NextResponse.json({ url, ogUrl });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
