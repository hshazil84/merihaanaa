// lib/imageUtils.ts
// Canvas pipeline: center-crop → resize → watermark → WebP

export interface ProcessImageOptions {
  targetW?: number;
  targetH?: number;
  quality?: number;
  watermark?: boolean;
}

export async function processImage(
  file: File,
  options: ProcessImageOptions = {}
): Promise<Blob> {
  const {
    targetW   = 1200,
    targetH   = 675,
    quality   = 0.72,
    watermark = true,
  } = options;

  const targetRatio = targetW / targetH;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const srcW = img.naturalWidth;
      const srcH = img.naturalHeight;
      const srcRatio = srcW / srcH;

      let cropX = 0, cropY = 0, cropW = srcW, cropH = srcH;

      if (srcRatio > targetRatio) {
        cropW = Math.round(srcH * targetRatio);
        cropX = Math.round((srcW - cropW) / 2);
      } else if (srcRatio < targetRatio) {
        cropH = Math.round(srcW / targetRatio);
        cropY = Math.round((srcH - cropH) / 2);
      }

      const canvas = document.createElement("canvas");
      canvas.width  = targetW;
      canvas.height = targetH;

      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas context unavailable")); return; }

      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, targetW, targetH);

      if (watermark) {
        const fontSize = Math.round(targetW * 0.016); // ~19px at 1200w
        const padding  = Math.round(targetW * 0.014);

        ctx.save();

        // Subtle dark pill background for legibility
        ctx.font = `400 ${fontSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
        ctx.textBaseline = "bottom";
        ctx.textAlign    = "left";

        const text    = "© merihaanaa.com";
        const metrics = ctx.measureText(text);
        const tw      = metrics.width;
        const th      = fontSize;
        const bx      = padding - 6;
        const by      = targetH - padding - th - 4;
        const bw      = tw + 12;
        const bh      = th + 8;
        const br      = 4;

        // Pill background
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

        // White text
        ctx.fillStyle    = "rgba(255,255,255,0.88)";
        ctx.shadowColor  = "rgba(0,0,0,0.3)";
        ctx.shadowBlur   = 3;
        ctx.fillText(text, padding, targetH - padding);

        ctx.restore();
      }

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error("Canvas toBlob failed")); return; }
          resolve(blob);
        },
        "image/webp",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Image failed to load"));
    };

    img.src = objectUrl;
  });
}

export const ASPECT_RATIOS = {
  "16:9": { w: 1200, h: 675,  label: "ފުޅާ (16:9)" },
  "1:1":  { w: 1200, h: 1200, label: "އަކަ (1:1)" },
  "3:4":  { w: 900,  h: 1200, label: "ދިގު (3:4)" },
  "3:2":  { w: 1200, h: 800,  label: "ފޮޓޯ (3:2)" },
} as const;

export type AspectRatioKey = keyof typeof ASPECT_RATIOS;

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
];

export const MAX_IMAGE_SIZE_MB = 20;
