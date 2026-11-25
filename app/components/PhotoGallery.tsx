import { useCallback, useEffect, useRef, useState } from "react";
import type { Photo } from "~/lib/types";
import { PolaroidCard } from "./PolaroidCard";
import { PhotoLightbox } from "./PhotoLightbox";

const HASH_PREFIX = "#photo-";

/**
 * Masonry grid of Polaroids plus the lightbox. The open photo is mirrored in the
 * URL hash (#photo-<id>) so a shared link opens that photo, without a page reload
 * and without losing the scroll position.
 */
export function PhotoGallery({ photos, showAlbum = false }: { photos: Photo[]; showAlbum?: boolean }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const setHash = (id: string | null) => {
    const url = new URL(window.location.href);
    url.hash = id ? `${HASH_PREFIX.slice(1)}${id}` : "";
    window.history.replaceState(window.history.state, "", url.toString().replace(/#$/, ""));
  };

  const open = useCallback((index: number, trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setOpenIndex(index);
  }, []);

  const close = useCallback(() => {
    setOpenIndex(null);
    setHash(null);
    // Return focus to the photo that opened the viewer.
    requestAnimationFrame(() => triggerRef.current?.focus({ preventScroll: true }));
  }, []);

  // Keep the hash in sync with the open photo.
  useEffect(() => {
    if (openIndex !== null && photos[openIndex]) setHash(photos[openIndex].id);
  }, [openIndex, photos]);

  // Open the photo named in the hash on first load (shared links).
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith(HASH_PREFIX)) return;
    const index = photos.findIndex((p) => p.id === hash.slice(HASH_PREFIX.length));
    if (index >= 0) setOpenIndex(index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If the list shrinks (e.g. a favorite was removed), keep the index valid.
  useEffect(() => {
    if (openIndex !== null && openIndex >= photos.length) {
      if (photos.length === 0) close();
      else setOpenIndex(photos.length - 1);
    }
  }, [photos.length, openIndex, close]);

  return (
    <>
      <div className="masonry">
        {photos.map((photo, i) => (
          <div key={photo.id} id={`card-${photo.id}`}>
            <PolaroidCard photo={photo} index={i} onOpen={open} eager={i < 4} />
          </div>
        ))}
      </div>
      {openIndex !== null && photos[openIndex] && (
        <PhotoLightbox photos={photos} index={openIndex} onIndexChange={setOpenIndex} onClose={close} showAlbum={showAlbum} />
      )}
    </>
  );
}
