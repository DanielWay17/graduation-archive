import { Link } from "react-router";
import type { Route } from "./+types/home";
import { featuredPhotos, listAlbums, publicPhoto } from "~/server/db.server";
import { ScrapbookHero } from "~/components/ScrapbookHero";
import { AlbumGrid } from "~/components/AlbumCard";
import { EmptyState } from "~/components/EmptyState";
import { Seo } from "~/components/Seo";
import { Squiggle, Star, TornEdge } from "~/components/Decorations";
import { ArrowRightIcon } from "~/components/Icons";

export async function loader() {
  const [albums, photos] = await Promise.all([listAlbums(), featuredPhotos(3)]);
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
  return (
    <>
      <Seo image={heroPhotos[0]?.imageUrl} />
      <ScrapbookHero photos={heroPhotos} exploreHref={exploreHref} />

      <TornEdge />
      <section className="bg-paper-2 pb-16 pt-10 sm:pt-14" aria-labelledby="featured-albums" data-reveal>
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="relative">
              <p className="eyebrow">chapters of the scrapbook</p>
              <h2 id="featured-albums" className="mt-1 text-3xl sm:text-4xl">
                Featured Albums
              </h2>
              <Squiggle className="mt-1 h-2.5 w-40" color="var(--color-sage)" />
              <Star className="absolute -right-9 top-1" size={22} />
            </div>
            {totalAlbums > albums.length && (
              <Link to="/albums" className="btn btn-ghost">
                All albums <ArrowRightIcon size={18} />
              </Link>
            )}
          </div>
          <div className="mt-8">
            {albums.length ? (
              <AlbumGrid albums={albums} />
            ) : (
              <EmptyState title="No albums yet" message="The first chapter is still being written." />
            )}
          </div>
        </div>
      </section>
      <TornEdge flip />

      <section className="container-page py-16 text-center" data-reveal>
        <p className="hand text-2xl sm:text-3xl text-ink-strong">Were you there? Add your photos to the scrapbook.</p>
        <p className="mt-2 text-ink-soft">Anyone can share. Your photos appear in the album right away.</p>
        <Link to="/upload" className="btn btn-primary mt-6">Share your photos</Link>
      </section>
    </>
  );
}
