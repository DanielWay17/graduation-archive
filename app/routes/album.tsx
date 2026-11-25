import { data, Link } from "react-router";
import type { Route } from "./+types/album";
import { getAlbumBySlug, listPhotos, publicPhoto } from "~/server/db.server";
import { PhotoGallery } from "~/components/PhotoGallery";
import { EmptyState } from "~/components/EmptyState";
import { Seo } from "~/components/Seo";
import { Squiggle, Star } from "~/components/Decorations";
import { UploadIcon } from "~/components/Icons";
import { pluralPhotos } from "~/lib/format";

export async function loader({ params }: Route.LoaderArgs) {
  const album = await getAlbumBySlug(params.slug);
  if (!album) throw data("Album not found", { status: 404 });
  const photos = await listPhotos(album.id);
  return { album, photos: photos.map(publicPhoto) };
}

export default function AlbumPage({ loaderData }: Route.ComponentProps) {
  const { album, photos } = loaderData;
  return (
    <>
      <Seo
        title={album.title}
        description={album.description || `${pluralPhotos(album.photoCount)} from the graduation scrapbook.`}
        image={album.coverImage?.imageUrl}
      />
      <header className="relative overflow-hidden border-b border-line">
        {album.coverImage && (
          // Soft, blurred cover as a backdrop.
          <img
            src={album.coverImage.thumbnailUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-[0.16] blur-2xl scale-110"
          />
        )}
        <div className="relative container-page pt-6 pb-10 sm:pt-8 sm:pb-14">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-x-1.5 text-sm text-ink-soft">
              <li><Link to="/" className="inline-flex min-h-[44px] items-center hover:text-ink-strong underline-offset-4 hover:underline">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link to="/albums" className="inline-flex min-h-[44px] items-center hover:text-ink-strong underline-offset-4 hover:underline">Albums</Link></li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-ink truncate max-w-[50vw]">{album.title}</li>
            </ol>
          </nav>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl relative">
              {album.label && <p className="eyebrow">{album.label}</p>}
              <h1 className="mt-1 text-4xl sm:text-5xl">{album.title}</h1>
              <Squiggle className="mt-1 h-3 w-40" />
              {album.description && <p className="mt-4 text-[1.05rem] text-ink">{album.description}</p>}
              <p className="mt-3 text-sm uppercase tracking-[0.14em] text-gold-text font-medium">{pluralPhotos(album.photoCount)}</p>
              <Star className="absolute -top-1 -right-8 hidden sm:block" size={24} />
            </div>
            <Link to={`/upload?album=${album.id}`} className="btn btn-secondary">
              <UploadIcon size={18} /> Add photos
            </Link>
          </div>
        </div>
      </header>

      <section className="container-page pt-10" aria-label={`Photos in ${album.title}`}>
        {photos.length ? (
          <PhotoGallery photos={photos} />
        ) : (
          <EmptyState
            title="No photos yet"
            message="This page of the scrapbook is waiting for its first memory."
            action={<Link to={`/upload?album=${album.id}`} className="btn btn-primary">Add the first photo</Link>}
          />
        )}
      </section>
    </>
  );
}
