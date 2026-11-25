import { Link } from "react-router";
import { site } from "~/config/site";
import type { Photo } from "~/lib/types";
import { photoAlt } from "~/lib/format";

/** Full-width cover photo with the title set on top of it, like the cover of a photo book. */
export function PhotoHero({ photo }: { photo: Photo | undefined }) {
  return (
    <section className="relative isolate overflow-hidden bg-night text-white" aria-labelledby="hero-title">
      {photo && (
        <img
          src={photo.imageUrl}
          srcSet={`${photo.thumbnailUrl} 800w, ${photo.imageUrl} 2560w`}
          sizes="100vw"
          alt={photoAlt(photo)}
          width={photo.width}
          height={photo.height}
          loading="eager"
          fetchPriority="high"
          decoding="sync"
          className="hero-photo absolute inset-0 -z-20 h-full w-full object-cover"
        />
      )}
      <div aria-hidden="true" className="photo-scrim absolute inset-0 -z-10" />

      <div className="hero-frame container-page flex flex-col justify-end pb-12 pt-24 sm:pb-16 lg:pb-20">
        <div className="grid items-end gap-10 lg:grid-cols-[1fr_auto]">
          <div className="max-w-3xl animate-fade-up">
            <p className="eyebrow eyebrow-light">
              Class of {site.graduationYear} · {site.universityShort}
            </p>
            <h1 id="hero-title" className="mt-4 text-[2.9rem] leading-[1.02] text-white sm:text-7xl lg:text-[5.75rem]">
              A Chapter to <em className="font-normal">Remember.</em>
            </h1>
            <p className="mt-6 max-w-xl text-[1.05rem] text-white/85 sm:text-lg">
              Four years, countless memories, and the people who made every moment special.
            </p>
            <Link to="/albums" className="btn btn-light mt-9">
              View albums
            </Link>
          </div>

          <p className="hidden border-l border-white/40 pl-4 text-sm leading-relaxed text-white/80 lg:block">
            Graduation day
            <br />
            <span className="font-display text-2xl text-white">{site.graduationDate}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
