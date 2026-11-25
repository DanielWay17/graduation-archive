import type { Route } from "./+types/upload";
import { listAlbums } from "~/server/db.server";
import { isOwner } from "~/server/auth.server";
import { hasUploadPass, humanCheckSiteKey } from "~/server/human-check.server";
import { Uploader } from "~/components/Uploader";
import { Seo } from "~/components/Seo";

export async function loader({ request }: Route.LoaderArgs) {
  const albums = await listAlbums();
  const requested = new URL(request.url).searchParams.get("album");
  const siteKey = humanCheckSiteKey();
  const humanCheck = siteKey && !(await isOwner(request)) ? { siteKey, verified: await hasUploadPass(request) } : null;
  return { albums, defaultAlbumId: albums.some((a) => a.id === requested) ? requested! : undefined, humanCheck };
}

export default function Upload({ loaderData }: Route.ComponentProps) {
  return (
    <div className="container-page pt-10 sm:pt-14">
      <Seo title="Share photos" description="Add your graduation photos to the archive." />
      <header className="max-w-2xl">
        <p className="eyebrow">Were you there?</p>
        <h1 className="mt-3 text-5xl sm:text-6xl">Share your photos</h1>
        <p className="mt-4 text-ink">
          Add your photos and they will appear in the album right away. Everyone visiting the site can see them.
        </p>
        <p className="mt-2 text-sm text-ink-soft">
          Photos are resized on your device before upload, and location data (GPS) is removed.
        </p>
      </header>
      <div className="mt-8">
        <Uploader albums={loaderData.albums} mode="guest" defaultAlbumId={loaderData.defaultAlbumId} humanCheck={loaderData.humanCheck} />
      </div>
    </div>
  );
}
