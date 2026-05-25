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
    const host = `${accountId}.r2.cloudflarestorage.com`;
    const url = `https://${host}/${bucketName}/${key}`;

    const fileBuffer = await file.arrayBuffer();
    const region = "auto";
    const service = "s3";
    const contentType = "image/webp";

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, "").slice(0, 15) + "Z";
    const dateStamp = amzDate.slice(0, 8);

    const sha256 = async (data: ArrayBuffer): Promise<string> => {
      const hash = await crypto.subtle.digest("SHA-256", data);
      return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
    };

    const hmacSha256 = async (key: ArrayBuffer, data: string): Promise<ArrayBuffer> => {
      const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
    };

    const encode = (s: string): ArrayBuffer => new TextEncoder().encode(s).buffer as ArrayBuffer;

    const payloadHash = await sha256(fileBuffer);

    const canonicalUri = `/${bucketName}/${key}`;
    const canonicalHeaders =
      `content-type:${contentType}\n` +
      `host:${host}\n` +
      `x-amz-content-sha256:${payloadHash}\n` +
      `x-amz-date:${amzDate}\n`;
    const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";

    const canonicalRequest = ["PUT", canonicalUri, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      await sha256(encode(canonicalRequest)),
    ].join("\n");

    const kDate    = await hmacSha256(encode(`AWS4${secretKey}`), dateStamp);
    const kRegion  = await hmacSha256(kDate, region);
    const kService = await hmacSha256(kRegion, service);
    const kSigning = await hmacSha256(kService, "aws4_request");

    const sigKey = await crypto.subtle.importKey("raw", kSigning, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sigBuf = await crypto.subtle.sign("HMAC", sigKey, encode(stringToSign));
    const signature = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, "0")).join("");

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

    return NextResponse.json({ url: `${publicUrl}/${key}` });

  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed" }, { status: 500 });
  }
}
