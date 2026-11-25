import { Link } from "react-router";
import type { Album } from "~/lib/types";
import { pluralPhotos, tiltFor } from "~/lib/format";
import { Tape } from "./Decorations";
import { ImageIcon } from "./Icons";

export function AlbumCard({ album, index }: { album: Album; index: number }) {
  const cover = album.coverImage;
  return (
    <article
      className="polaroid polaroid-interactive group h-full flex flex-col has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-gold has-[a:focus-visible]:outline-offset-4"
      style={{ "--tilt": `${tiltFor(index + 2) * 0.7}deg` } as React.CSSProperties}
    >
      <Tape tone={(["rose", "sage", "beige"] as const)[index % 3]} />
      <div className="polaroid-photo relative aspect-[4/3]">
        {cover ? (
          <img
            src={cover.thumbnailUrl}
            alt=""
            width={cover.width}
            height={cover.height}
            loading={index < 3 ? "eager" : "lazy"}
            decoding="async"
            className="transition-transform duration-[250ms] ease-[var(--ease-out)] motion-safe:group-hover:scale-[1.03]"
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center content-center gap-1 text-ink-soft bg-paper-2">
            <ImageIcon size={30} />
            <span className="hand text-lg">waiting for its first photo</span>
          </span>
        )}
        {album.label && (
          <span className="hand absolute left-2.5 bottom-2.5 max-w-[calc(100%-1.25rem)] truncate rounded-sm bg-card/90 px-2.5 py-0.5 text-base text-ink shadow-sm -rotate-2">
            {album.label}
          </span>
        )}
      </div>
      <div className="px-1.5 pt-3.5 pb-4 flex-1 flex flex-col">
        <h3 className="text-xl sm:text-[1.4rem]">
          {/* The link covers the whole card so the card is one large tap target. */}
          <Link to={`/albums/${album.slug}`} prefetch="intent" className="after:absolute after:inset-0 after:z-[1] focus-visible:outline-none">
            {album.title}
          </Link>
        </h3>
        {album.description && <p className="mt-1.5 text-sm text-ink-soft line-clamp-2">{album.description}</p>}
        <p className="mt-auto pt-3 text-xs uppercase tracking-[0.14em] text-gold-text font-medium">{pluralPhotos(album.photoCount)}</p>
      </div>
    </article>
  );
}

export function AlbumGrid({ albums }: { albums: Album[] }) {
  return (
    <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 pt-4" role="list">
      {albums.map((album, i) => (
        <li key={album.id}>
          <AlbumCard album={album} index={i} />
        </li>
      ))}
    </ul>
  );
}
