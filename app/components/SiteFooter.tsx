import { Link } from "react-router";
import { site } from "~/config/site";

export function SiteFooter({ isOwner }: { isOwner: boolean }) {
  return (
    <footer className="mt-24 border-t border-line bg-paper-2">
      <div className="container-page grid items-end gap-6 py-12 sm:grid-cols-[1fr_auto]">
        <div>
          <p className="font-display text-2xl italic text-ink-strong">{site.tagline}</p>
          <p className="mt-2 text-sm text-ink-soft">
            {site.university} · Class of {site.graduationYear}
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <Link to="/albums" className="min-h-[44px] inline-flex items-center hover:text-ink-strong">Albums</Link>
          <Link to="/upload" className="min-h-[44px] inline-flex items-center hover:text-ink-strong">Share photos</Link>
          {isOwner ? (
            <form method="post" action="/admin/logout">
              <button className="min-h-[44px] inline-flex items-center hover:text-ink-strong">Log out</button>
            </form>
          ) : (
            <Link to="/admin" className="min-h-[44px] inline-flex items-center text-ink-soft hover:text-ink-strong">Owner login</Link>
          )}
        </nav>
      </div>
    </footer>
  );
}
