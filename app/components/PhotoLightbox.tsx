import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { Photo } from "~/lib/types";
import { formatPhotoDate, photoAlt, photoLabel } from "~/lib/format";
import { FavoriteButton } from "./FavoriteButton";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, ImageIcon } from "./Icons";

/**
 * Fullscreen photo viewer.
 * Keyboard: Escape closes, ← / → move (both instant). Touch: swipe left/right, swipe down closes;
 * the photo follows the finger, glides back if the swipe falls short, and otherwise carries on
 * in the swipe direction while the next photo slides in (or the viewer fades out).
 * Focus stays inside while open and returns to the photo that opened it.
 */

/** A swipe commits past this distance (px)… */
const SWIPE_DISTANCE = 50;
const CLOSE_DISTANCE = 90;
/** …or when flicked faster than this (px/ms), as long as it moved at least FLICK_MIN_DISTANCE. */
const FLICK_VELOCITY = 0.11;
const FLICK_MIN_DISTANCE = 20;
/** Past the first or last photo the track moves at this fraction of the finger (rubber-band). */
const EDGE_RESISTANCE = 0.3;
/** Durations (ms), all on --ease-out. A committed swipe: leave + enter = 250. */
const SETTLE_MS = 200;
const LEAVE_MS = 110;
const ENTER_MS = 140;
const CLOSE_MS = 200;

type Drag = {
  /** Finger position that corresponds to a zero offset. */
  originX: number;
  originY: number;
  startTime: number;
  /** Locked after the first few pixels; "none" = an upward drag, which does nothing. */
  axis: "x" | "y" | "none" | null;
  dx: number;
  dy: number;
};
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
  const trackRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  /** True while a committed swipe or swipe-close animates; new touches wait for it. */
  const busy = useRef(false);
  const timer = useRef<number | undefined>(undefined);
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

  // Lock background scroll without losing the scroll position. No padding fix-up is
  // needed: `scrollbar-gutter: stable` (app.css) keeps the scrollbar's space reserved.
  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  // A swipe animation must not change the photo or close the viewer after it is gone.
  useEffect(() => () => window.clearTimeout(timer.current), []);

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

  const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /**
   * Moves the photo track and, while dragging down, fades the backdrop so the gallery
   * shows through. Written straight to the DOM, transform and opacity only: no React
   * render and no repaint per touchmove. `ms` = 0 follows the finger with no transition.
   */
  const setOffset = (x: number, y: number, ms = 0) => {
    const track = trackRef.current;
    const backdrop = backdropRef.current;
    if (!track || !backdrop) return;
    const timing = ms && !reduceMotion() ? `${ms}ms var(--ease-out)` : "";
    track.style.transition = timing ? `transform ${timing}` : "none";
    backdrop.style.transition = timing ? `opacity ${timing}` : "none";
    track.style.transform = x || y ? `translate3d(${x}px, ${y}px, 0)` : "";
    backdrop.style.opacity = y > 0 ? String(Math.max(0, 1 - y / 600)) : "";
  };

  /** A committed sideways swipe: the old photo carries on off-screen, the new one slides in from the other side. */
  const slideTo = (towardNext: boolean) => {
    const go = towardNext ? next : prev;
    if (reduceMotion()) {
      setOffset(0, 0);
      go();
      return;
    }
    const out = (towardNext ? -1 : 1) * (trackRef.current?.offsetWidth ?? window.innerWidth);
    busy.current = true;
    setOffset(out, 0, LEAVE_MS);
    timer.current = window.setTimeout(() => {
      flushSync(() => go()); // render the new photo before it moves
      setOffset(-out, 0); // park it past the opposite edge,
      trackRef.current?.getBoundingClientRect(); // commit that position,
      setOffset(0, 0, ENTER_MS); // then slide it in
      timer.current = window.setTimeout(() => (busy.current = false), ENTER_MS);
    }, LEAVE_MS);
  };

  /** A committed swipe down: the photo keeps falling while the viewer fades, then it closes. */
  const swipeClose = (fromY: number) => {
    const root = dialogRef.current;
    if (!root || reduceMotion()) return onClose();
    busy.current = true;
    root.style.pointerEvents = "none";
    root.style.transition = `opacity ${CLOSE_MS}ms var(--ease-out)`;
    root.style.opacity = "0";
    setOffset(0, fromY + window.innerHeight * 0.3, CLOSE_MS);
    timer.current = window.setTimeout(onClose, CLOSE_MS);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (busy.current || e.touches.length !== 1) {
      // A second finger means pinch-zoom: drop the swipe and put the photo back.
      if (drag.current) setOffset(0, 0, SETTLE_MS);
      drag.current = null;
      return;
    }
    // If the photo is still gliding back, catch it where it is instead of jumping.
    const transform = trackRef.current ? getComputedStyle(trackRef.current).transform : "none";
    const m = transform && transform !== "none" ? new DOMMatrixReadOnly(transform) : null;
    const ox = m?.m41 ?? 0;
    const oy = m?.m42 ?? 0;
    setOffset(ox, oy);
    drag.current = {
      originX: e.touches[0].clientX - ox,
      originY: e.touches[0].clientY - oy,
      startTime: e.timeStamp,
      axis: ox ? "x" : oy ? "y" : null,
      dx: ox,
      dy: oy,
    };
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const d = drag.current;
    if (!d || e.touches.length !== 1) return;
    d.dx = e.touches[0].clientX - d.originX;
    d.dy = e.touches[0].clientY - d.originY;
    if (d.axis === null) {
      if (Math.abs(d.dx) < 8 && Math.abs(d.dy) < 8) return;
      d.axis = Math.abs(d.dx) > Math.abs(d.dy) ? "x" : d.dy > 0 ? "y" : "none";
    }
    if (d.axis === "x") {
      const pastEdge = (d.dx > 0 && !hasPrev) || (d.dx < 0 && !hasNext);
      setOffset(pastEdge ? d.dx * EDGE_RESISTANCE : d.dx, 0);
    } else if (d.axis === "y") {
      setOffset(0, Math.max(0, d.dy));
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.axis === null || d.axis === "none") return;
    d.dx = e.changedTouches[0].clientX - d.originX;
    d.dy = e.changedTouches[0].clientY - d.originY;
    const elapsed = Math.max(1, e.timeStamp - d.startTime);
    const flicked = (distance: number) => distance > FLICK_MIN_DISTANCE && distance / elapsed > FLICK_VELOCITY;

    if (d.axis === "x") {
      const towardNext = d.dx < 0 && hasNext;
      const towardPrev = d.dx > 0 && hasPrev;
      const distance = Math.abs(d.dx);
      if ((towardNext || towardPrev) && (distance > SWIPE_DISTANCE || flicked(distance))) return slideTo(towardNext);
    } else if (d.dy > CLOSE_DISTANCE || flicked(d.dy)) {
      return swipeClose(Math.max(0, d.dy));
    }
    setOffset(0, 0, SETTLE_MS);
  };

  const onTouchCancel = () => {
    if (drag.current) setOffset(0, 0, SETTLE_MS);
    drag.current = null;
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
      className="fixed inset-0 z-50 flex flex-col text-white lightbox-enter"
      onKeyDown={onKeyDown}
    >
      {/* The dark backdrop is its own layer, so swipe-down fades its opacity instead of repainting the screen. */}
      <div ref={backdropRef} className="absolute inset-0 -z-10 bg-[#1f1a16]" aria-hidden="true" />
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2 px-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-4">
        <p className="pl-2 text-sm text-white/70 tabular-nums" aria-live="polite">
          {index + 1} / {photos.length}
        </p>
        <button ref={closeRef} type="button" className="icon-btn text-white hover:!bg-white/15" onClick={onClose} aria-label="Close photo viewer">
          <CloseIcon size={26} />
        </button>
      </div>

      {/* Photo stage. touch-action: pinch-zoom hands one-finger drags to the swipe code and keeps pinch-zoom. */}
      <div
        className="relative flex-1 min-h-0 select-none touch-pinch-zoom"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchCancel}
        onClick={(e) => (e.target === e.currentTarget || e.target === trackRef.current) && onClose()}
      >
        {/* The track holds the photo and follows the finger during a swipe. */}
        <div ref={trackRef} className="absolute inset-0 flex items-center justify-center px-2 sm:px-20">
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
              className={`relative max-h-full w-auto max-w-full object-contain transition-opacity duration-300 ease-[var(--ease-out)] ${status === "loaded" ? "opacity-100" : "opacity-0"}`}
              draggable={false}
            />
          )}
        </div>
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
