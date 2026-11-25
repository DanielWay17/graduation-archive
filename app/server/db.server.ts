/**
 * Database adapter (Cloudflare D1). Every SQL query in the app lives here, so the
 * storage engine can be swapped without touching routes or components.
 */
import { env } from "cloudflare:workers";
import type { Album, ImageRef, Photo } from "~/lib/types";
import { slugify } from "~/lib/format";

type AlbumRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  label: string;
  cover_photo_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  photo_count: number;
  draft_count: number;
  cover_id: string | null;
  cover_width: number | null;
  cover_height: number | null;
  cover_alt: string | null;
};

type PhotoRow = {
  id: string;
  album_id: string;
  album_title: string;
  album_slug: string;
  image_key: string;
  thumb_key: string;
  image_type: string;
  width: number;
  height: number;
  bytes: number;
  caption: string;
  alt_text: string;
  photo_date: string | null;
  uploader_name: string;
  published: number;
  sort_order: number;
  created_at: string;
};

export type StoredPhoto = Photo & { imageKey: string; thumbKey: string; imageType: string };

const db = () => env.DB;

export function newId(prefix: string) {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return prefix + "_" + Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 18);
}

export function imageUrls(photoId: string) {
  return { imageUrl: `/img/${photoId}/full`, thumbnailUrl: `/img/${photoId}/thumb` };
}

function toAlbum(row: AlbumRow): Album {
  const coverImage: ImageRef | null = row.cover_id
    ? {
        photoId: row.cover_id,
        ...imageUrls(row.cover_id),
        width: row.cover_width ?? 4,
        height: row.cover_height ?? 3,
        altText: row.cover_alt || `Cover of the album ${row.title}`,
      }
    : null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    label: row.label,
    coverImage,
    coverPhotoId: row.cover_photo_id,
    photoCount: row.photo_count,
    draftCount: row.draft_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sortOrder: row.sort_order,
  };
}

function toPhoto(row: PhotoRow): StoredPhoto {
  return {
    id: row.id,
    albumId: row.album_id,
    albumTitle: row.album_title,
    albumSlug: row.album_slug,
    ...imageUrls(row.id),
    width: row.width,
    height: row.height,
    caption: row.caption,
    altText: row.alt_text,
    photoDate: row.photo_date,
    uploaderName: row.uploader_name,
    createdAt: row.created_at,
    sortOrder: row.sort_order,
    published: row.published === 1,
    imageKey: row.image_key,
    thumbKey: row.thumb_key,
    imageType: row.image_type,
  };
}

/** Strip server-only fields before sending a photo to the browser. */
export function publicPhoto(p: StoredPhoto): Photo {
  const { imageKey: _i, thumbKey: _t, imageType: _y, ...rest } = p;
  return rest;
}

// The cover is the chosen cover photo if it is still published, else the first published photo.
const ALBUM_SELECT = `
  SELECT a.*,
    (SELECT COUNT(*) FROM photos p WHERE p.album_id = a.id AND p.published = 1) AS photo_count,
    (SELECT COUNT(*) FROM photos p WHERE p.album_id = a.id AND p.published = 0) AS draft_count,
    c.id AS cover_id, c.width AS cover_width, c.height AS cover_height, c.alt_text AS cover_alt
  FROM albums a
  LEFT JOIN photos c ON c.id = COALESCE(
    (SELECT id FROM photos WHERE id = a.cover_photo_id AND published = 1),
    (SELECT id FROM photos WHERE album_id = a.id AND published = 1 ORDER BY sort_order, created_at LIMIT 1)
  )`;

const PHOTO_SELECT = `
  SELECT p.*, a.title AS album_title, a.slug AS album_slug
  FROM photos p JOIN albums a ON a.id = p.album_id`;

// ---------- Albums ----------

export async function listAlbums(): Promise<Album[]> {
  const { results } = await db().prepare(`${ALBUM_SELECT} ORDER BY a.sort_order, a.created_at`).all<AlbumRow>();
  return results.map(toAlbum);
}

export async function getAlbumBySlug(slug: string): Promise<Album | null> {
  const row = await db().prepare(`${ALBUM_SELECT} WHERE a.slug = ?`).bind(slug).first<AlbumRow>();
  return row ? toAlbum(row) : null;
}

export async function getAlbumById(id: string): Promise<Album | null> {
  const row = await db().prepare(`${ALBUM_SELECT} WHERE a.id = ?`).bind(id).first<AlbumRow>();
  return row ? toAlbum(row) : null;
}

async function uniqueSlug(title: string, exceptId?: string) {
  const base = slugify(title) || "album";
  for (let n = 1; n < 100; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    const taken = await db()
      .prepare("SELECT id FROM albums WHERE slug = ? AND id != ?")
      .bind(candidate, exceptId ?? "")
      .first();
    if (!taken) return candidate;
  }
  return `${base}-${Date.now()}`;
}

export async function createAlbum(input: { title: string; description: string; label: string }) {
  const id = newId("alb");
  const slug = await uniqueSlug(input.title);
  const next = await db().prepare("SELECT COALESCE(MAX(sort_order), 0) + 1 AS n FROM albums").first<{ n: number }>();
  await db()
    .prepare("INSERT INTO albums (id, slug, title, description, label, sort_order) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(id, slug, input.title, input.description, input.label, next?.n ?? 1)
    .run();
  return id;
}

export async function updateAlbum(id: string, input: { title: string; description: string; label: string }) {
  const slug = await uniqueSlug(input.title, id);
  await db()
    .prepare(
      "UPDATE albums SET title = ?, slug = ?, description = ?, label = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?",
    )
    .bind(input.title, slug, input.description, input.label, id)
    .run();
}

export async function setAlbumCover(albumId: string, photoId: string | null) {
  await db()
    .prepare("UPDATE albums SET cover_photo_id = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?")
    .bind(photoId, albumId)
    .run();
}

/** Deletes the album row and its photo rows. Returns the R2 keys the caller must delete. */
export async function deleteAlbum(id: string): Promise<string[]> {
  const { results } = await db()
    .prepare("SELECT image_key, thumb_key FROM photos WHERE album_id = ?")
    .bind(id)
    .all<{ image_key: string; thumb_key: string }>();
  await db().batch([
    db().prepare("DELETE FROM photos WHERE album_id = ?").bind(id),
    db().prepare("DELETE FROM albums WHERE id = ?").bind(id),
  ]);
  return results.flatMap((r) => [r.image_key, r.thumb_key]);
}

/** Swap an album with its neighbour. direction -1 = earlier, +1 = later. */
export async function moveAlbum(id: string, direction: -1 | 1) {
  const { results } = await db().prepare("SELECT id FROM albums ORDER BY sort_order, created_at").all<{ id: string }>();
  await reorder("albums", results.map((r) => r.id), id, direction);
}

// ---------- Photos ----------

export async function listPhotos(albumId: string, opts: { includeDrafts?: boolean } = {}): Promise<StoredPhoto[]> {
  const { results } = await db()
    .prepare(
      `${PHOTO_SELECT} WHERE p.album_id = ? ${opts.includeDrafts ? "" : "AND p.published = 1"} ORDER BY p.sort_order, p.created_at`,
    )
    .bind(albumId)
    .all<PhotoRow>();
  return results.map(toPhoto);
}

/** Published photos for the hero: covers of the first albums first, then the newest. */
export async function featuredPhotos(limit: number): Promise<StoredPhoto[]> {
  const { results } = await db()
    .prepare(`${PHOTO_SELECT} WHERE p.published = 1 ORDER BY a.sort_order, p.sort_order, p.created_at LIMIT ?`)
    .bind(limit)
    .all<PhotoRow>();
  return results.map(toPhoto);
}

export async function getPublishedPhotosByIds(ids: string[]): Promise<StoredPhoto[]> {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => "?").join(",");
  const { results } = await db()
    .prepare(`${PHOTO_SELECT} WHERE p.published = 1 AND p.id IN (${placeholders})`)
    .bind(...ids)
    .all<PhotoRow>();
  return results.map(toPhoto);
}

export async function getPhoto(id: string): Promise<StoredPhoto | null> {
  const row = await db().prepare(`${PHOTO_SELECT} WHERE p.id = ?`).bind(id).first<PhotoRow>();
  return row ? toPhoto(row) : null;
}

export async function findPhotoByHash(hash: string) {
  return db()
    .prepare("SELECT p.id, a.title AS album_title FROM photos p JOIN albums a ON a.id = p.album_id WHERE p.content_hash = ?")
    .bind(hash)
    .first<{ id: string; album_title: string }>();
}

export async function storageUsedBytes(): Promise<number> {
  const row = await db().prepare("SELECT COALESCE(SUM(bytes), 0) AS total FROM photos").first<{ total: number }>();
  return row?.total ?? 0;
}

export async function createPhoto(input: {
  id: string;
  albumId: string;
  imageKey: string;
  thumbKey: string;
  imageType: string;
  width: number;
  height: number;
  bytes: number;
  caption: string;
  altText: string;
  photoDate: string | null;
  uploaderName: string;
  contentHash: string | null;
  published: boolean;
}) {
  const next = await db()
    .prepare("SELECT COALESCE(MAX(sort_order), 0) + 1 AS n FROM photos WHERE album_id = ?")
    .bind(input.albumId)
    .first<{ n: number }>();
  await db()
    .prepare(
      `INSERT INTO photos (id, album_id, image_key, thumb_key, image_type, width, height, bytes, caption, alt_text,
        photo_date, uploader_name, content_hash, published, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.id,
      input.albumId,
      input.imageKey,
      input.thumbKey,
      input.imageType,
      input.width,
      input.height,
      input.bytes,
      input.caption,
      input.altText,
      input.photoDate,
      input.uploaderName,
      input.contentHash,
      input.published ? 1 : 0,
      next?.n ?? 1,
    )
    .run();
}

export async function updatePhoto(
  id: string,
  input: { caption: string; altText: string; photoDate: string | null; albumId: string; published: boolean },
) {
  const current = await getPhoto(id);
  if (!current) return;
  let sortOrder = current.sortOrder;
  if (current.albumId !== input.albumId) {
    const next = await db()
      .prepare("SELECT COALESCE(MAX(sort_order), 0) + 1 AS n FROM photos WHERE album_id = ?")
      .bind(input.albumId)
      .first<{ n: number }>();
    sortOrder = next?.n ?? 1;
  }
  await db()
    .prepare(
      "UPDATE photos SET caption = ?, alt_text = ?, photo_date = ?, album_id = ?, published = ?, sort_order = ? WHERE id = ?",
    )
    .bind(input.caption, input.altText, input.photoDate, input.albumId, input.published ? 1 : 0, sortOrder, id)
    .run();
}

export async function setPhotoPublished(id: string, published: boolean) {
  await db().prepare("UPDATE photos SET published = ? WHERE id = ?").bind(published ? 1 : 0, id).run();
}

/** Deletes the photo row. Returns the R2 keys the caller must delete. */
export async function deletePhoto(id: string): Promise<string[]> {
  const photo = await getPhoto(id);
  if (!photo) return [];
  await db().batch([
    db().prepare("DELETE FROM photos WHERE id = ?").bind(id),
    db().prepare("UPDATE albums SET cover_photo_id = NULL WHERE cover_photo_id = ?").bind(id),
  ]);
  return [photo.imageKey, photo.thumbKey];
}

export async function movePhoto(id: string, direction: -1 | 1) {
  const photo = await getPhoto(id);
  if (!photo) return;
  const { results } = await db()
    .prepare("SELECT id FROM photos WHERE album_id = ? ORDER BY sort_order, created_at")
    .bind(photo.albumId)
    .all<{ id: string }>();
  await reorder("photos", results.map((r) => r.id), id, direction);
}

async function reorder(table: "albums" | "photos", orderedIds: string[], id: string, direction: -1 | 1) {
  const from = orderedIds.indexOf(id);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= orderedIds.length) return;
  [orderedIds[from], orderedIds[to]] = [orderedIds[to], orderedIds[from]];
  await db().batch(
    orderedIds.map((rowId, index) => db().prepare(`UPDATE ${table} SET sort_order = ? WHERE id = ?`).bind(index + 1, rowId)),
  );
}

// ---------- Rate limiting ----------

/** Counts events in `bucket` within the last `windowMs`. */
export async function countRecentEvents(bucket: string, windowMs: number): Promise<number> {
  const row = await db()
    .prepare("SELECT COUNT(*) AS n FROM rate_events WHERE bucket = ? AND created_at > ?")
    .bind(bucket, Date.now() - windowMs)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

export async function recordEvents(buckets: string[]) {
  const now = Date.now();
  const statements = buckets.map((b) => db().prepare("INSERT INTO rate_events (bucket, created_at) VALUES (?, ?)").bind(b, now));
  // Occasionally clear events older than two days so the table stays small.
  if (Math.random() < 0.05) {
    statements.push(db().prepare("DELETE FROM rate_events WHERE created_at < ?").bind(now - 2 * 86_400_000));
  }
  await db().batch(statements);
}
