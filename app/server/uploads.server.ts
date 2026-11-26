/**
 * Handles one photo upload: limits, validation, metadata removal, storage, database row.
 * Anyone may upload (published immediately). The owner may also save drafts.
 */
import { env } from "cloudflare:workers";
import type { UploadResult } from "~/lib/types";
import { clientKey, isOwner } from "./auth.server";
import {
  countRecentEvents,
  createPhoto,
  findPhotoByHash,
  getAlbumById,
  getPhoto,
  newId,
  publicPhoto,
  recordEvents,
  storageUsedBytes,
} from "./db.server";
import { hasUploadPass } from "./human-check.server";
import { checkAndCleanImage, ImageFileError } from "./image-file.server";
import { deleteImages, putImage } from "./storage.server";
import { getUploadLimits } from "./settings.server";
import { pluralPhotos } from "~/lib/format";

export const LIMITS = {
  fullMaxBytes: 12 * 1024 * 1024,
  thumbMaxBytes: 2 * 1024 * 1024,
  maxEdgePx: 4096,
  captionMax: 300,
  altMax: 300,
  nameMax: 60,
};

const text = (form: FormData, key: string, max: number) => String(form.get(key) ?? "").trim().slice(0, max);

export async function handleUpload(request: Request): Promise<{ status: number; body: UploadResult }> {
  const owner = await isOwner(request);
  const fail = (status: number, error: string, code?: Extract<UploadResult, { ok: false }>["code"]) => ({
    status,
    body: { ok: false as const, error, code },
  });

  // 1. Spam check and rate limits for visitors (the owner skips both).
  if (!owner && !(await hasUploadPass(request))) {
    return fail(403, "Please complete the quick check, then press Upload again.", "verification_required");
  }
  const who = await clientKey(request);
  if (!owner) {
    // The owner sets these in Owner's desk → Settings.
    const [{ perHour, perDay }, mine, everyone] = await Promise.all([
      getUploadLimits(),
      countRecentEvents(`upload:${who}`, 3_600_000),
      countRecentEvents("upload:all", 86_400_000),
    ]);
    if (mine >= perHour) return fail(429, `You have shared ${pluralPhotos(perHour)} this hour. Please try again later.`, "rate_limited");
    if (everyone >= perDay) return fail(429, "The archive has received many photos today. Please try again tomorrow.", "rate_limited");
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail(400, "The upload could not be read.", "invalid");
  }

  const full = form.get("full");
  const thumb = form.get("thumb");
  if (!(full instanceof File) || !(thumb instanceof File)) return fail(400, "The photo file is missing.", "invalid");
  if (full.size > LIMITS.fullMaxBytes || thumb.size > LIMITS.thumbMaxBytes) return fail(413, "The photo file is too large.", "invalid");

  const album = await getAlbumById(text(form, "albumId", 64));
  if (!album) return fail(400, "Please choose an album.", "invalid");

  const photoDateRaw = text(form, "photoDate", 10);
  const photoDate = /^\d{4}-\d{2}-\d{2}$/.test(photoDateRaw) ? photoDateRaw : null;
  const contentHash = /^[a-f0-9]{64}$/.test(text(form, "contentHash", 64)) ? text(form, "contentHash", 64) : null;
  const published = owner ? form.get("published") !== "0" : true;

  // 2. Duplicates.
  if (contentHash) {
    const existing = await findPhotoByHash(contentHash);
    if (existing) return fail(409, `This photo is already in the archive (album “${existing.album_title}”).`, "duplicate");
  }

  // 3. Validate the bytes and strip location metadata.
  let cleanFull, cleanThumb;
  try {
    cleanFull = checkAndCleanImage(new Uint8Array(await full.arrayBuffer()));
    cleanThumb = checkAndCleanImage(new Uint8Array(await thumb.arrayBuffer()));
  } catch (error) {
    if (error instanceof ImageFileError) return fail(415, error.message, "invalid");
    throw error;
  }
  if (Math.max(cleanFull.width, cleanFull.height) > LIMITS.maxEdgePx) return fail(400, "The photo is too large in pixels.", "invalid");

  // 4. Stay inside the free storage tier.
  const bytes = cleanFull.bytes.length + cleanThumb.bytes.length;
  const limitBytes = (Number(env.STORAGE_LIMIT_MB) || 9500) * 1024 * 1024;
  if ((await storageUsedBytes()) + bytes > limitBytes) {
    return fail(507, "The archive is full. The owner needs to free up space before more photos can be added.", "storage_full");
  }

  // 5. Store files, then the row. Remove the files again if the row fails.
  const id = newId("ph");
  const ext = cleanFull.type === "image/webp" ? "webp" : "jpg";
  const imageKey = `photos/${id}/full.${ext}`;
  const thumbKey = `photos/${id}/thumb.${cleanThumb.type === "image/webp" ? "webp" : "jpg"}`;
  await Promise.all([putImage(imageKey, cleanFull.bytes, cleanFull.type), putImage(thumbKey, cleanThumb.bytes, cleanThumb.type)]);
  try {
    await createPhoto({
      id,
      albumId: album.id,
      imageKey,
      thumbKey,
      imageType: cleanFull.type,
      width: cleanFull.width,
      height: cleanFull.height,
      bytes,
      caption: text(form, "caption", LIMITS.captionMax),
      altText: text(form, "altText", LIMITS.altMax),
      photoDate,
      uploaderName: text(form, "uploaderName", LIMITS.nameMax),
      contentHash,
      published,
    });
  } catch (error) {
    await deleteImages([imageKey, thumbKey]);
    if (String(error).includes("UNIQUE")) return fail(409, "This photo is already in the archive.", "duplicate");
    throw error;
  }
  if (!owner) await recordEvents([`upload:${who}`, "upload:all"]);

  const photo = await getPhoto(id);
  return { status: 201, body: { ok: true, photo: publicPhoto(photo!) } };
}
