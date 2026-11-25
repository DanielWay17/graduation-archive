import { useState } from "react";
import type { Photo } from "~/lib/types";
import { galleryAspect, tiltFor } from "~/lib/format";
import { FavoriteButton } from "./FavoriteButton";
import { PhotoCaption } from "./PhotoCaption";
import { Tape } from "./Decorations";
import { ImageIcon } from "./Icons";

export function PolaroidCard({
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
  const label = photo.caption || photo.altText || "Untitled photo";
  const tapes = ["beige", "rose", "sage"] as const;
  const showTape = index % 3 === 0;

  return (
    <figure
      className="polaroid polaroid-interactive"
      style={{ "--tilt": `${tiltFor(index)}deg` } as React.CSSProperties}
    >
      {showTape && <Tape tone={tapes[(index / 3) % 3 | 0]} />}
      <button
        type="button"
        className="polaroid-photo relative cursor-zoom-in"
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
            alt={photo.altText || photo.caption || "Graduation photo"}
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
            className={`transition-opacity duration-500 ${state === "loaded" ? "opacity-100" : "opacity-0"}`}
          />
        )}
      </button>
      <div className="absolute right-2.5 top-2.5 sm:right-3 sm:top-3 z-[3]">
        <FavoriteButton photoId={photo.id} label={label} />
      </div>
      <PhotoCaption caption={photo.caption} photoDate={photo.photoDate} uploaderName={photo.uploaderName} />
    </figure>
  );
}
