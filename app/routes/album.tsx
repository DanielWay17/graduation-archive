import { data, Link } from "react-router";
import type { Route } from "./+types/album";
import type { Album } from "~/lib/types";
import { getAlbumBySlug, listPhotos, publicPhoto } from "~/server/db.server";
import { PhotoGallery } from "~/components/PhotoGallery";
import { EmptyState } from "~/components/EmptyState";
import { Seo } from "~/components/Seo";
import { UploadIcon } from "~/components/Icons";
import { pluralPhotos } from "~/lib/format";

export async function loader({ params }: Route.LoaderArgs) {
  const album = await getAlbumBySlug(params.slug);
  if (!album) throw data("Album not found", { status: 404 });
  const photos = await listPhotos(album.id);
  return { album, photos: photos.map(publicPhoto) };
}

/** With a cover photo the header is a photo banner; without one it stays a plain page header. */
function AlbumHeader({ album }: { album: Album }) {
  const cover = album.coverImage;
  const link = cover ? "text-white/80 hover:text-white" : "text-ink-soft hover:text-ink-strong";
  return (
    <header className={cover ? "relative isolate overflow-hidden bg-night text-white" : "border-b border-line"}>
      {cover && (
        <>
          <img
            src={cover.imageUrl}
            srcSet={`${cover.thumbnailUrl} 800w, ${cover.imageUrl} 2560w`}
            sizes="100vw"
            alt=""
            aria-hidden="true"
            fetchPriority="high"
            className="absolute inset-0 -z-20 h-full w-full object-cover"
          />
          <div aria-hidden="true" className="photo-scrim absolute inset-0 -z-10" />
        </>
      )}
      <div className={`container-page flex flex-col justify-between gap-10 pt-4 pb-10 sm:pb-14 ${cover ? "min-h-[24rem] sm:min-h-[30rem]" : ""}`}>
        <nav aria-label="Breadcrumb">
          <ol className={`flex flex-wrap items-center gap-x-1.5 text-sm ${cover ? "text-white/70" : "text-ink-soft"}`}>
            <li><Link to="/" className={`inline-flex min-h-[44px] items-center underline-offset-4 hover:underline ${link}`}>Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link to="/albums" className={`inline-flex min-h-[44px] items-center underline-offset-4 hover:underline ${link}`}>Albums</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className={`truncate max-w-[50vw] ${cover ? "text-white" : "text-ink"}`}>{album.title}</li>
          </ol>
        </nav>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className={`eyebrow ${cover ? "eyebrow-light" : ""}`}>
              {[album.label, pluralPhotos(album.photoCount)].filter(Boolean).join(" · ")}
            </p>
            <h1 className={`mt-3 text-4xl sm:text-6xl ${cover ? "text-white" : ""}`}>{album.title}</h1>
            {album.description && (
              <p className={`mt-4 text-[1.05rem] ${cover ? "text-white/85" : "text-ink"}`}>{album.description}</p>
            )}
          </div>
          <Link to={`/upload?album=${album.id}`} className={`btn ${cover ? "btn-glass" : "btn-secondary"}`}>
            <UploadIcon size={18} /> Add photos
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function AlbumPage({ loaderData }: Route.ComponentProps) {
  const { album, photos } = loaderData;
  return (
    <>
      <Seo
        title={album.title}
        description={album.description || `${pluralPhotos(album.photoCount)} from the graduation archive.`}
        image={album.coverImage?.imageUrl}
      />
      <AlbumHeader album={album} />

      <section className="container-page pt-10 sm:pt-14" aria-label={`Photos in ${album.title}`}>
        {photos.length ? (
          <PhotoGallery photos={photos} />
        ) : (
          <EmptyState
            title="No photos yet"
            message="This album is waiting for its first photo."
            action={<Link to={`/upload?album=${album.id}`} className="btn btn-primary">Add the first photo</Link>}
          />
        )}
      </section>
    </>
  );
}
