import type { Route } from "./+types/albums";
import { listAlbums } from "~/server/db.server";
import { AlbumGrid } from "~/components/AlbumCard";
import { EmptyState } from "~/components/EmptyState";
import { Seo } from "~/components/Seo";
import { pluralPhotos } from "~/lib/format";

export async function loader() {
  return { albums: await listAlbums() };
}

export default function Albums({ loaderData }: Route.ComponentProps) {
  const { albums } = loaderData;
  const total = albums.reduce((sum, a) => sum + a.photoCount, 0);
  return (
    <div className="container-page pt-10 pb-6 sm:pt-14">
      <Seo title="Albums" description="Every album in the graduation archive: the big day, friends, family, campus and more." image={albums.find((a) => a.coverImage)?.coverImage?.imageUrl} />
      <header className="max-w-2xl">
        <p className="eyebrow">
          {albums.length} {albums.length === 1 ? "album" : "albums"} · {pluralPhotos(total)}
        </p>
        <h1 className="mt-3 text-5xl sm:text-6xl">Albums</h1>
      </header>
      <div className="mt-10">
        {albums.length ? (
          <AlbumGrid albums={albums} />
        ) : (
          <EmptyState title="No albums yet" message="The first album is still being put together." />
        )}
      </div>
    </div>
  );
}
