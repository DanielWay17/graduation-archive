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
  return `${count} ${count === 1 ? "photo" : "photos"}`;
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
