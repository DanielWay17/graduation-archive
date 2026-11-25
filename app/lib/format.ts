/** "2026-11-21" → "21 Nov 2026". Returns "" for empty or invalid input. */
export function formatPhotoDate(date: string | null | undefined): string {
  if (!date) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return "";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[Number(match[2]) - 1];
  if (!month) return "";
  return `${Number(match[3])} ${month} ${match[1]}`;
}

export function pluralPhotos(count: number): string {
  return `${count.toLocaleString("en-US")} ${count === 1 ? "photo" : "photos"}`;
}

/**
 * Aspect ratio for a gallery thumbnail, kept between 1:2 and 2:1 so a panorama or a
 * very tall photo does not dominate the grid. The lightbox always shows the full photo.
 */
export function galleryAspect(width: number, height: number): string {
  const ratio = Math.min(2, Math.max(0.5, width / height));
  return String(Math.round(ratio * 1000) / 1000);
}

/** Small, deterministic tilt (degrees) so a gallery looks hand-placed but stays scannable. */
export function tiltFor(index: number): number {
  const tilts = [-1.6, 1.2, -0.6, 1.8, -1.1, 0.5];
  return tilts[index % tilts.length];
}

/** Vietnamese-aware slug: "Kỷ niệm Đại học" → "ky-niem-dai-hoc". */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Alt text for a photo: the description, else the caption, else a generic label. Blank strings don't count. */
export function photoAlt(photo: { altText: string; caption: string }): string {
  return photo.altText.trim() || photo.caption.trim() || "Graduation photo";
}

/** Short name of a photo for button labels ("Open photo: …"). */
export function photoLabel(photo: { altText: string; caption: string }): string {
  return photo.caption.trim() || photo.altText.trim() || "Untitled photo";
}
