// app/api/upload-image/route.ts
// Uploads image to Cloudflare R2 via S3-compatible API

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const accountId  = process.env.CLOUDFLARE_ACCOUNT_ID;
    const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
    const accessKey  = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const secretKey  = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    const publicUrl  = process.env.CLOUDFLARE_R2_PUBLIC_URL;

    if (!accountId || !bucketName || !accessKey || !secretKey || !publicUrl) {
      return NextResponse.json({ error: "R2 not configured" }, { status: 500 });
    }

    const key = `covers/cover-${Date.now()}.webp`;
    const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

    // Use AWS S3 signing via fetch with Authorization header
    // R2 supports S3-compatible PUT
    const fileBuffer = await file.arrayBuffer();

    // Build the signed request manually using AWS Signature V4
    const region = "auto";
    const service = "s3";
    const host = `${accountId}.r2.cloudflarestorage.com`;
    const url = `${endpoint}/${bucketName}/${key}`;

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, "").slice(0, 15) + "Z";
    const dateStamp = amzDate.slice(0, 8);

    const contentType = "image/webp";

    // Helper: SHA-256 hash
    const sha256 = async (data: ArrayBuffer | string): Promise<string> => {
      const buf = typeof data === "string" ? new TextEncoder().encode(data) : data;
      const hash = await crypto.subtle.digest("SHA-256", buf);
      return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
    };

    // Helper: HMAC-SHA256
    const hmac = async (key: ArrayBuffer | string, data: string): Promise<ArrayBuffer> => {
      const k = typeof key === "string" ? new TextEncoder().encode(key) : key;
      const cryptoKey = await crypto.subtle.importKey("raw", k, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
    };

    const payloadHash = await sha256(fileBuffer);

    const canonicalHeaders =
      `content-type:${contentType}\n` +
      `host:${host}\n` +
      `x-amz-content-sha256:${payloadHash}\n` +
      `x-amz-date:${amzDate}\n`;

    const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";

    const canonicalRequest = [
      "PUT",
      `/${bucketName}/${key}`,
      "",
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join("\n");

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      await sha256(new TextEncoder().encode(canonicalRequest).buffer),
    ].join("\n");

    const signingKey = await (async () => {
      const k1 = await hmac(`AWS4${secretKey}`, dateStamp);
      const k2 = await hmac(k1, region);
      const k3 = await hmac(k2, service);
      return hmac(k3, "aws4_request");
    })();

    const signature = await (async () => {
      const k = await crypto.subtle.importKey("raw", signingKey, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      const sig = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(stringToSign));
      return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
    })();

    const authorization =
      `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const uploadRes = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
        "x-amz-date": amzDate,
        "x-amz-content-sha256": payloadHash,
        "Authorization": authorization,
      },
      body: fileBuffer,
    });

    if (!uploadRes.ok) {
      const text = await uploadRes.text();
      return NextResponse.json({ error: `R2 upload failed: ${text}` }, { status: 500 });
    }

    const imageUrl = `${publicUrl}/${key}`;
    return NextResponse.json({ url: imageUrl });

  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed" }, { status: 500 });
  }
}
