/**
 * Runs in the browser before upload:
 *   - fingerprints the original (SHA-256) so the server can refuse duplicates,
 *   - makes a display image (max 2560 px) and a thumbnail (max 800 px).
 * Re-encoding through a canvas writes no EXIF, so GPS location never leaves the device.
 * File type and size rules live in image-rules.ts (shared with the server render).
 */

const FULL_EDGE = 2560;
const THUMB_EDGE = 800;

export type ProcessedImage = {
  full: Blob;
  thumb: Blob;
  width: number;
  height: number;
  contentHash: string;
};

async function sha256Hex(file: Blob) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function decode(file: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("Your browser cannot open this image format. Please convert it to JPEG and try again.");
  }
}

async function encode(bitmap: ImageBitmap, maxEdge: number, quality: number): Promise<{ blob: Blob; width: number; height: number }> {
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare the image.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  const toBlob = (type: string) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
  // Some browsers (older Safari) cannot write WebP and silently return PNG; use JPEG then.
  let blob = await toBlob("image/webp");
  if (!blob || blob.type !== "image/webp") blob = await toBlob("image/jpeg");
  if (!blob) throw new Error("Could not prepare the image.");
  canvas.width = canvas.height = 0; // free memory on mobile
  return { blob, width, height };
}

export async function processImage(file: File): Promise<ProcessedImage> {
  const [contentHash, bitmap] = await Promise.all([sha256Hex(file), decode(file)]);
  try {
    const full = await encode(bitmap, FULL_EDGE, 0.86);
    const thumb = await encode(bitmap, THUMB_EDGE, 0.8);
    return { full: full.blob, thumb: thumb.blob, width: full.width, height: full.height, contentHash };
  } finally {
    bitmap.close();
  }
}
