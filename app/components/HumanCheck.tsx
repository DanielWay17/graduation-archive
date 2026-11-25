import { useEffect, useRef, useState } from "react";

type Turnstile = {
  render(el: HTMLElement, options: Record<string, unknown>): string;
  reset(id?: string): void;
  remove(id: string): void;
};
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

// The widget script loads only when a visitor is about to upload, never on other pages.
let scriptPromise: Promise<void> | null = null;
function loadTurnstile() {
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      script.remove();
      reject(new Error("Turnstile failed to load"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

/** "Are you a person?" check (Cloudflare Turnstile). Calls onVerified once the server has issued an upload pass. */
export function HumanCheck({ siteKey, onVerified }: { siteKey: string; onVerified: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const done = useRef(onVerified);
  done.current = onVerified;
  const [status, setStatus] = useState<"loading" | "ready" | "checking" | "error">("loading");
  const [message, setMessage] = useState("");
  const [canRetry, setCanRetry] = useState(false);
  const widget = useRef<string | undefined>(undefined);
  // One server check per attempt. The widget may call back again on its own; those calls are ignored.
  const busy = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const fail = (text: string, retry = false) => {
      setStatus("error");
      setMessage(text);
      setCanRetry(retry);
    };
    loadTurnstile()
      .then(() => {
        if (cancelled || !box.current || !window.turnstile) return;
        setStatus("ready");
        widget.current = window.turnstile.render(box.current, {
          sitekey: siteKey,
          action: "upload",
          theme: "light",
          callback: async (token: string) => {
            if (busy.current) return;
            busy.current = true;
            setStatus("checking");
            const form = new FormData();
            form.set("token", token);
            const res = await fetch("/api/upload-pass", { method: "POST", body: form }).catch(() => null);
            if (cancelled) return;
            if (res?.ok) return done.current();
            // No automatic reset here: a widget that solves itself would retry in a loop.
            fail("We could not confirm the check.", true);
          },
          "error-callback": () => fail("The check could not run. Please reload the page and try again."),
          "expired-callback": () => window.turnstile?.reset(widget.current),
        });
      })
      .catch(() => fail("The check could not load. Please check your connection and reload the page."));
    return () => {
      cancelled = true;
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = undefined;
    };
  }, [siteKey]);

  return (
    <section className="paper-card p-4 sm:p-5" aria-labelledby="human-check-title">
      <h2 id="human-check-title" className="font-sans text-base font-semibold text-ink-strong">
        One quick check before uploading
      </h2>
      <p className="mt-1 text-sm text-ink-soft">
        To keep spam out of the archive, please confirm you are a person. One check covers the next 2 hours.
      </p>
      {/* Turnstile owns this box; React never renders children into it. */}
      <div ref={box} className="mt-3 min-h-[65px]" />
      {status === "loading" && <p className="text-sm text-ink-soft">Loading the check…</p>}
      <p className="text-sm" aria-live="polite">
        {status === "checking" ? "Checking…" : ""}
      </p>
      {status === "error" && (
        <div className="flex flex-wrap items-center gap-3">
          <p role="alert" className="text-sm text-danger">
            {message}
          </p>
          {canRetry && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setStatus("ready");
                setCanRetry(false);
                busy.current = false;
                window.turnstile?.reset(widget.current);
              }}
            >
              Try again
            </button>
          )}
        </div>
      )}
    </section>
  );
}
