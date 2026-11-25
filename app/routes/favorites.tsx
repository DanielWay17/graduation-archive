import { useEffect, useMemo, useState } from "react";
import { Link, useFetcher } from "react-router";
import type { Photo } from "~/lib/types";
import { useFavorites } from "~/lib/favorites";
import { PhotoGallery } from "~/components/PhotoGallery";
import { EmptyState } from "~/components/EmptyState";
import { Seo } from "~/components/Seo";
import { Squiggle } from "~/components/Decorations";

/** Favorites live in this browser's localStorage, so the photo details are fetched on the client. */
export default function Favorites() {
  const { ids } = useFavorites();
  const fetcher = useFetcher<{ photos: Photo[] }>();
  const [hydrated, setHydrated] = useState(false);
  const [requested, setRequested] = useState<Set<string>>(new Set());
  const idKey = ids.join(",");

  useEffect(() => {
    setHydrated(true);
    // Fetch only when a favorite appears that was not requested yet; removals filter locally.
    if (ids.length && ids.some((id) => !requested.has(id))) {
      setRequested(new Set(ids));
      fetcher.load(`/api/photos?ids=${encodeURIComponent(idKey)}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idKey]);

  const photos = useMemo(() => {
    const byId = new Map(fetcher.data?.photos.map((p) => [p.id, p]));
    return ids.map((id) => byId.get(id)).filter((p): p is Photo => Boolean(p));
  }, [fetcher.data, ids]);

  const loading = !hydrated || (ids.length > 0 && !fetcher.data);

  return (
    <div className="container-page pt-10 sm:pt-14">
      <Seo title="Favorites" description="The photos you saved in this browser." noindex />
      <header className="max-w-2xl">
        <p className="eyebrow">the ones I keep coming back to</p>
        <h1 className="mt-1 text-4xl sm:text-5xl">Favorites</h1>
        <Squiggle className="mt-1 h-3 w-40" />
        <p className="mt-4 text-sm text-ink-soft">Saved in this browser only. They are not shared with anyone.</p>
      </header>

      {/* Same minimum height for loading, empty and filled states, so the footer never jumps. */}
      <div className="mt-10 min-h-[24rem]" aria-busy={loading}>
        {loading ? (
          <div className="masonry max-h-[24rem] overflow-hidden" aria-hidden="true">
            {[4 / 5, 1, 3 / 4, 4 / 3].map((r, i) => (
              <div key={i} className="polaroid">
                <div className="img-skeleton" style={{ aspectRatio: r }} />
                <div className="h-12" />
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
        {fetcher.data && photos.length < ids.length && !loading && (
          <p className="mt-6 text-sm text-ink-soft">Some saved photos are no longer in the archive.</p>
        )}
      </div>
    </div>
  );
}

