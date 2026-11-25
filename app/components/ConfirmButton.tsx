import { useRef } from "react";
import { useFetcher } from "react-router";

/**
 * A button that opens a confirmation dialog before submitting a destructive action.
 * Uses the native <dialog> element: focus is trapped and Escape cancels.
 */
export function ConfirmButton({
  title,
  message,
  confirmLabel,
  fields,
  action,
  children,
  className = "btn btn-ghost btn-sm text-danger",
}: {
  title: string;
  message: string;
  confirmLabel: string;
  fields: Record<string, string>;
  action?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fetcher = useFetcher();
  const busy = fetcher.state !== "idle";
  return (
    <>
      <button type="button" className={className} onClick={() => dialogRef.current?.showModal()} disabled={busy}>
        {busy ? "Working…" : children}
      </button>
      <dialog
        ref={dialogRef}
        className="confirm-dialog m-auto w-[min(26rem,calc(100vw-2rem))] rounded-xl border border-line bg-card p-0 text-ink shadow-[var(--shadow-lift)] backdrop:bg-ink/40"
        aria-labelledby={`${fields.id}-confirm-title`}
      >
        <fetcher.Form method="post" action={action} onSubmit={() => dialogRef.current?.close()} className="p-6">
          {Object.entries(fields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          <h2 id={`${fields.id}-confirm-title`} className="text-xl">{title}</h2>
          <p className="mt-2 text-sm text-ink-soft">{message}</p>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => dialogRef.current?.close()} autoFocus>
              Cancel
            </button>
            <button type="submit" className="btn btn-danger btn-sm">{confirmLabel}</button>
          </div>
        </fetcher.Form>
      </dialog>
    </>
  );
}
