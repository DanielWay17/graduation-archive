import { describe, expect, it } from "vitest";
import { formatPhotoDate, galleryAspect, pluralPhotos, slugify } from "./format";
import { validateFile } from "./image-rules";

describe("slugify", () => {
  it.each([
    ["Graduation Day", "graduation-day"],
    ["Friends & Classmates", "friends-classmates"],
    ["Kỷ niệm Đại học", "ky-niem-dai-hoc"],
    ["  Lễ tốt nghiệp 2026!  ", "le-tot-nghiep-2026"],
    ["🎓🎉", ""],
  ])("%s → %s", (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  it("caps the length at 60 characters", () => {
    expect(slugify("a".repeat(200))).toHaveLength(60);
  });
});

describe("formatPhotoDate", () => {
  it("formats an ISO date", () => expect(formatPhotoDate("2026-11-21")).toBe("21 Nov 2026"));
  it.each([null, "", "21/11/2026", "2026-13-01"])("returns empty for %s", (input) => {
    expect(formatPhotoDate(input)).toBe("");
  });
});

describe("pluralPhotos", () => {
  it.each([
    [0, "0 photos"],
    [1, "1 photo"],
    [2, "2 photos"],
    [1284, "1,284 photos"],
  ])("%i → %s", (n, expected) => expect(pluralPhotos(n)).toBe(expected));
});

describe("galleryAspect", () => {
  it("keeps normal photos as they are", () => expect(galleryAspect(1600, 1200)).toBe("1.333"));
  it("caps a panorama at 2:1", () => expect(galleryAspect(4000, 400)).toBe("2"));
  it("caps a very tall photo at 1:2", () => expect(galleryAspect(400, 2800)).toBe("0.5"));
});

describe("validateFile", () => {
  const file = (name: string, type: string, size = 1000) => new File([new Uint8Array(size)], name, { type });

  it("accepts common photo formats", () => {
    expect(validateFile(file("a.jpg", "image/jpeg"))).toBeNull();
    expect(validateFile(file("b.HEIC", ""))).toBeNull(); // some phones send no MIME type
  });
  it("rejects other files", () => {
    expect(validateFile(file("notes.pdf", "application/pdf"))).toMatch(/not a supported image/);
  });
  it("rejects files over 40 MB", () => {
    expect(validateFile(file("big.jpg", "image/jpeg", 41 * 1024 * 1024))).toMatch(/larger than 40 MB/);
  });
});
