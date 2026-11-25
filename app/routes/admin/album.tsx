import { data, Link, useFetcher } from "react-router";
import type { Route } from "./+types/album";
import { assertSameOrigin, requireOwner } from "~/server/auth.server";
import {
  deletePhoto,
  getAlbumById,
  getPhoto,
  listAlbums,
  listPhotos,
  movePhoto,
  publicPhoto,
  setAlbumCover,
  setPhotoPublished,
  updatePhoto,
} from "~/server/db.server";
import { deleteImages } from "~/server/storage.server";
import type { Album, Photo } from "~/lib/types";
import { ConfirmButton } from "~/components/ConfirmButton";
import { ChevronDownIcon, ChevronUpIcon, UploadIcon } from "~/components/Icons";

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireOwner(request);
  const album = await getAlbumById(params.id);
  if (!album) throw data("Album not found", { status: 404 });
  const [photos, albums] = await Promise.all([listPhotos(album.id, { includeDrafts: true }), listAlbums()]);
  return { album, albums, photos: photos.map(publicPhoto) };
}

export async function action({ request, params }: Route.ActionArgs) {
  await requireOwner(request);
  assertSameOrigin(request);
  const form = await request.formData();
  const intent = form.get("intent");
  const id = String(form.get("id") ?? "");
  const photo = await getPhoto(id);
  if (!photo) return data({ ok: false, error: "That photo no longer exists." }, { status: 404 });

  switch (intent) {
    case "save": {
      const albumId = String(form.get("albumId") ?? photo.albumId);
      const date = String(form.get("photoDate") ?? "");
      await updatePhoto(id, {
        caption: String(form.get("caption") ?? "").trim().slice(0, 300),
        altText: String(form.get("altText") ?? "").trim().slice(0, 300),
        photoDate: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null,
        albumId: (await getAlbumById(albumId)) ? albumId : photo.albumId,
        published: form.get("published") === "on",
      });
      return { ok: true, error: "" };
    }
    case "publish":
    case "unpublish":
      await setPhotoPublished(id, intent === "publish");
      return { ok: true, error: "" };
    case "cover":
      await setAlbumCover(params.id, id);
      return { ok: true, error: "" };
    case "move-up":
    case "move-down":
      await movePhoto(id, intent === "move-up" ? -1 : 1);
      return { ok: true, error: "" };
    case "delete":
      await deleteImages(await deletePhoto(id));
      return { ok: true, error: "" };
  }
  return data({ ok: false, error: "Unknown action." }, { status: 400 });
}

function PhotoEditor({ photo, albums, isCover, first, last }: { photo: Photo; albums: Album[]; isCover: boolean; first: boolean; last: boolean }) {
  const fetcher = useFetcher<typeof action>();
  const busy = fetcher.state !== "idle";
  const p = photo.id;
  return (
    <li className="paper-card overflow-hidden flex flex-col">
      <div className="relative bg-paper-2" style={{ aspectRatio: "4 / 3" }}>
        <img src={photo.thumbnailUrl} alt={photo.altText} className="h-full w-full object-contain" loading="lazy" />
        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
          {!photo.published && <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs text-card">Draft</span>}
          {isCover && <span className="rounded-full bg-gold px-2.5 py-0.5 text-xs text-card">Cover</span>}
        </div>
        <fetcher.Form method="post" className="absolute right-1 top-1 flex flex-col">
          <input type="hidden" name="id" value={p} />
          <button name="intent" value="move-up" className="icon-btn bg-card/90" disabled={first || busy} aria-label="Move photo earlier"><ChevronUpIcon size={18} /></button>
          <button name="intent" value="move-down" className="icon-btn bg-card/90 mt-1" disabled={last || busy} aria-label="Move photo later"><ChevronDownIcon size={18} /></button>
        </fetcher.Form>
      </div>
      <fetcher.Form method="post" id={`${p}-edit`} className="p-4 grid gap-3">
        <input type="hidden" name="id" value={p} />
        <div>
          <label className="field-label" htmlFor={`${p}-caption`}>Caption</label>
          <input id={`${p}-caption`} name="caption" className="field" maxLength={300} defaultValue={photo.caption} />
        </div>
        <div>
          <label className="field-label" htmlFor={`${p}-alt`}>Description for screen readers</label>
          <input id={`${p}-alt`} name="altText" className="field" maxLength={300} defaultValue={photo.altText} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label" htmlFor={`${p}-date`}>Date</label>
            <input id={`${p}-date`} name="photoDate" type="date" className="field" defaultValue={photo.photoDate ?? ""} />
          </div>
          <div>
            <label className="field-label" htmlFor={`${p}-album`}>Album</label>
            <select id={`${p}-album`} name="albumId" className="field" defaultValue={photo.albumId}>
              {albums.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
            </select>
          </div>
        </div>
        <label className="inline-flex items-center gap-2 min-h-[44px] text-sm">
          <input type="checkbox" name="published" defaultChecked={photo.published} className="h-5 w-5 accent-[var(--color-ink)]" />
          Published (visible to everyone)
        </label>
        {photo.uploaderName && <p className="text-xs text-ink-soft">Shared by {photo.uploaderName}</p>}
        {fetcher.data?.error && <p role="alert" className="text-sm text-danger">{fetcher.data.error}</p>}
      </fetcher.Form>
      {/* Outside the edit form: the delete dialog has its own form, and forms cannot nest. */}
      <div className="flex flex-wrap items-center gap-2 px-4 pb-4">
          <button form={`${p}-edit`} name="intent" value="save" className="btn btn-primary btn-sm" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
          {!isCover && photo.published && (
            <button form={`${p}-edit`} name="intent" value="cover" className="btn btn-secondary btn-sm" disabled={busy}>Use as cover</button>
          )}
          <ConfirmButton
            title="Delete this photo?"
            message="The photo is removed from the archive permanently. This cannot be undone."
            confirmLabel="Delete photo"
            fields={{ intent: "delete", id: p }}
          >
            Delete
          </ConfirmButton>
          {fetcher.state === "idle" && fetcher.data?.ok && <span className="text-sm text-ink-soft" role="status">Saved.</span>}
      </div>
    </li>
  );
}

export default function AdminAlbum({ loaderData }: Route.ComponentProps) {
  const { album, albums, photos } = loaderData;
  const coverId = album.coverImage?.photoId;
  return (
    <div>
      <nav aria-label="Breadcrumb" className="text-sm text-ink-soft">
        <Link to="/admin" className="inline-flex min-h-[44px] items-center hover:text-ink-strong">Albums</Link> / <span className="text-ink">{album.title}</span>
      </nav>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl">{album.title}</h2>
          <p className="text-sm text-ink-soft">{photos.length} photos · {album.draftCount} drafts</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/albums/${album.slug}`} className="btn btn-secondary btn-sm">View public page</Link>
          <Link to={`/admin/upload?album=${album.id}`} className="btn btn-primary btn-sm"><UploadIcon size={16} /> Upload here</Link>
        </div>
      </div>
      {photos.length === 0 ? (
        <p className="mt-8 paper-card p-6 text-center text-ink-soft">No photos in this album yet.</p>
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {photos.map((photo, i) => (
            <PhotoEditor key={photo.id} photo={photo} albums={albums} isCover={photo.id === coverId} first={i === 0} last={i === photos.length - 1} />
          ))}
        </ul>
      )}
    </div>
  );
}
