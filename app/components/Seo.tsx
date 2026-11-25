import { useLocation, useRouteLoaderData } from "react-router";
import { site } from "~/config/site";

type RootData = { origin: string };

/**
 * Page title, description and social-sharing (Open Graph / Twitter) tags.
 * React 19 hoists these tags into <head>.
 */
export function Seo({
  title,
  description = site.description,
  image,
  noindex = false,
}: {
  title?: string;
  description?: string;
  /** Path or absolute URL of the sharing image. Defaults to the site preview card. */
  image?: string;
  noindex?: boolean;
}) {
  const root = useRouteLoaderData<RootData>("root");
  const { pathname } = useLocation();
  const origin = root?.origin ?? "";
  const fullTitle = title ? `${title} · ${site.name}` : `${site.name} · ${site.tagline}`;
  const imageUrl = new URL(image ?? "/og-image.png", origin || "http://localhost").toString();
  const url = origin + pathname;
  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={site.name} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={imageUrl} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
    </>
  );
}
