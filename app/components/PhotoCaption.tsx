import { formatPhotoDate } from "~/lib/format";

/** Handwritten caption under a Polaroid. Falls back to the date when there is no caption. */
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
  return (
    <figcaption className="px-1 pt-2.5 pb-3 min-h-[3rem]">
      <p className="hand text-[1.15rem] leading-snug text-ink-strong line-clamp-2">
        {caption || <span className="text-ink-soft">{date || "untitled memory"}</span>}
      </p>
      {(caption && date) || uploaderName ? (
        <p className="mt-0.5 text-[0.72rem] uppercase tracking-[0.12em] text-ink-soft">
          {[caption ? date : "", uploaderName ? `shared by ${uploaderName}` : ""].filter(Boolean).join(" · ")}
        </p>
      ) : null}
    </figcaption>
  );
}
