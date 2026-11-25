import { data, Link, useFetcher } from "react-router";
import type { Route } from "./+types/index";
import { assertSameOrigin, requireOwner } from "~/server/auth.server";
import { createAlbum, deleteAlbum, listAlbums, moveAlbum, storageUsedBytes, updateAlbum } from "~/server/db.server";
import { deleteImages } from "~/server/storage.server";
import type { Album } from "~/lib/types";
import { pluralPhotos } from "~/lib/format";
import { ConfirmButton } from "~/components/ConfirmButton";
import { ChevronDownIcon, ChevronUpIcon, ImageIcon } from "~/components/Icons";
import { env } from "cloudflare:workers";

export async function loader({ request }: Route.LoaderArgs) {
  await requireOwner(request);
  const [albums, used] = await Promise.all([listAlbums(), storageUsedBytes()]);
  return { albums, usedMb: used / 1024 / 1024, limitMb: Number(env.STORAGE_LIMIT_MB) || 9500 };
}

function albumFields(form: FormData) {
  return {
    title: String(form.get("title") ?? "").trim().slice(0, 80),
    description: String(form.get("description") ?? "").trim().slice(0, 300),
    label: String(form.get("label") ?? "").trim().slice(0, 30),
  };
}

export async function action({ request }: Route.ActionArgs) {
  await requireOwner(request);
  assertSameOrigin(request);
  const form = await request.formData();
  const intent = form.get("intent");
  const id = String(form.get("id") ?? "");
  switch (intent) {
    case "create": {
      const fields = albumFields(form);
      if (!fields.title) return data({ ok: false, error: "Please give the album a title." }, { status: 400 });
      await createAlbum(fields);
      return { ok: true, error: "" };
    }
    case "update": {
      const fields = albumFields(form);
      if (!fields.title) return data({ ok: false, error: "The title cannot be empty." }, { status: 400 });
      await updateAlbum(id, fields);
      return { ok: true, error: "" };
    }
    case "delete":
      await deleteImages(await deleteAlbum(id));
      return { ok: true, error: "" };
    case "move-up":
    case "move-down":
      await moveAlbum(id, intent === "move-up" ? -1 : 1);
      return { ok: true, error: "" };
  }
  return data({ ok: false, error: "Unknown action." }, { status: 400 });
}

function AlbumFields({ album }: { album?: Album }) {
  const p = album?.id ?? "new";
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
      <div>
        <label className="field-label" htmlFor={`${p}-title`}>Title</label>
        <input id={`${p}-title`} name="title" className="field" required maxLength={80} defaultValue={album?.title} />
      </div>
      <div>
        <label className="field-label" htmlFor={`${p}-label`}>Card label <span className="font-normal text-ink-soft">(optional)</span></label>
        <input id={`${p}-label`} name="label" className="field" maxLength={30} defaultValue={album?.label} placeholder="e.g. the big day" />
      </div>
      <div className="sm:col-span-2">
        <label className="field-label" htmlFor={`${p}-description`}>Description</label>
        <textarea id={`${p}-description`} name="description" className="field" maxLength={300} defaultValue={album?.description} />
      </div>
    </div>
  );
}

function AlbumRow({ album, first, last }: { album: Album; first: boolean; last: boolean }) {
  const fetcher = useFetcher<typeof action>();
  const busy = fetcher.state !== "idle";
  return (
    <li className="paper-card p-4 sm:p-5">
      <div className="flex gap-4 items-start">
        <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 overflow-hidden rounded bg-paper-2 grid place-items-center text-ink-soft">
          {album.coverImage ? <img src={album.coverImage.thumbnailUrl} alt="" className="h-full w-full object-cover" /> : <ImageIcon />}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl truncate">{album.title}</h2>
          <p className="text-sm text-ink-soft">
            {pluralPhotos(album.photoCount)} published{album.draftCount ? ` · ${album.draftCount} draft` : ""} · /albums/{album.slug}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to={`/admin/albums/${album.id}`} className="btn btn-primary btn-sm">Manage photos</Link>
            <Link to={`/albums/${album.slug}`} className="btn btn-secondary btn-sm">View</Link>
            <ConfirmButton
              title={`Delete “${album.title}”?`}
              message={`This permanently deletes the album and all ${album.photoCount + album.draftCount} photos in it. This cannot be undone.`}
              confirmLabel="Delete album"
              fields={{ intent: "delete", id: album.id }}
            >
              Delete
            </ConfirmButton>
          </div>
        </div>
        <fetcher.Form method="post" className="flex flex-col">
          <input type="hidden" name="id" value={album.id} />
          <button name="intent" value="move-up" className="icon-btn" disabled={first || busy} aria-label={`Move ${album.title} up`}><ChevronUpIcon /></button>
          <button name="intent" value="move-down" className="icon-btn" disabled={last || busy} aria-label={`Move ${album.title} down`}><ChevronDownIcon /></button>
        </fetcher.Form>
      </div>
      <details className="mt-4 group">
        <summary className="cursor-pointer text-sm font-medium min-h-[44px] flex items-center">Edit details</summary>
        <fetcher.Form method="post" className="mt-2 grid gap-3">
          <input type="hidden" name="intent" value="update" />
          <input type="hidden" name="id" value={album.id} />
          <AlbumFields album={album} />
          {fetcher.data?.error && <p role="alert" className="text-sm text-danger">{fetcher.data.error}</p>}
          <div className="flex items-center gap-3">
            <button className="btn btn-primary btn-sm" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
            {fetcher.data?.ok && fetcher.state === "idle" && <span className="text-sm text-ink-soft" role="status">Saved.</span>}
          </div>
          <p className="field-hint">To change the cover, open “Manage photos” and choose “Use as cover” on a photo.</p>
        </fetcher.Form>
      </details>
    </li>
  );
}

export default function AdminAlbums({ loaderData }: Route.ComponentProps) {
  const { albums, usedMb, limitMb } = loaderData;
  const create = useFetcher<typeof action>();
  const creating = create.state !== "idle";
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem] items-start">
      <section aria-labelledby="albums-heading">
        <h2 id="albums-heading" className="sr-only">Albums</h2>
        <ul className="grid gap-4">
          {albums.map((album, i) => (
            <AlbumRow key={album.id} album={album} first={i === 0} last={i === albums.length - 1} />
          ))}
        </ul>
        {albums.length === 0 && <p className="paper-card p-6 text-center text-ink-soft">No albums yet. Create the first one.</p>}
      </section>

      <aside className="grid gap-6 lg:sticky lg:top-24">
        <section className="paper-card p-5" aria-labelledby="new-album">
          <h2 id="new-album" className="text-xl">New album</h2>
          <create.Form
            method="post"
            className="mt-3 grid gap-3"
            key={create.data?.ok && create.state === "idle" ? albums.length : "form"}
          >
            <input type="hidden" name="intent" value="create" />
            <AlbumFields />
            {create.data?.error && <p role="alert" className="text-sm text-danger">{create.data.error}</p>}
            <button className="btn btn-primary" disabled={creating}>{creating ? "Creating…" : "Create album"}</button>
          </create.Form>
        </section>
        <section className="paper-card p-5" aria-labelledby="storage">
          <h2 id="storage" className="text-xl">Storage</h2>
          <p className="mt-1 text-sm text-ink-soft">
            {usedMb.toFixed(1)} MB of {limitMb.toLocaleString()} MB used. Uploads stop at the limit so the free tier is never exceeded.
          </p>
          <div className="mt-3 h-2 rounded bg-paper-2" role="meter" aria-label="Storage used" aria-valuemin={0} aria-valuemax={limitMb} aria-valuenow={Math.round(usedMb)}>
            <div className="h-2 rounded bg-sage" style={{ width: `${Math.min(100, (usedMb / limitMb) * 100)}%` }} />
          </div>
        </section>
      </aside>
    </div>
  );
}
