import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getAdSlot } from "@/lib/adSlots";

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

function extFor(file: File): string {
  return EXT_BY_MIME[file.type] ?? (file.name.split(".").pop() || "jpg").toLowerCase();
}

function keyFor(folder: string, file: File): string {
  const rand = Math.random().toString(36).slice(2);
  return `${folder}/${Date.now()}-${rand}.${extFor(file)}`;
}

// PNG IHDR, JPEG SOF markers, and GIF's logical screen descriptor.
// GIF added here — the editorial upload route never needed it, ad
// creatives frequently are one.
function readDimensions(buf: Buffer): { width: number | null; height: number | null } {
  try {
    if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
      return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    }
    if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
      let i = 2;
      while (i < buf.length - 9) {
        if (buf[i] !== 0xff) { i++; continue; }
        const marker = buf[i + 1];
        if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
          return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
        }
        i += 2 + buf.readUInt16BE(i + 2);
      }
    }
    if (buf.length > 10 && buf.toString("ascii", 0, 3) === "GIF") {
      return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
    }
  } catch {
    // fall through
  }
  return { width: null, height: null };
}

/** Parses "300px" -> 300, "100%" -> null (fluid, nothing fixed to check). */
function parsePx(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = /^(\d+)px$/.exec(value.trim());
  return match ? parseInt(match[1], 10) : null;
}

function checkAgainstSlot(
  slotId: string,
  breakpoint: "desktop" | "mobile",
  width: number | null,
  height: number | null
): string | null {
  const def = getAdSlot(slotId);
  const size = def ? (breakpoint === "desktop" ? def.desktop : def.mobile) : null;
  if (!size || width == null || height == null) return null;

  const expectedW = parsePx(size.width);
  const expectedH = size.fill ? null : parsePx(size.height);

  if (expectedW && Math.abs(width - expectedW) > 4) {
    return `ފުޅާމިން ${expectedW}px ކަމަށް ބެލެވެއެވެ، އަޕްލޯޑްކުރި ފައިލް ${width}px`;
  }
  if (expectedH && Math.abs(height - expectedH) > 4) {
    return `އުސްމިން ${expectedH}px ކަމަށް ބެލެވެއެވެ، އަޕްލޯޑްކުރި ފައިލް ${height}px`;
  }
  if (size.aspectRatio) {
    const [aw, ah] = size.aspectRatio.split("/").map(Number);
    const expectedRatio = aw / ah;
    const actualRatio = width / height;
    if (Math.abs(actualRatio - expectedRatio) > 0.05) {
      return `ސައިޒް ރޭޝިއޯ ${size.aspectRatio} އާ ދިމަލެއް ނުވޭ`;
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const formData   = await req.formData();
    const file       = formData.get("file") as File | null;
    const slotId     = formData.get("slotId") as string | null;
    const breakpoint = formData.get("breakpoint") as "desktop" | "mobile" | null;

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const { width, height } = readDimensions(buffer);
    const warning = slotId && breakpoint ? checkAgainstSlot(slotId, breakpoint, width, height) : null;

    const key = keyFor("creatives", file);
    await s3.send(new PutObjectCommand({
      Bucket:       process.env.CLOUDFLARE_R2_ADS_BUCKET_NAME!,
      Key:          key,
      Body:         buffer,
      ContentType:  file.type,
      CacheControl: "public, max-age=31536000, immutable",
    }));
    const url = `${process.env.CLOUDFLARE_R2_ADS_PUBLIC_URL}/${key}`;

    return NextResponse.json({ url, width, height, warning });
  } catch (err) {
    console.error("Ad creative upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
