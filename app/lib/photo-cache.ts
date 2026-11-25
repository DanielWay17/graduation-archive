/**
 * Photos this browser tab has already seen, kept in memory until the next full page load.
 * Galleries add to it; Favorites paints from it at once instead of showing a skeleton
 * and fetching photos it already knows.
 *
 * Client only: on the server every call is a no-op, so one visitor's photos never
 * leak into another visitor's render.
 */
import type { Photo } from "./types";

/** `null` = asked for, but no longer in the archive (deleted or unpublished). */
const photos = new Map<string, Photo | null>();
const isClient = typeof window !== "undefined";

export function rememberPhotos(list: Photo[]) {
  if (!isClient) return;
  for (const photo of list) photos.set(photo.id, photo);
}

/** Records the answer to a fetch: requested ids that did not come back are gone. */
export function rememberFetched(requestedIds: string[], found: Photo[]) {
  if (!isClient) return;
  rememberPhotos(found);
  const foundIds = new Set(found.map((p) => p.id));
  for (const id of requestedIds) if (!foundIds.has(id)) photos.set(id, null);
}

/** The photo, `null` if it is known to be gone, or `undefined` if not seen yet. */
export function cachedPhoto(id: string): Photo | null | undefined {
  return isClient ? photos.get(id) : undefined;
}
