# The Graduation Archive

*A chapter to remember. A lifetime of memories.*

A public digital scrapbook for graduation photos. Anyone can browse the albums and share their own photos, and shared photos appear right away. The owner has a password-protected area (`/admin`) for managing albums and photos.

## Stack (free tier)

| Part | Service | Free allowance |
| --- | --- | --- |
| Website + API | Cloudflare Workers, React Router v8 (server-rendered) | 100,000 requests/day |
| Database (albums, captions) | Cloudflare D1 (SQLite) | 5 GB, 5M reads/day |
| Photo files | Cloudflare R2 | 10 GB storage, free downloads |
| Styling | Tailwind CSS v4 + custom scrapbook components | — |

Uploads stop at `STORAGE_LIMIT_MB` (9,500 MB by default, set in `wrangler.jsonc`), so the archive cannot grow past the R2 free tier.

## How uploads work

1. The browser resizes each photo to a display image (longest side at most 2560 px) and a thumbnail (at most 800 px), as WebP, or JPEG where the browser cannot write WebP. Re-encoding drops all EXIF data, including GPS location.
2. The server checks the bytes are really WebP or JPEG, reads the true size, and **removes EXIF/XMP blocks again**, in case someone posts a file directly to the API.
3. A SHA-256 fingerprint of the original file blocks duplicate uploads.
4. Limits for visitors: `GUEST_UPLOADS_PER_HOUR` per IP address (60) and `GUEST_UPLOADS_PER_DAY` for everyone together (1,000). The owner has no limit.
5. Visitor uploads are always published. Only the owner can save drafts. Draft images return 404 to everyone except the owner.

## Run it locally

Requires Node 20+.

```bash
npm install
cp .dev.vars.example .dev.vars      # then edit: set OWNER_PASSWORD and a long SESSION_SECRET
npm run setup:local                 # creates the local database + 5 starter albums + sample placeholder photos
npm run dev                         # http://localhost:5173
```

The local database and photo storage are simulated on your computer (in `.wrangler/`), so no Cloudflare account is needed. The sample photos are labelled "Sample photo · replace me" and exist **only** locally.

## Deploy to Cloudflare (free)

You need a free Cloudflare account. Run all commands in this folder.

```bash
npx wrangler login

# 1. Create the database. Copy the printed database_id into wrangler.jsonc (d1_databases → database_id).
npx wrangler d1 create graduation-archive

# 2. Create the photo bucket. (The first time, Cloudflare may ask you to enable R2 in the dashboard.)
npx wrangler r2 bucket create graduation-archive-photos

# 3. Set the two secrets (you are prompted for each value).
npx wrangler secret put OWNER_PASSWORD
npx wrangler secret put SESSION_SECRET       # e.g. the output of: openssl rand -base64 48

# 4. Create the tables and the 5 starter albums in the real database.
npm run db:migrate:remote

# 5. Build and deploy.
npm run deploy
```

The site is then live at `https://graduation-archive.<your-subdomain>.workers.dev`. To use your own domain, add it under Workers → your worker → Settings → Domains & Routes.

Never run `npm run db:seed:local` with `--remote`: the sample photos are only for local previews.

## Personalise

- University, year, date, and tagline: `app/config/site.ts`
- Starter albums: edit them in `/admin` after deploying, or change `migrations/0002_starter_albums.sql` before the first deploy.
- Colours and fonts: the `@theme` block at the top of `app/app.css`
- Sharing preview image: `public/og-image.png` (1200 × 630)

## Project layout

```
app/
  config/site.ts           editable site details
  components/              UI: SiteHeader, ScrapbookHero, AlbumCard/AlbumGrid, PolaroidCard,
                           PhotoGallery, PhotoLightbox, FavoriteButton, UploadDropzone, Uploader, …
  lib/                     browser + shared code: types, favorites (localStorage), image resizing
  server/                  server-only adapters
    db.server.ts           every SQL query (D1)
    storage.server.ts      photo files (R2)
    auth.server.ts         owner login, signed session cookie, rate-limited
    uploads.server.ts      upload rules and limits
    image-file.server.ts   WebP/JPEG validation and metadata removal
  routes/                  pages and endpoints (see app/routes.ts)
migrations/                database schema + starter albums
scripts/seed-local.sql     local-only placeholder photos
```

## Notes and limits

- Favorites are saved in each visitor's browser (localStorage). They do not sync between devices.
- HEIC photos (iPhone) upload from Safari. Chrome and Firefox cannot open HEIC, and they show a message asking for JPEG.
- Visitors can upload without signing in, as requested, so spam is possible. The rate limits cap it, and the owner can delete any photo in `/admin`. A CAPTCHA (Cloudflare Turnstile, free) is a possible next step.
