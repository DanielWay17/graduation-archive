import { Link } from "react-router";
import type { Route } from "./+types/home";
import { featuredPhotos, listAlbums, publicPhoto } from "~/server/db.server";
import { PhotoHero } from "~/components/PhotoHero";
import { AlbumGrid } from "~/components/AlbumCard";
import { EmptyState } from "~/components/EmptyState";
import { Seo } from "~/components/Seo";
import { ArrowRightIcon } from "~/components/Icons";

export async function loader() {
  const [albums, photos] = await Promise.all([listAlbums(), featuredPhotos(2)]);
  const firstWithPhotos = albums.find((a) => a.photoCount > 0);
  return {
    albums: albums.slice(0, 6),
    totalAlbums: albums.length,
    heroPhotos: photos.map(publicPhoto),
    exploreHref: firstWithPhotos ? `/albums/${firstWithPhotos.slug}` : "/albums",
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { albums, heroPhotos, exploreHref, totalAlbums } = loaderData;
  // The share band reuses a second photo, blurred, so it does not repeat the hero.
  const bandPhoto = heroPhotos[1] ?? heroPhotos[0];
  return (
    <>
      <Seo image={heroPhotos[0]?.imageUrl} />
      <PhotoHero photo={heroPhotos[0]} exploreHref={exploreHref} />

      <section className="container-page pt-16 pb-6 sm:pt-24" aria-labelledby="featured-albums" data-reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">The collection</p>
            <h2 id="featured-albums" className="mt-3 text-4xl sm:text-5xl">
              Albums
            </h2>
          </div>
          {totalAlbums > albums.length && (
            <Link to="/albums" className="btn btn-ghost">
              All albums <ArrowRightIcon size={18} />
            </Link>
          )}
        </div>
        <div className="mt-10">
          {albums.length ? (
            <AlbumGrid albums={albums} />
          ) : (
            <EmptyState title="No albums yet" message="The first album is still being put together." />
          )}
        </div>
      </section>

      <section className="container-page pt-16 sm:pt-24" aria-labelledby="share-title" data-reveal>
        <div className="relative isolate overflow-hidden rounded-[24px] bg-night px-6 py-16 text-center text-white sm:px-12 sm:py-24">
          {bandPhoto && (
            <img
              src={bandPhoto.thumbnailUrl}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className="absolute inset-0 -z-20 h-full w-full scale-110 object-cover opacity-70 blur-2xl"
            />
          )}
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-night/55" />
          <p className="eyebrow eyebrow-light">Were you there?</p>
          <h2 id="share-title" className="mx-auto mt-4 max-w-2xl text-4xl text-white sm:text-5xl">
            Add your photos to the archive
          </h2>
          <p className="mx-auto mt-4 max-w-md text-white/80">
            Anyone can share. Your photos appear in the album right away.
          </p>
          <Link to="/upload" className="btn btn-light mt-8">
            Share your photos
          </Link>
        </div>
      </section>
    </>
  );
}
