/**
 * Server-side checks for uploaded image files.
 *
 * The browser already re-encodes every photo (which drops EXIF/GPS data), but a
 * visitor could bypass the page and post a file directly. So the server:
 *   1. accepts only WebP and JPEG, recognised by their bytes (not the file name),
 *   2. reads the real width and height from the file,
 *   3. removes EXIF and XMP metadata blocks (where GPS location is stored).
 */

export type CheckedImage = {
  type: "image/webp" | "image/jpeg";
  width: number;
  height: number;
  bytes: Uint8Array;
};

export class ImageFileError extends Error {}

export function checkAndCleanImage(input: Uint8Array): CheckedImage {
  if (isWebp(input)) return cleanWebp(input);
  if (isJpeg(input)) return cleanJpeg(input);
  throw new ImageFileError("Only WebP and JPEG files can be stored.");
}

const ascii = (b: Uint8Array, at: number, len: number) =>
  String.fromCharCode(...b.subarray(at, at + len));

function isWebp(b: Uint8Array) {
  return b.length > 30 && ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WEBP";
}

function isJpeg(b: Uint8Array) {
  return b.length > 4 && b[0] === 0xff && b[1] === 0xd8;
}

const u16le = (b: Uint8Array, i: number) => b[i] | (b[i + 1] << 8);
const u24le = (b: Uint8Array, i: number) => b[i] | (b[i + 1] << 8) | (b[i + 2] << 16);
const u32le = (b: Uint8Array, i: number) => (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24)) >>> 0;

function cleanWebp(b: Uint8Array): CheckedImage {
  const kept: Uint8Array[] = [];
  let width = 0;
  let height = 0;
  let offset = 12;
  while (offset + 8 <= b.length) {
    const fourcc = ascii(b, offset, 4);
    const size = u32le(b, offset + 4);
    const padded = size + (size & 1);
    const end = offset + 8 + padded;
    if (offset + 8 + size > b.length) throw new ImageFileError("The WebP file is damaged.");
    const data = b.subarray(offset + 8, offset + 8 + size);

    if (fourcc === "VP8X" && size >= 10) {
      width = u24le(data, 4) + 1;
      height = u24le(data, 7) + 1;
      // Clear the "has EXIF" (0x08) and "has XMP" (0x04) flags because those chunks are removed below.
      const chunk = b.slice(offset, Math.min(end, b.length));
      chunk[8] = chunk[8] & ~0x0c;
      kept.push(chunk);
    } else if (fourcc === "EXIF" || fourcc === "XMP ") {
      // Drop: this is where camera and GPS metadata lives.
    } else {
      if (fourcc === "VP8 " && !width && size >= 10) {
        if (data[3] !== 0x9d || data[4] !== 0x01 || data[5] !== 0x2a) throw new ImageFileError("The WebP file is damaged.");
        width = u16le(data, 6) & 0x3fff;
        height = u16le(data, 8) & 0x3fff;
      } else if (fourcc === "VP8L" && !width && size >= 5) {
        if (data[0] !== 0x2f) throw new ImageFileError("The WebP file is damaged.");
        const bits = u32le(data, 1);
        width = (bits & 0x3fff) + 1;
        height = ((bits >> 14) & 0x3fff) + 1;
      }
      kept.push(b.subarray(offset, Math.min(end, b.length)));
    }
    offset = end;
  }
  if (!width || !height) throw new ImageFileError("Could not read the image size.");

  const bodyLength = kept.reduce((sum, c) => sum + c.length, 0);
  const out = new Uint8Array(12 + bodyLength);
  out.set(b.subarray(0, 12));
  new DataView(out.buffer).setUint32(4, 4 + bodyLength, true);
  let at = 12;
  for (const chunk of kept) {
    out.set(chunk, at);
    at += chunk.length;
  }
  return { type: "image/webp", width, height, bytes: out };
}

function cleanJpeg(b: Uint8Array): CheckedImage {
  const kept: Uint8Array[] = [b.subarray(0, 2)];
  let width = 0;
  let height = 0;
  let offset = 2;
  while (offset + 4 <= b.length) {
    if (b[offset] !== 0xff) throw new ImageFileError("The JPEG file is damaged.");
    const marker = b[offset + 1];
    if (marker === 0xff) {
      offset += 1; // fill byte
      continue;
    }
    if (marker === 0xda) {
      // Start of scan: the rest is compressed image data.
      kept.push(b.subarray(offset));
      break;
    }
    const length = (b[offset + 2] << 8) | b[offset + 3];
    const end = offset + 2 + length;
    if (end > b.length) throw new ImageFileError("The JPEG file is damaged.");
    const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof) {
      height = (b[offset + 5] << 8) | b[offset + 6];
      width = (b[offset + 7] << 8) | b[offset + 8];
    }
    // APP1 holds EXIF (incl. GPS) and XMP; APP13 holds Photoshop/IPTC data.
    if (marker !== 0xe1 && marker !== 0xed) kept.push(b.subarray(offset, end));
    offset = end;
  }
  if (!width || !height) throw new ImageFileError("Could not read the image size.");
  const total = kept.reduce((sum, c) => sum + c.length, 0);
  const out = new Uint8Array(total);
  let at = 0;
  for (const chunk of kept) {
    out.set(chunk, at);
    at += chunk.length;
  }
  return { type: "image/jpeg", width, height, bytes: out };
}
