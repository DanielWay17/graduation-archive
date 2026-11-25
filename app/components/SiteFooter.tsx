import { Link } from "react-router";
import { site } from "~/config/site";
import { TornEdge } from "./Decorations";

export function SiteFooter({ isOwner }: { isOwner: boolean }) {
  return (
    <footer className="mt-20">
      <TornEdge />
      <div className="bg-paper-2">
        <div className="container-page py-10 grid gap-6 sm:grid-cols-[1fr_auto] items-end">
          <div>
            <p className="hand text-2xl text-ink-strong">{site.tagline}</p>
            <p className="mt-1 text-sm text-ink-soft">
              {site.university} · Class of {site.graduationYear}
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
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
      </div>
    </footer>
  );
}
