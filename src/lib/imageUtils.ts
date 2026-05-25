// lib/imageUtils.ts
// Shared canvas pipeline: center-crop → resize → WebP
// Used by CoverMedia and article body image uploader

export interface ProcessImageOptions {
  targetW?: number;
  targetH?: number;
  quality?: number;
}

/**
 * Takes a File, center-crops to target aspect ratio,
 * resizes to target dimensions, and returns a WebP Blob.
 */
export async function processImage(
  file: File,
  options: ProcessImageOptions = {}
): Promise<Blob> {
  const { targetW = 1600, targetH = 900, quality = 0.85 } = options;
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
        // Wider than target — crop sides
        cropW = Math.round(srcH * targetRatio);
        cropX = Math.round((srcW - cropW) / 2);
      } else if (srcRatio < targetRatio) {
        // Taller than target — crop top/bottom
        cropH = Math.round(srcW / targetRatio);
        cropY = Math.round((srcH - cropH) / 2);
      }

      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;

      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas context unavailable")); return; }

      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, targetW, targetH);

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

// Aspect ratio presets for article body images
export const ASPECT_RATIOS = {
  "16:9":  { w: 1600, h: 900,  label: "ފުޅާ (16:9)" },
  "1:1":   { w: 1200, h: 1200, label: "އަކަ (1:1)" },
  "3:4":   { w: 900,  h: 1200, label: "ދިގު (3:4)" },
  "3:2":   { w: 1200, h: 800,  label: "ފޮޓޯ (3:2)" },
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
