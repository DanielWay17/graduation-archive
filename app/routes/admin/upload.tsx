import type { Route } from "./+types/upload";
import { requireOwner } from "~/server/auth.server";
import { listAlbums } from "~/server/db.server";
import { Uploader } from "~/components/Uploader";

export async function loader({ request }: Route.LoaderArgs) {
  await requireOwner(request);
  const albums = await listAlbums();
  const requested = new URL(request.url).searchParams.get("album");
  return { albums, defaultAlbumId: albums.some((a) => a.id === requested) ? requested! : undefined };
}

export default function AdminUpload({ loaderData }: Route.ComponentProps) {
  return (
    <div>
      <h2 className="text-2xl">Upload photos</h2>
      <p className="mt-1 mb-6 text-sm text-ink-soft">As the owner you have no upload limit per hour, and you can save photos as drafts.</p>
      <Uploader albums={loaderData.albums} mode="owner" defaultAlbumId={loaderData.defaultAlbumId} />
    </div>
  );
}
