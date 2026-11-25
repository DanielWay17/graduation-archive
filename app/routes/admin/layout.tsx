import { Form, NavLink, Outlet } from "react-router";
import type { Route } from "./+types/layout";
import { requireOwner } from "~/server/auth.server";
import { Seo } from "~/components/Seo";

/** Every route inside this layout is owner-only; child loaders/actions also check on their own. */
export async function loader({ request }: Route.LoaderArgs) {
  await requireOwner(request);
  return null;
}

export default function AdminLayout() {
  const tab = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center min-h-[44px] px-4 rounded-full text-sm ${isActive ? "bg-ink text-card" : "hover:bg-paper-2"}`;
  return (
    <div className="container-page pt-8 sm:pt-12">
      <Seo title="Owner’s desk" noindex />
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
        <div>
          <p className="eyebrow">behind the scrapbook</p>
          <h1 className="mt-1 text-3xl sm:text-4xl">Owner’s desk</h1>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <nav aria-label="Owner" className="flex flex-wrap gap-1">
            <NavLink to="/admin" end className={tab}>Albums</NavLink>
            <NavLink to="/admin/upload" className={tab}>Upload</NavLink>
          </nav>
          <Form method="post" action="/admin/logout">
            <button className="btn btn-ghost btn-sm">Log out</button>
          </Form>
        </div>
      </div>
      <div className="pt-8">
        <Outlet />
      </div>
    </div>
  );
}
