-- Albums: one scrapbook chapter each.
CREATE TABLE albums (
  id             TEXT PRIMARY KEY,
  slug           TEXT NOT NULL UNIQUE,
  title          TEXT NOT NULL,
  description    TEXT NOT NULL DEFAULT '',
  label          TEXT NOT NULL DEFAULT '',          -- small handwritten tag on the album card
  cover_photo_id TEXT,                              -- optional; falls back to the first published photo
  sort_order     INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Photos: the image files live in R2; this row holds their keys and metadata.
CREATE TABLE photos (
  id            TEXT PRIMARY KEY,
  album_id      TEXT NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  image_key     TEXT NOT NULL,                      -- R2 key of the display image (max 2560 px)
  thumb_key     TEXT NOT NULL,                      -- R2 key of the thumbnail (max 800 px)
  image_type    TEXT NOT NULL DEFAULT 'image/webp',
  width         INTEGER NOT NULL,
  height        INTEGER NOT NULL,
  bytes         INTEGER NOT NULL DEFAULT 0,         -- display + thumbnail size, for the storage limit
  caption       TEXT NOT NULL DEFAULT '',
  alt_text      TEXT NOT NULL DEFAULT '',
  photo_date    TEXT,                               -- YYYY-MM-DD, optional
  uploader_name TEXT NOT NULL DEFAULT '',
  content_hash  TEXT,                               -- SHA-256 of the original file, blocks duplicate uploads
  published     INTEGER NOT NULL DEFAULT 1,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX photos_album_order ON photos (album_id, published, sort_order);
CREATE UNIQUE INDEX photos_content_hash ON photos (content_hash) WHERE content_hash IS NOT NULL;

-- Rate-limit events for guest uploads and owner login attempts.
CREATE TABLE rate_events (
  bucket     TEXT NOT NULL,                         -- e.g. "upload:<hashed ip>", "upload:all", "login:<hashed ip>"
  created_at INTEGER NOT NULL                       -- unix epoch milliseconds
);

CREATE INDEX rate_events_bucket_time ON rate_events (bucket, created_at);
