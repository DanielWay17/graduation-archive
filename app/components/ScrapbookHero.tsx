import { Link } from "react-router";
import { site } from "~/config/site";
import type { Photo } from "~/lib/types";
import { Flower, PaperClip, Squiggle, Stamp, Star, Tape } from "./Decorations";

function HeroPolaroid({
  photo,
  className,
  tilt,
  caption,
  eager,
  sizes,
}: {
  photo: Photo | undefined;
  className: string;
  tilt: number;
  caption: string;
  eager?: boolean;
  sizes: string;
}) {
  return (
    <figure
      className={`polaroid absolute ${className}`}
      // Hero tilts stay visible on phones too, but gentler.
      style={{ rotate: `${tilt}deg` }}
    >
      <div className="polaroid-photo aspect-[4/5]">
        {photo ? (
          <img
            src={photo.thumbnailUrl}
            srcSet={`${photo.thumbnailUrl} 800w, ${photo.imageUrl} 2560w`}
            sizes={sizes}
            alt={photo.altText || photo.caption || "Graduation photo"}
            width={photo.width}
            height={photo.height}
            loading={eager ? "eager" : "lazy"}
            fetchPriority={eager ? "high" : "auto"}
            decoding={eager ? "sync" : "async"}
          />
        ) : (
          <div className="h-full w-full grid place-items-center bg-paper-2 text-ink-soft">
            <span className="hand text-lg text-center px-3">your photo here</span>
          </div>
        )}
      </div>
      <figcaption className="hand text-center text-[1.05rem] sm:text-xl text-ink py-2 sm:py-3 truncate">{caption}</figcaption>
    </figure>
  );
}

export function ScrapbookHero({ photos, exploreHref }: { photos: Photo[]; exploreHref: string }) {
  const [main, second, third] = photos;
  return (
    <section className="relative overflow-hidden" aria-labelledby="hero-title">
      <div className="container-page grid items-center gap-10 pt-8 pb-14 sm:pt-12 lg:grid-cols-[1.05fr_1fr] lg:gap-8 lg:pt-16 lg:pb-20">
        {/* Words */}
        <div className="relative z-10 animate-fade-up">
          <p className="eyebrow text-[1.6rem] sm:text-[1.9rem]">Dear memories,</p>
          <h1 id="hero-title" className="mt-1 text-[2.6rem] leading-[1.04] sm:text-6xl lg:text-[4.4rem]">
            A Chapter to <span className="relative inline-block italic">
              Remember.
              <Squiggle className="absolute -bottom-2 left-0 h-3 w-full" />
            </span>
          </h1>
          <p className="mt-6 max-w-md text-[1.05rem] sm:text-lg text-ink">
            Four years, countless memories, and the people who made every moment special.
          </p>
          <p className="mt-3 text-sm uppercase tracking-[0.16em] text-ink-soft">
            {site.universityShort} · Class of {site.graduationYear}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={exploreHref} className="btn btn-primary">
              Explore Memories
            </Link>
            <Link to="/albums" className="btn btn-secondary">
              View Albums
            </Link>
          </div>
        </div>

        {/* Collage */}
        <div className="relative mx-auto w-[86%] sm:w-full max-w-[25rem] sm:max-w-[32rem] aspect-[1/0.95]" aria-label="Featured photos" role="group">
          <HeroPolaroid
            photo={second}
            className="left-0 top-[12%] w-[46%] z-[1]"
            tilt={-7}
            caption="best friends"
            sizes="(min-width: 640px) 240px, 46vw"
          />
          <HeroPolaroid
            photo={third}
            className="right-0 top-[30%] w-[44%] z-[1]"
            tilt={6}
            caption="family ♡"
            sizes="(min-width: 640px) 230px, 44vw"
          />
          <HeroPolaroid
            photo={main}
            className="left-1/2 top-0 w-[58%] -translate-x-1/2 z-[2]"
            tilt={-1.5}
            caption="the big day"
            eager
            sizes="(min-width: 640px) 300px, 58vw"
          />
          <div className="absolute left-1/2 top-0 z-[3] -translate-x-1/2">
            <Tape />
          </div>
          <PaperClip className="absolute right-[24%] top-[26%] z-[3] rotate-12 hidden sm:block" />
          <Stamp
            top={`Class of ${site.graduationYear}`}
            bottom="Graduation"
            className="absolute -bottom-2 left-[2%] z-[3] w-[22%] h-auto rotate-[-10deg]"
          />
          <span className="hand absolute -bottom-[2%] left-[38%] z-[3] rounded-sm bg-card px-3 py-1 text-lg sm:text-xl text-ink shadow-[var(--shadow-paper)] rotate-[4deg]">
            {site.graduationDate}
          </span>
          <Star className="absolute right-[10%] top-[6%] z-[3] motion-safe:animate-wiggle" size={30} />
          <Flower className="absolute left-[14%] top-[2%] z-[3] hidden sm:block" />
        </div>
      </div>
    </section>
  );
}
