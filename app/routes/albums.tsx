import type { Route } from "./+types/albums";
import { listAlbums } from "~/server/db.server";
import { AlbumGrid } from "~/components/AlbumCard";
import { EmptyState } from "~/components/EmptyState";
import { Seo } from "~/components/Seo";
import { Flower, Squiggle } from "~/components/Decorations";
import { pluralPhotos } from "~/lib/format";

export async function loader() {
  return { albums: await listAlbums() };
}

export default function Albums({ loaderData }: Route.ComponentProps) {
  const { albums } = loaderData;
  const total = albums.reduce((sum, a) => sum + a.photoCount, 0);
  return (
    <div className="container-page pt-10 pb-6 sm:pt-14">
      <Seo title="Albums" description="Every chapter of the graduation scrapbook: the big day, friends, family, campus and more." image={albums.find((a) => a.coverImage)?.coverImage?.imageUrl} />
      <header className="relative max-w-2xl">
        <p className="eyebrow">the table of contents</p>
        <h1 className="mt-1 text-4xl sm:text-5xl">Albums</h1>
        <Squiggle className="mt-1 h-3 w-36" />
        <p className="mt-4 text-ink-soft">
          {albums.length} {albums.length === 1 ? "chapter" : "chapters"} · {pluralPhotos(total)}
        </p>
        <Flower className="absolute -top-2 right-0 hidden sm:block" />
      </header>
      <div className="mt-10">
        {albums.length ? (
          <AlbumGrid albums={albums} />
        ) : (
          <EmptyState title="No albums yet" message="The first chapter is still being written." />
        )}
      </div>
    </div>
  );
}
