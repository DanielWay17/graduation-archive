import { useCallback, useEffect, useRef, useState } from "react";
import type { Photo } from "~/lib/types";
import { formatPhotoDate, photoAlt, photoLabel } from "~/lib/format";
import { FavoriteButton } from "./FavoriteButton";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, ImageIcon } from "./Icons";

/**
 * Fullscreen photo viewer.
 * Keyboard: Escape closes, ← / → move. Touch: swipe left/right, swipe down closes.
 * Focus stays inside while open and returns to the photo that opened it.
 */
export function PhotoLightbox({
  photos,
  index,
  onIndexChange,
  onClose,
  showAlbum = true,
}: {
  photos: Photo[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  showAlbum?: boolean;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const photo = photos[index];
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const hasPrev = index > 0;
  const hasNext = index < photos.length - 1;

  const prev = useCallback(() => hasPrev && onIndexChange(index - 1), [hasPrev, index, onIndexChange]);
  const next = useCallback(() => hasNext && onIndexChange(index + 1), [hasNext, index, onIndexChange]);

  // Reset the loading state for each photo.
  useEffect(() => {
    setStatus("loading");
    setAttempt(0);
  }, [photo?.id]);

  // Lock background scroll without losing the scroll position.
  useEffect(() => {
    const { overflow, paddingRight } = document.body.style;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, []);

  // Preload the neighbours' full images so arrows feel instant.
  useEffect(() => {
    for (const p of [photos[index - 1], photos[index + 1]]) {
      if (p) new Image().src = p.imageUrl;
    }
  }, [index, photos]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    } else if (e.key === "Tab") {
      // Keep focus inside the dialog.
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), a[href]");
      if (!focusables?.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return (touch.current = null);
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touch.current;
    touch.current = null;
    if (!start) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      if (dx < 0) next();
      else prev();
    } else if (dy > 90 && Math.abs(dy) > Math.abs(dx) * 1.5) {
      onClose();
    }
  };

  if (!photo) return null;
  const label = photoLabel(photo);
  const date = formatPhotoDate(photo.photoDate);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Photo ${index + 1} of ${photos.length}: ${label}`}
      className="fixed inset-0 z-50 flex flex-col bg-[#1f1a16] text-white lightbox-enter"
      onKeyDown={onKeyDown}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2 px-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-4">
        <p className="pl-2 text-sm text-white/70 tabular-nums" aria-live="polite">
          {index + 1} / {photos.length}
        </p>
        <button ref={closeRef} type="button" className="icon-btn text-white hover:!bg-white/15" onClick={onClose} aria-label="Close photo viewer">
          <CloseIcon size={26} />
        </button>
      </div>

      {/* Photo stage */}
      <div
        className="relative flex-1 min-h-0 flex items-center justify-center px-2 sm:px-20 select-none"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        {status === "loading" && (
          // Show the already-cached thumbnail, softened, while the full photo loads.
          <img
            src={photo.thumbnailUrl}
            alt=""
            aria-hidden="true"
            className="absolute max-h-full max-w-[calc(100%-1rem)] sm:max-w-[calc(100%-10rem)] object-contain blur-sm opacity-60"
          />
        )}
        {status === "error" ? (
          <div className="text-center text-white/80 grid justify-items-center gap-3">
            <ImageIcon size={36} />
            <p>This photo could not load.</p>
            <button type="button" className="btn btn-secondary !text-white !border-white/50" onClick={() => { setStatus("loading"); setAttempt((a) => a + 1); }}>
              Try again
            </button>
          </div>
        ) : (
          <img
            key={`${photo.id}-${attempt}`}
            src={attempt ? `${photo.imageUrl}?retry=${attempt}` : photo.imageUrl}
            alt={photoAlt(photo)}
            width={photo.width}
            height={photo.height}
            ref={(img) => {
              if (img?.complete && img.naturalWidth > 0 && status === "loading") setStatus("loaded");
            }}
            onLoad={() => setStatus("loaded")}
            onError={() => setStatus("error")}
            className={`relative max-h-full w-auto max-w-full object-contain transition-opacity duration-300 ${status === "loaded" ? "opacity-100" : "opacity-0"}`}
            draggable={false}
          />
        )}
        {status === "loading" && (
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/60" role="status">
            Loading photo…
          </span>
        )}

        {/* Desktop side arrows */}
        <button type="button" onClick={prev} disabled={!hasPrev} aria-label="Previous photo" className="icon-btn !hidden sm:!grid absolute left-4 top-1/2 -translate-y-1/2 !w-12 !h-12 text-white bg-white/10 hover:!bg-white/20">
          <ChevronLeftIcon size={28} />
        </button>
        <button type="button" onClick={next} disabled={!hasNext} aria-label="Next photo" className="icon-btn !hidden sm:!grid absolute right-4 top-1/2 -translate-y-1/2 !w-12 !h-12 text-white bg-white/10 hover:!bg-white/20">
          <ChevronRightIcon size={28} />
        </button>
      </div>

      {/* Caption + bottom controls (within thumb reach on phones) */}
      <div className="px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
        <div className="mx-auto max-w-3xl flex items-end gap-3">
          <div className="flex-1 min-w-0">
            <p className="hand text-xl sm:text-2xl leading-snug text-white">{photo.caption || <span className="text-white/60">Untitled memory</span>}</p>
            <p className="mt-0.5 text-xs sm:text-sm text-white/60">
              {[showAlbum ? photo.albumTitle : "", date, photo.uploaderName ? `shared by ${photo.uploaderName}` : ""].filter(Boolean).join(" · ")}
            </p>
          </div>
          <FavoriteButton photoId={photo.id} label={label} variant="dark" />
        </div>
        <div className="mt-2 flex justify-center gap-6 sm:hidden">
          <button type="button" onClick={prev} disabled={!hasPrev} aria-label="Previous photo" className="icon-btn !w-14 !h-12 text-white bg-white/10">
            <ChevronLeftIcon size={26} />
          </button>
          <button type="button" onClick={next} disabled={!hasNext} aria-label="Next photo" className="icon-btn !w-14 !h-12 text-white bg-white/10">
            <ChevronRightIcon size={26} />
          </button>
        </div>
      </div>
    </div>
  );
}
