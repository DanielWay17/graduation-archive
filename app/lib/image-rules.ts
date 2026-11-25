/** Upload rules shared by the server-rendered page and the browser code. */
export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/heic", "image/heif"];
export const ACCEPT_ATTR = ACCEPTED_TYPES.join(",");
export const MAX_ORIGINAL_BYTES = 40 * 1024 * 1024;

export function validateFile(file: File): string | null {
  const typeOk = ACCEPTED_TYPES.includes(file.type) || /\.(jpe?g|png|webp|avif|heic|heif)$/i.test(file.name);
  if (!typeOk) return "This file is not a supported image (JPEG, PNG, WebP, AVIF or HEIC).";
  if (file.size > MAX_ORIGINAL_BYTES) return "This photo is larger than 40 MB.";
  return null;
}
