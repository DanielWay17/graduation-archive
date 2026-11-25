import { useId, useRef, useState } from "react";
import { ACCEPT_ATTR } from "~/lib/image-rules";
import { UploadIcon } from "./Icons";

/** Drag-and-drop area on desktop; on phones the same control opens the native photo picker. */
export function UploadDropzone({ onFiles, disabled }: { onFiles: (files: File[]) => void; disabled?: boolean }) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        if (disabled) return;
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!disabled && e.dataTransfer.files.length) onFiles(Array.from(e.dataTransfer.files));
      }}
      className={`relative rounded-xl border-2 border-dashed px-5 py-10 text-center transition-colors ${
        dragging ? "border-gold bg-card" : "border-ink-soft/40 bg-paper-2/60"
      } ${disabled ? "opacity-60" : ""}`}
    >
      <UploadIcon size={34} className="mx-auto text-gold" />
      <p className="mt-3 text-lg font-medium text-ink-strong">
        <span className="hidden sm:inline">Drop photos here, or </span>
        <label htmlFor={inputId} className="inline-flex min-h-[44px] items-center cursor-pointer text-ink-strong underline decoration-rose decoration-2 underline-offset-4 hover:decoration-gold">
          <span className="sm:hidden">Choose photos</span>
          <span className="hidden sm:inline">choose from your device</span>
        </label>
      </p>
      <p className="mt-1 text-sm text-ink-soft">JPEG, PNG, WebP, AVIF or HEIC · up to 40 MB each · many at once</p>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPT_ATTR}
        multiple
        disabled={disabled}
        className="sr-only"
        onChange={(e) => {
          if (e.target.files?.length) onFiles(Array.from(e.target.files));
          e.target.value = "";
        }}
      />
    </div>
  );
}
