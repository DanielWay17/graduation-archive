import { Link } from "react-router";
import type { Album } from "~/lib/types";
import { pluralPhotos } from "~/lib/format";
import { ImageIcon } from "./Icons";

/** The album's cover photo fills the whole card; the title sits on the photo. */
export function AlbumCard({ album, index }: { album: Album; index: number }) {
  const cover = album.coverImage;
  return (
    <article className="album-card group has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-gold has-[a:focus-visible]:outline-offset-4">
      {cover ? (
        <img
          src={cover.thumbnailUrl}
          alt=""
          width={cover.width}
          height={cover.height}
          loading={index < 3 ? "eager" : "lazy"}
          decoding="async"
          className="album-card-photo"
        />
      ) : (
        <span aria-hidden="true" className="absolute inset-0 -z-[2] grid place-items-center bg-[#26231f] text-white/35">
          <ImageIcon size={40} />
        </span>
      )}

      {album.label && (
        <span className="absolute left-4 top-4 max-w-[calc(100%-2rem)] truncate rounded-full bg-night/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
          {album.label}
        </span>
      )}

      <div className="p-5 sm:p-6">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-white/75">
          {album.photoCount > 0 ? pluralPhotos(album.photoCount) : "No photos yet"}
        </p>
        <h3 className="mt-1.5 text-2xl text-white sm:text-[1.75rem]">
          {/* The link covers the whole card so the card is one large tap target. */}
          <Link to={`/albums/${album.slug}`} prefetch="intent" className="after:absolute after:inset-0 after:z-[1] focus-visible:outline-none">
            {album.title}
          </Link>
        </h3>
        {album.description && <p className="mt-1.5 text-sm text-white/80 line-clamp-2">{album.description}</p>}
      </div>
    </article>
  );
}

export function AlbumGrid({ albums }: { albums: Album[] }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6" role="list">
      {albums.map((album, i) => (
        <li key={album.id}>
          <AlbumCard album={album} index={i} />
        </li>
      ))}
    </ul>
  );
}
