import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigation } from "react-router";
import { site } from "~/config/site";
import { useFavorites } from "~/lib/favorites";
import { CloseIcon, MenuIcon, UploadIcon } from "./Icons";

function Mortarboard() {
  return (
    <svg aria-hidden="true" width="30" height="30" viewBox="0 0 32 32" className="shrink-0 hidden min-[360px]:block">
      <circle cx="16" cy="16" r="15" fill="var(--color-beige)" />
      <path d="M16 9 6 13.5l10 4.5 10-4.5L16 9Z" fill="var(--color-ink)" />
      <path d="M10.5 16v4c0 1.4 2.5 2.6 5.5 2.6s5.5-1.2 5.5-2.6v-4L16 18.5 10.5 16Z" fill="var(--color-ink)" />
      <path d="M24.5 14.2v5.3" stroke="var(--color-gold)" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="24.5" cy="20.2" r="1.3" fill="var(--color-gold)" />
    </svg>
  );
}

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/albums", label: "Albums", end: false },
  { to: "/favorites", label: "Favorites", end: false },
];

export function SiteHeader({ isOwner }: { isOwner: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { ids } = useFavorites();
  useEffect(() => setMenuOpen(false), [location.pathname]);

  // While a page loads, highlight the tab that was clicked, not the one being left,
  // so the click is acknowledged at once instead of after the server answers.
  const navigating = useNavigation().state !== "idle";
  const navClass = ({ isActive, isPending }: { isActive: boolean; isPending: boolean }) =>
    `relative inline-flex items-center min-h-[44px] px-3 rounded-full text-[0.95rem] transition-colors ${
      (navigating ? isPending : isActive) ? "text-ink-strong font-medium bg-paper-2" : "text-ink hover:text-ink-strong hover:bg-paper-2/70"
    }`;

  const favoriteBadge = ids.length > 0 && (
    <span className="ml-1.5 inline-grid min-w-5 h-5 place-items-center rounded-full bg-rose px-1 text-[0.7rem] font-semibold text-ink-strong tabular-nums">
      {ids.length}
      <span className="sr-only"> saved</span>
    </span>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/90 backdrop-blur-md supports-[not(backdrop-filter:blur(1px))]:bg-paper">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 btn btn-primary !min-h-0 z-50">
        Skip to content
      </a>
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Link to="/" className="flex min-w-0 items-center gap-2 sm:gap-2.5 min-h-[44px] rounded-md" aria-label={`${site.name}, home`}>
          <Mortarboard />
          <span className="hand text-[1.3rem] min-[375px]:text-[1.45rem] sm:text-[1.6rem] leading-none text-ink-strong whitespace-nowrap">
            {site.name}
          </span>
        </Link>

        {/* Desktop and tablet navigation */}
        <nav aria-label="Main" className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={navClass} prefetch="intent">
              {l.label}
              {l.to === "/favorites" && favoriteBadge}
            </NavLink>
          ))}
          {isOwner && (
            <NavLink to="/admin" className={navClass}>
              Owner’s desk
            </NavLink>
          )}
          <Link to="/upload" className="btn btn-primary btn-sm ml-2 !min-h-[40px]">
            <UploadIcon size={18} /> Share photos
          </Link>
        </nav>

        {/* Phone navigation */}
        <div className="flex shrink-0 items-center md:hidden">
          <Link to="/upload" className="icon-btn" aria-label="Share photos">
            <UploadIcon />
          </Link>
          <button
            type="button"
            className="icon-btn"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <nav id="mobile-menu" aria-label="Main" className="mobile-menu md:hidden border-t border-line bg-paper">
          <ul className="container-page grid gap-1 py-3">
            {links.map((l) => (
              <li key={l.to}>
                <NavLink to={l.to} end={l.end} className={(s) => `${navClass(s)} w-full !rounded-lg !px-4`}>
                  {l.label}
                  {l.to === "/favorites" && favoriteBadge}
                </NavLink>
              </li>
            ))}
            {isOwner && (
              <li>
                <NavLink to="/admin" className={(s) => `${navClass(s)} w-full !rounded-lg !px-4`}>
                  Owner’s desk
                </NavLink>
              </li>
            )}
          </ul>
        </nav>
      )}
    </header>
  );
}
