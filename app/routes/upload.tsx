import type { Route } from "./+types/upload";
import { listAlbums } from "~/server/db.server";
import { Uploader } from "~/components/Uploader";
import { Seo } from "~/components/Seo";
import { Squiggle, Star } from "~/components/Decorations";

export async function loader({ request }: Route.LoaderArgs) {
  const albums = await listAlbums();
  const requested = new URL(request.url).searchParams.get("album");
  return { albums, defaultAlbumId: albums.some((a) => a.id === requested) ? requested! : undefined };
}

export default function Upload({ loaderData }: Route.ComponentProps) {
  return (
    <div className="container-page pt-10 sm:pt-14">
      <Seo title="Share photos" description="Add your graduation photos to the scrapbook." />
      <header className="relative max-w-2xl">
        <p className="eyebrow">add a page to the scrapbook</p>
        <h1 className="mt-1 text-4xl sm:text-5xl">Share your photos</h1>
        <Squiggle className="mt-1 h-3 w-44" />
        <p className="mt-4 text-ink">
          Were you there? Add your photos and they will appear in the album right away. Everyone visiting the site can see them.
        </p>
        <p className="mt-2 text-sm text-ink-soft">
          Photos are resized on your device before upload, and location data (GPS) is removed.
        </p>
        <Star className="absolute -top-1 right-0 hidden sm:block" />
      </header>
      <div className="mt-8">
        <Uploader albums={loaderData.albums} mode="guest" defaultAlbumId={loaderData.defaultAlbumId} />
      </div>
    </div>
  );
}
