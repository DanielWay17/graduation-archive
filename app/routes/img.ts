/**
 * Serves photo files from R2: /img/<photoId>/thumb or /img/<photoId>/full.
 * Unpublished (draft) photos are served only to the owner.
 */
import type { Route } from "./+types/img";
import { getPhoto } from "~/server/db.server";
import { getImage, placeholderSvg } from "~/server/storage.server";
import { isOwner } from "~/server/auth.server";

export async function loader({ request, params }: Route.LoaderArgs) {
  if (params.variant !== "thumb" && params.variant !== "full") return new Response("Not found", { status: 404 });
  const photo = await getPhoto(params.id);
  if (!photo) return new Response("Not found", { status: 404 });
  if (!photo.published && !(await isOwner(request))) return new Response("Not found", { status: 404 });

  const cache = photo.published ? "public, max-age=604800, stale-while-revalidate=86400" : "private, no-store";
  const key = params.variant === "full" ? photo.imageKey : photo.thumbKey;

  if (key.startsWith("placeholder:")) {
    return new Response(placeholderSvg(Number(key.split(":")[1]) || 0, photo.width, photo.height), {
      headers: { "Content-Type": "image/svg+xml", "Cache-Control": cache },
    });
  }

  const object = await getImage(key);
  if (!object) return new Response("Not found", { status: 404 });
  const etag = object.httpEtag;
  if (request.headers.get("If-None-Match") === etag) {
    return new Response(null, { status: 304, headers: { ETag: etag, "Cache-Control": cache } });
  }
  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "image/webp",
      "Content-Length": String(object.size),
      "Cache-Control": cache,
      ETag: etag,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
