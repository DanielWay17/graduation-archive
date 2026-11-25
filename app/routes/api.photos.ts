/**
 * GET  /api/photos?ids=a,b,c  → published photos with those ids (used by Favorites)
 * POST /api/photos            → upload one photo (multipart form, see uploads.server.ts)
 */
import type { Route } from "./+types/api.photos";
import { getPublishedPhotosByIds, publicPhoto } from "~/server/db.server";
import { handleUpload } from "~/server/uploads.server";
import { assertSameOrigin } from "~/server/auth.server";

export async function loader({ request }: Route.LoaderArgs) {
  const raw = new URL(request.url).searchParams.get("ids") ?? "";
  const ids = [...new Set(raw.split(",").map((s) => s.trim()).filter((s) => /^[\w-]{1,40}$/.test(s)))].slice(0, 90);
  const photos = await getPublishedPhotosByIds(ids);
  return Response.json({ photos: photos.map(publicPhoto) }, { headers: { "Cache-Control": "no-store" } });
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  assertSameOrigin(request);
  const { status, body } = await handleUpload(request);
  return Response.json(body, { status });
}
