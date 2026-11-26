-- Settings the owner changes in Owner's desk → Settings (key/value).
-- A missing key falls back to the value in wrangler.jsonc.
CREATE TABLE settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
