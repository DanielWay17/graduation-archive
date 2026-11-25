/**
 * Image file storage adapter (Cloudflare R2). Only this file talks to the bucket.
 */
import { env } from "cloudflare:workers";

export async function putImage(key: string, bytes: Uint8Array, contentType: string) {
  await env.PHOTOS.put(key, bytes, { httpMetadata: { contentType } });
}

export async function getImage(key: string) {
  return env.PHOTOS.get(key);
}

export async function deleteImages(keys: string[]) {
  const real = keys.filter((k) => !k.startsWith("placeholder:"));
  // R2 deletes at most 1000 keys per call.
  for (let i = 0; i < real.length; i += 1000) {
    await env.PHOTOS.delete(real.slice(i, i + 1000));
  }
}

/**
 * Development placeholder: a clearly labelled SVG used by the local sample data
 * (scripts/seed-local.sql). It is never a real photo.
 */
export function placeholderSvg(seed: number, width: number, height: number) {
  const palettes = [
    ["#EAE1D3", "#D9B8AE"],
    ["#F1EBE1", "#A8AE96"],
    ["#EAE1D3", "#B69A68"],
    ["#F1EBE1", "#D9B8AE"],
    ["#E7DED2", "#A8AE96"],
  ];
  const [a, b] = palettes[seed % palettes.length];
  const size = Math.round(Math.min(width, height) / 20);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <g fill="none" stroke="#51473F" stroke-opacity=".18" stroke-width="${size / 6}">
    <circle cx="${width * 0.3}" cy="${height * 0.35}" r="${size * 1.4}"/>
    <path d="M0 ${height * 0.8} L${width * 0.35} ${height * 0.5} L${width * 0.6} ${height * 0.72} L${width * 0.8} ${height * 0.58} L${width} ${height * 0.75}"/>
  </g>
  <text x="50%" y="88%" text-anchor="middle" font-family="sans-serif" font-size="${size}" fill="#51473F" fill-opacity=".55">Sample photo · replace me</text>
</svg>`;
}
