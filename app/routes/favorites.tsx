import { useEffect, useMemo, useReducer, useRef, useSyncExternalStore } from "react";
import { Link, useFetcher } from "react-router";
import type { Photo } from "~/lib/types";
import { useFavorites } from "~/lib/favorites";
import { cachedPhoto, rememberFetched } from "~/lib/photo-cache";
import { PhotoGallery } from "~/components/PhotoGallery";
import { EmptyState } from "~/components/EmptyState";
import { Seo } from "~/components/Seo";

const noSubscribe = () => () => {};
/**
 * False only while hydrating the server HTML; true on every client render after,
 * including client-side navigations, so those never flash the loading skeleton.
 */
const useHydrated = () => useSyncExternalStore(noSubscribe, () => true, () => false);

/**
 * Favorites live in this browser's localStorage, so the photo details come from the client:
 * photos seen earlier in this visit paint at once; only unseen ones are fetched.
 */
export default function Favorites() {
  const { ids } = useFavorites();
  const hydrated = useHydrated();
  const fetcher = useFetcher<{ photos: Photo[] }>();
  const requested = useRef<string[]>([]);
  // Bumped when a fetch result lands in the cache, so the page re-reads it.
  const [cacheVersion, cacheUpdated] = useReducer((n: number) => n + 1, 0);

  const missingKey = hydrated ? ids.filter((id) => cachedPhoto(id) === undefined).join(",") : "";

  useEffect(() => {
    if (!missingKey) return;
    requested.current = missingKey.split(",");
    fetcher.load(`/api/photos?ids=${encodeURIComponent(missingKey)}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missingKey]);

  useEffect(() => {
    if (!fetcher.data) return;
    rememberFetched(requested.current, fetcher.data.photos);
    cacheUpdated();
  }, [fetcher.data]);

  const photos = useMemo(
    () => (hydrated ? ids.map((id) => cachedPhoto(id)).filter((p): p is Photo => Boolean(p)) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hydrated, ids, cacheVersion],
  );

  const loading = !hydrated || missingKey !== "";

  return (
    <div className="container-page pt-10 sm:pt-14">
      <Seo title="Favorites" description="The photos you saved in this browser." noindex />
      <header className="max-w-2xl">
        <p className="eyebrow">Saved by you</p>
        <h1 className="mt-3 text-5xl sm:text-6xl">Favorites</h1>
        <p className="mt-4 text-sm text-ink-soft">Saved in this browser only. They are not shared with anyone.</p>
      </header>

      {/* Same minimum height for loading, empty and filled states, so the footer never jumps. */}
      <div className="mt-10 min-h-[24rem]" aria-busy={loading}>
        {loading ? (
          <div className="masonry max-h-[24rem] overflow-hidden" aria-hidden="true">
            {[4 / 5, 1, 3 / 4, 4 / 3].map((r, i) => (
              <div key={i}>
                <div className="img-skeleton rounded-xl" style={{ aspectRatio: r }} />
                <div className="h-10" />
              </div>
            ))}
          </div>
        ) : photos.length ? (
          <PhotoGallery photos={photos} showAlbum />
        ) : (
          <EmptyState
            title="No favorites yet"
            message="Tap the heart on any photo to keep it here."
            action={<Link to="/albums" className="btn btn-primary">Browse albums</Link>}
          />
        )}
        {!loading && photos.length < ids.length && (
          <p className="mt-6 text-sm text-ink-soft">Some saved photos are no longer in the archive.</p>
        )}
      </div>
    </div>
  );
}

