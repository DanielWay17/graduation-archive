import { isRouteErrorResponse, Link, Links, Meta, Outlet, Scripts, ScrollRestoration, useRouteLoaderData } from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { SiteHeader } from "./components/SiteHeader";
import { SiteFooter } from "./components/SiteFooter";
import { EmptyState } from "./components/EmptyState";
import { isOwner } from "./server/auth.server";
import { useReveal } from "./lib/use-reveal";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,400;0,500;0,600;1,400&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap",
  },
];

export async function loader({ request }: Route.LoaderArgs) {
  return { isOwner: await isOwner(request), origin: new URL(request.url).origin };
}

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useRouteLoaderData<typeof loader>("root");
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#F6F5F2" />
        <Meta />
        <Links />
      </head>
      <body className="flex min-h-dvh flex-col">
        <SiteHeader isOwner={data?.isOwner ?? false} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter isOwner={data?.isOwner ?? false} />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  useReveal();
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  let details = notFound ? "This page does not exist, or it has moved." : "Something went wrong while opening this page.";
  if (import.meta.env.DEV && error instanceof Error) details = error.message;
  return (
    <div className="container-page py-16">
      <title>{notFound ? "Page not found" : "Something went wrong"}</title>
      <EmptyState
        title={notFound ? "Page not found" : "Something went wrong"}
        message={details}
        action={<Link to="/" className="btn btn-primary">Back to home</Link>}
      />
    </div>
  );
}
