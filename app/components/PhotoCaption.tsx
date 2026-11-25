import { formatPhotoDate } from "~/lib/format";

/** Short caption under a photo. Falls back to the date when there is no caption. */
export function PhotoCaption({
  caption,
  photoDate,
  uploaderName,
}: {
  caption: string;
  photoDate: string | null;
  uploaderName?: string;
}) {
  const date = formatPhotoDate(photoDate);
  const meta = [caption ? date : "", uploaderName ? `Shared by ${uploaderName}` : ""].filter(Boolean).join(" · ");
  if (!caption && !date && !meta) return null;
  return (
    <figcaption className="px-0.5 pt-2.5">
      <p className="text-[0.92rem] font-medium leading-snug text-ink-strong line-clamp-2">
        {caption || <span className="font-normal text-ink-soft">{date}</span>}
      </p>
      {meta && <p className="mt-0.5 text-xs text-ink-soft line-clamp-2">{meta}</p>}
    </figcaption>
  );
}
