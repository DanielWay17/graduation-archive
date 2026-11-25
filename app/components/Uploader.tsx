import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router";
import type { Album } from "~/lib/types";
import { processImage } from "~/lib/image-processing.client";
import { validateFile } from "~/lib/image-rules";
import { sendPhoto } from "~/lib/upload-client";
import { HumanCheck } from "./HumanCheck";
import { UploadDropzone } from "./UploadDropzone";
import { CheckIcon, CloseIcon } from "./Icons";

type Status = "ready" | "processing" | "uploading" | "done" | "error";

type Item = {
  key: string;
  file: File;
  previewUrl: string;
  caption: string;
  altText: string;
  photoDate: string;
  status: Status;
  progress: number;
  error: string;
  /** False when trying again cannot help (unreadable file, duplicate, invalid). */
  retryable: boolean;
};

const MAX_PER_BATCH = 60;
const NAME_KEY = "graduation-archive:uploader-name";

export function Uploader({
  albums,
  mode,
  defaultAlbumId,
  humanCheck,
}: {
  albums: Album[];
  mode: "guest" | "owner";
  defaultAlbumId?: string;
  /** Set when the spam check is on and this visitor is not the owner. */
  humanCheck?: { siteKey: string; verified: boolean } | null;
}) {
  const [verified, setVerified] = useState(humanCheck?.verified ?? true);
  const needsCheck = Boolean(humanCheck) && !verified;
  const [items, setItems] = useState<Item[]>([]);
  const [albumId, setAlbumId] = useState(defaultAlbumId ?? albums[0]?.id ?? "");
  const [uploaderName, setUploaderName] = useState("");
  const [publish, setPublish] = useState(true);
  const [running, setRunning] = useState(false);
  const [notice, setNotice] = useState("");
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const ids = useId();

  useEffect(() => {
    if (mode === "guest") setUploaderName(localStorage.getItem(NAME_KEY) ?? "");
  }, [mode]);

  // Release preview memory when leaving the page.
  useEffect(() => () => itemsRef.current.forEach((i) => URL.revokeObjectURL(i.previewUrl)), []);

  const update = (key: string, patch: Partial<Item>) =>
    setItems((list) => list.map((i) => (i.key === key ? { ...i, ...patch } : i)));

  const addFiles = (files: File[]) => {
    setNotice("");
    const room = MAX_PER_BATCH - items.filter((i) => i.status !== "done").length;
    if (files.length > room) setNotice(`You can add up to ${MAX_PER_BATCH} photos at a time. The first ${Math.max(room, 0)} were added.`);
    const added = files.slice(0, Math.max(room, 0)).map<Item>((file) => {
      const error = validateFile(file);
      return {
        key: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        previewUrl: error ? "" : URL.createObjectURL(file),
        caption: "",
        altText: "",
        photoDate: "",
        status: error ? "error" : "ready",
        progress: 0,
        error: error ?? "",
        retryable: !error,
      };
    });
    setItems((list) => [...list, ...added]);
  };

  const removeItem = (key: string) =>
    setItems((list) => {
      const item = list.find((i) => i.key === key);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return list.filter((i) => i.key !== key);
    });

  async function uploadOne(item: Item) {
    update(item.key, { status: "processing", error: "", progress: 0 });
    try {
      const processed = await processImage(item.file);
      update(item.key, { status: "uploading" });
      const form = new FormData();
      form.set("full", processed.full, "full");
      form.set("thumb", processed.thumb, "thumb");
      form.set("albumId", albumId);
      form.set("caption", item.caption);
      form.set("altText", item.altText);
      form.set("photoDate", item.photoDate);
      form.set("contentHash", processed.contentHash);
      form.set("uploaderName", mode === "guest" ? uploaderName : "");
      form.set("published", publish ? "1" : "0");
      const result = await sendPhoto(form, (p) => update(item.key, { progress: p }));
      if (result.ok) update(item.key, { status: "done", progress: 1 });
      else update(item.key, { status: "error", error: result.error, retryable: !result.code || ["rate_limited", "storage_full", "verification_required"].includes(result.code) });
      return result.ok ? null : result;
    } catch (error) {
      // Processing errors (e.g. a format this browser cannot open) will fail again on retry.
      update(item.key, { status: "error", error: error instanceof Error ? error.message : "Something went wrong.", retryable: false });
      return null;
    }
  }

  async function start() {
    if (!albumId) return setNotice("Please choose an album first.");
    if (mode === "guest") localStorage.setItem(NAME_KEY, uploaderName.trim());
    setRunning(true);
    setNotice("");
    const queue = itemsRef.current.filter((i) => i.status === "ready" || (i.status === "error" && i.retryable));
    let stop = false;
    // Two at a time: fast enough, gentle on phone memory.
    const worker = async () => {
      while (queue.length && !stop) {
        const next = queue.shift()!;
        const latest = itemsRef.current.find((i) => i.key === next.key);
        if (!latest) continue;
        const failure = await uploadOne(latest);
        if (failure && !failure.ok && (failure.code === "rate_limited" || failure.code === "storage_full")) {
          stop = true;
          setNotice(failure.error);
        }
        if (failure && !failure.ok && failure.code === "verification_required") {
          // The 2-hour pass ran out mid-batch: show the check again; the rest stay ready.
          stop = true;
          setVerified(false);
          setNotice(failure.error);
        }
      }
    };
    await Promise.all([worker(), worker()]);
    setRunning(false);
  }

  const pending = items.filter((i) => i.status === "ready" || (i.status === "error" && i.retryable)).length;
  const done = items.filter((i) => i.status === "done").length;
  const failed = items.filter((i) => i.status === "error").length;
  const album = albums.find((a) => a.id === albumId);

  if (albums.length === 0) {
    return <p className="paper-card p-6 text-center">There are no albums yet. {mode === "owner" ? "Create one first." : "Please check back soon."}</p>;
  }

  return (
    <div className="grid gap-8">
      {/* Shared settings */}
      <div className="paper-card p-5 sm:p-6 grid gap-5 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor={`${ids}-album`}>Album</label>
          <select id={`${ids}-album`} className="field" value={albumId} onChange={(e) => setAlbumId(e.target.value)} disabled={running}>
            {albums.map((a) => (
              <option key={a.id} value={a.id}>{a.title}</option>
            ))}
          </select>
        </div>
        {mode === "guest" ? (
          <div>
            <label className="field-label" htmlFor={`${ids}-name`}>Your name <span className="text-ink-soft font-normal">(optional)</span></label>
            <input id={`${ids}-name`} className="field" maxLength={60} value={uploaderName} onChange={(e) => setUploaderName(e.target.value)} placeholder="e.g. Minh Anh" disabled={running} autoComplete="name" />
            <p className="field-hint">Shown as “shared by …” under your photos.</p>
          </div>
        ) : (
          <fieldset>
            <legend className="field-label">When uploaded</legend>
            <div className="flex flex-wrap gap-2">
              {[
                { value: true, label: "Publish now" },
                { value: false, label: "Save as draft" },
              ].map((o) => (
                <label key={o.label} className={`btn btn-sm cursor-pointer ${publish === o.value ? "btn-primary" : "btn-secondary"}`}>
                  <input type="radio" className="sr-only" name={`${ids}-publish`} checked={publish === o.value} onChange={() => setPublish(o.value)} disabled={running} />
                  {o.label}
                </label>
              ))}
            </div>
            <p className="field-hint">Drafts are visible only to you.</p>
          </fieldset>
        )}
      </div>

      <UploadDropzone onFiles={addFiles} disabled={running} />

      {notice && <p role="alert" className="rounded-lg bg-rose/30 px-4 py-3 text-ink-strong">{notice}</p>}

      {items.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Photos to upload">
          {items.map((item) => (
            <li key={item.key} className="paper-card overflow-hidden flex flex-col">
              <div className="relative aspect-[4/3] bg-paper-2">
                {item.previewUrl ? (
                  <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full grid place-items-center text-sm text-ink-soft px-4 text-center">{item.file.name}</div>
                )}
                {item.status !== "done" && !running && (
                  <button type="button" onClick={() => removeItem(item.key)} className="icon-btn absolute right-2 top-2 bg-card/90" aria-label={`Remove ${item.file.name}`}>
                    <CloseIcon size={18} />
                  </button>
                )}
                {(item.status === "processing" || item.status === "uploading") && (
                  <div className="absolute inset-x-0 bottom-0 bg-ink/70 px-3 py-2 text-xs text-white">
                    {item.status === "processing" ? "Preparing photo…" : `Uploading ${Math.round(item.progress * 100)}%`}
                    <div className="mt-1 h-1 rounded bg-white/30" role="progressbar" aria-label={`Upload progress for ${item.file.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(item.progress * 100)}>
                      <div className="h-1 origin-left rounded bg-white transition-transform duration-150 ease-linear" style={{ transform: `scaleX(${item.progress})` }} />
                    </div>
                  </div>
                )}
                {item.status === "done" && (
                  <div className="upload-done absolute inset-0 grid place-items-center bg-sage/45 text-ink-strong">
                    <span className="upload-done-badge inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-sm font-medium"><CheckIcon size={16} /> Uploaded</span>
                  </div>
                )}
              </div>
              <div className="p-4 grid gap-3">
                {item.status === "error" && <p role="alert" className="text-sm text-danger">{item.error}</p>}
                <div>
                  <label className="field-label" htmlFor={`${item.key}-caption`}>Caption</label>
                  <input id={`${item.key}-caption`} className="field" maxLength={300} value={item.caption} onChange={(e) => update(item.key, { caption: e.target.value })} disabled={running || item.status === "done"} placeholder="What happened here?" />
                </div>
                <div>
                  <label className="field-label" htmlFor={`${item.key}-alt`}>Description for screen readers</label>
                  <input id={`${item.key}-alt`} className="field" maxLength={300} value={item.altText} onChange={(e) => update(item.key, { altText: e.target.value })} disabled={running || item.status === "done"} placeholder="e.g. Five friends in gowns throwing caps" />
                </div>
                <div>
                  <label className="field-label" htmlFor={`${item.key}-date`}>Date <span className="text-ink-soft font-normal">(optional)</span></label>
                  <input id={`${item.key}-date`} type="date" className="field" value={item.photoDate} onChange={(e) => update(item.key, { photoDate: e.target.value })} disabled={running || item.status === "done"} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 && needsCheck && humanCheck && (
        <HumanCheck
          siteKey={humanCheck.siteKey}
          onVerified={() => {
            setVerified(true);
            setNotice("");
          }}
        />
      )}

      {items.length > 0 && (
        <div className="sticky bottom-3 z-10 paper-card flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <p className="text-sm" aria-live="polite">
            {running ? "Uploading… please keep this page open." : `${pending} ready`}
            {done > 0 && ` · ${done} uploaded`}
            {failed > 0 && ` · ${failed} need attention`}
          </p>
          <div className="flex flex-wrap gap-2">
            {done > 0 && !running && album && (
              <Link to={mode === "owner" ? `/admin/albums/${album.id}` : `/albums/${album.slug}`} className="btn btn-secondary btn-sm">
                See album
              </Link>
            )}
            <button type="button" className="btn btn-primary" disabled={running || pending === 0 || needsCheck} onClick={start}>
              {running ? "Uploading…" : `Upload ${pending} ${pending === 1 ? "photo" : "photos"}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
