import { describe, expect, it } from "vitest";
import { checkAndCleanImage, ImageFileError } from "./image-file.server";

const bytes = (...parts: (number[] | string | Uint8Array)[]) => {
  const arrays = parts.map((p) => (typeof p === "string" ? new TextEncoder().encode(p) : p instanceof Uint8Array ? p : Uint8Array.from(p)));
  const out = new Uint8Array(arrays.reduce((n, a) => n + a.length, 0));
  let at = 0;
  for (const a of arrays) {
    out.set(a, at);
    at += a.length;
  }
  return out;
};
const u32le = (n: number) => [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >>> 24) & 0xff];
const u24le = (n: number) => [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff];
const has = (haystack: Uint8Array, needle: string) => {
  const n = new TextEncoder().encode(needle);
  outer: for (let i = 0; i + n.length <= haystack.length; i++) {
    for (let j = 0; j < n.length; j++) if (haystack[i + j] !== n[j]) continue outer;
    return true;
  }
  return false;
};

function chunk(fourcc: string, data: Uint8Array) {
  return bytes(fourcc, u32le(data.length), data, data.length % 2 ? [0] : []);
}

function webp(chunks: Uint8Array[]) {
  const body = bytes("WEBP", ...chunks);
  return bytes("RIFF", u32le(body.length), body);
}

// Lossy VP8 frame header for a 640 × 480 image (key frame, start code 9d 01 2a).
const vp8 = chunk("VP8 ", bytes([0x10, 0x02, 0x00, 0x9d, 0x01, 0x2a], [640 & 0xff, 640 >> 8, 480 & 0xff, 480 >> 8], new Uint8Array(20)));
const exifPayload = bytes("Exif\0\0", "GPSLatitude=10.7626;GPSLongitude=106.6822");

describe("checkAndCleanImage — WebP", () => {
  it("reads the size of a simple lossy WebP", () => {
    const result = checkAndCleanImage(webp([vp8]));
    expect(result).toMatchObject({ type: "image/webp", width: 640, height: 480 });
  });

  it("removes EXIF and XMP chunks and clears their VP8X flags", () => {
    const vp8x = chunk("VP8X", bytes([0x08 | 0x04, 0, 0, 0], u24le(1999), u24le(1499)));
    const input = webp([vp8x, vp8, chunk("EXIF", exifPayload), chunk("XMP ", bytes("<x:xmpmeta>gps</x:xmpmeta>"))]);
    expect(has(input, "GPSLatitude")).toBe(true);

    const result = checkAndCleanImage(input);

    expect(result.width).toBe(2000);
    expect(result.height).toBe(1500);
    expect(has(result.bytes, "GPSLatitude")).toBe(false);
    expect(has(result.bytes, "xmpmeta")).toBe(false);
    expect(result.bytes[20] & 0x0c).toBe(0); // VP8X flags byte: no EXIF/XMP
    // RIFF size header matches the new length.
    const riffSize = new DataView(result.bytes.buffer).getUint32(4, true);
    expect(riffSize).toBe(result.bytes.length - 8);
  });

  it("rejects a truncated WebP", () => {
    const input = webp([vp8]).slice(0, 30);
    expect(() => checkAndCleanImage(input)).toThrow(ImageFileError);
  });
});

describe("checkAndCleanImage — JPEG", () => {
  const app0 = bytes([0xff, 0xe0, 0x00, 0x10], "JFIF\0", [1, 1, 0, 0, 1, 0, 1, 0, 0]);
  const app1 = (() => {
    const length = exifPayload.length + 2;
    return bytes([0xff, 0xe1, length >> 8, length & 0xff], exifPayload);
  })();
  const sof0 = bytes([0xff, 0xc0, 0x00, 0x11, 0x08], [0x04, 0x38], [0x07, 0x80], [3, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1]);
  const scan = bytes([0xff, 0xda, 0x00, 0x08, 1, 1, 0, 0, 0x3f, 0], [0x12, 0x34, 0x56], [0xff, 0xd9]);

  it("reads the size and strips the EXIF (APP1) segment", () => {
    const input = bytes([0xff, 0xd8], app0, app1, sof0, scan);
    expect(has(input, "GPSLatitude")).toBe(true);

    const result = checkAndCleanImage(input);

    expect(result).toMatchObject({ type: "image/jpeg", width: 1920, height: 1080 });
    expect(has(result.bytes, "GPSLatitude")).toBe(false);
    expect(has(result.bytes, "JFIF")).toBe(true); // other segments are kept
    expect(result.bytes.slice(-2)).toEqual(Uint8Array.from([0xff, 0xd9]));
  });

  it("rejects a JPEG without a frame header", () => {
    expect(() => checkAndCleanImage(bytes([0xff, 0xd8], app0, scan))).toThrow(ImageFileError);
  });
});

describe("checkAndCleanImage — other files", () => {
  it.each([
    ["PNG", bytes([0x89], "PNG\r\n\x1a\n", new Uint8Array(40))],
    ["text", bytes("not an image at all, just some text pretending")],
    ["SVG", bytes('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')],
  ])("rejects %s", (_name, input) => {
    expect(() => checkAndCleanImage(input)).toThrow("Only WebP and JPEG");
  });
});
