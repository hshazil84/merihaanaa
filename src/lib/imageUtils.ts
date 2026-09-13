// lib/imageUtils.ts
// Canvas pipeline: resize (never upscale) → center-crop → strip metadata → iterative JPEG compression
// Two outputs per upload:
//   processImage()   → display master, large + high quality (hero needs ~2400px)
//   processOGImage() → 1200x630 social card, hard-capped under 250KB for WhatsApp
// Note: Safari does not support lossy WebP in canvas.toBlob — using JPEG instead

export interface ProcessImageOptions {
  targetW?: number;
  targetH?: number;
  maxSizeKB?: number;
  minQuality?: number;
  watermark?: boolean;
  allowUpscale?: boolean;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Image failed to load"));
    };
    img.src = objectUrl;
  });
}

function drawWatermark(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number
) {
  const fontSize = Math.round(w * 0.016);
  const padding = Math.round(w * 0.014);
  ctx.save();
  ctx.font = `400 ${fontSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
  ctx.textBaseline = "bottom";
  ctx.textAlign = "left";
  const text = "© merihaanaa.com";
  const tw = ctx.measureText(text).width;
  const th = fontSize;
  const bx = padding - 6;
  const by = h - padding - th - 4;
  const bw = tw + 12;
  const bh = th + 8;
  const br = 4;
  ctx.fillStyle = "rgba(0,0,0,0.32)";
  ctx.beginPath();
  ctx.moveTo(bx + br, by);
  ctx.lineTo(bx + bw - br, by);
  ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + br);
  ctx.lineTo(bx + bw, by + bh - br);
  ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - br, by + bh);
  ctx.lineTo(bx + br, by + bh);
  ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - br);
  ctx.lineTo(bx, by + br);
  ctx.quadraticCurveTo(bx, by, bx + br, by);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.88)";
  ctx.shadowColor = "rgba(0,0,0,0.3)";
  ctx.shadowBlur = 3;
  ctx.fillText(text, padding, h - padding);
  ctx.restore();
}

export async function processImage(
  file: File,
  options: ProcessImageOptions = {}
): Promise<Blob> {
  const {
    targetW = 2400,
    targetH = 1350,
    maxSizeKB = 900,
    minQuality = 0.72,
    watermark = false,
    allowUpscale = false,
  } = options;

  const targetRatio = targetW / targetH;
  const img = await loadImage(file);

  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;
  const srcRatio = srcW / srcH;

  // Center-crop rect in source pixels
  let cropX = 0,
    cropY = 0,
    cropW = srcW,
    cropH = srcH;
  if (srcRatio > targetRatio) {
    cropW = Math.round(srcH * targetRatio);
    cropX = Math.round((srcW - cropW) / 2);
  } else if (srcRatio < targetRatio) {
    cropH = Math.round(srcW / targetRatio);
    cropY = Math.round((srcH - cropH) / 2);
  }

  // Never upscale: if the cropped region is smaller than the target,
  // output at the crop's native size instead of inventing pixels.
  let outW = targetW;
  let outH = targetH;
  if (!allowUpscale && cropW < targetW) {
    outW = cropW;
    outH = Math.round(cropW / targetRatio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, outW, outH);
  ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, outW, outH);

  if (watermark) drawWatermark(ctx, outW, outH);

  // Iterative JPEG compression. Start near-lossless and step down only
  // while over budget, stopping at minQuality so a large image is
  // preferred over a visibly degraded one.
  const compress = (quality: number): Promise<Blob> =>
    new Promise((res, rej) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            rej(new Error("toBlob failed"));
            return;
          }
          const sizeKB = blob.size / 1024;
          console.log(
            `[${outW}x${outH}] quality ${Math.round(quality * 100)}%: ${sizeKB.toFixed(0)}KB`
          );
          if (sizeKB <= maxSizeKB || quality <= minQuality) {
            res(blob);
          } else {
            compress(Math.round((quality - 0.03) * 100) / 100)
              .then(res)
              .catch(rej);
          }
        },
        "image/jpeg",
        quality
      );
    });

  return compress(0.95);
}

// Social card. Separate file so the display master is free to be large.
// Facebook/WhatsApp want 1.91:1 and choke above ~300KB.
export async function processOGImage(file: File): Promise<Blob> {
  return processImage(file, {
    targetW: 1200,
    targetH: 630,
    maxSizeKB: 250,
    minQuality: 0.45,
    watermark: false,
    allowUpscale: true,
  });
}

// Convenience: one decode pass per output, both blobs for a single upload.
export async function processImagePair(
  file: File,
  options: ProcessImageOptions = {}
): Promise<{ master: Blob; og: Blob }> {
  const master = await processImage(file, options);
  const og = await processOGImage(file);
  return { master, og };
}

export const ASPECT_RATIOS = {
  "16:9": { w: 2400, h: 1350, label: "ފުޅާ (16:9)" },
  "1:1":  { w: 1800, h: 1800, label: "އަކަ (1:1)" },
  "3:4":  { w: 1500, h: 2000, label: "ދިގު (3:4)" },
  "3:2":  { w: 2400, h: 1600, label: "ފޮޓޯ (3:2)" },
} as const;

export type AspectRatioKey = keyof typeof ASPECT_RATIOS;

// Size budget per ratio — taller crops carry more pixels, so allow more bytes.
export const RATIO_SIZE_BUDGET_KB: Record<AspectRatioKey, number> = {
  "16:9": 900,
  "1:1":  850,
  "3:4":  800,
  "3:2":  950,
};

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
];

export const MAX_IMAGE_SIZE_MB = 20;
