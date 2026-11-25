import type { UploadResult } from "./types";

/** Sends one prepared photo to /api/photos and reports upload progress (0–1). */
export function sendPhoto(form: FormData, onProgress: (fraction: number) => void): Promise<UploadResult> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/photos");
    xhr.responseType = "json";
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      const body = xhr.response as UploadResult | null;
      resolve(body ?? { ok: false, error: `Upload failed (HTTP ${xhr.status}).` });
    };
    xhr.onerror = () => resolve({ ok: false, error: "Network error. Check your connection and try again." });
    xhr.send(form);
  });
}
