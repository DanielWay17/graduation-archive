import { useState } from "react";
import type { Photo } from "~/lib/types";
import { galleryAspect, photoAlt, photoLabel } from "~/lib/format";
import { FavoriteButton } from "./FavoriteButton";
import { PhotoCaption } from "./PhotoCaption";
import { ImageIcon } from "./Icons";

/** One photo in the gallery: the photo, a heart, and a short caption underneath. */
export function PhotoCard({
  photo,
  index,
  onOpen,
  eager = false,
}: {
  photo: Photo;
  index: number;
  onOpen: (index: number, trigger: HTMLElement) => void;
  /** Load immediately (for photos at the top of the page). */
  eager?: boolean;
}) {
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading");
  const label = photoLabel(photo);

  return (
    <figure className="relative">
      <button
        type="button"
        className="photo-tile cursor-zoom-in"
        style={{ aspectRatio: galleryAspect(photo.width, photo.height) }}
        onClick={(e) => onOpen(index, e.currentTarget)}
        aria-label={`Open photo: ${label}`}
        aria-haspopup="dialog"
      >
        {state === "loading" && <span className="img-skeleton absolute inset-0" aria-hidden="true" />}
        {state === "error" ? (
          <span className="absolute inset-0 grid place-items-center text-ink-soft text-sm gap-1 p-4 text-center">
            <ImageIcon />
            This photo could not load.
          </span>
        ) : (
          <img
            src={photo.thumbnailUrl}
            alt={photoAlt(photo)}
            width={photo.width}
            height={photo.height}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            // Hydration can happen after the image already loaded or failed.
            ref={(img) => {
              if (img?.complete && state === "loading") setState(img.naturalWidth > 0 ? "loaded" : "error");
            }}
            onLoad={() => setState("loaded")}
            onError={() => setState("error")}
            // Always visible: the photo paints over the shimmer as soon as it arrives,
            // without waiting for JavaScript (hiding it until hydration delayed LCP by ~1.4 s).
            className="relative z-[1]"
          />
        )}
      </button>
      <div className="absolute right-2 top-2 z-[3]">
        <FavoriteButton photoId={photo.id} label={label} />
      </div>
      <PhotoCaption caption={photo.caption} photoDate={photo.photoDate} uploaderName={photo.uploaderName} />
    </figure>
  );
}
