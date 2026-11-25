/**
 * Optional spam protection for visitor uploads, using Cloudflare Turnstile (free).
 *
 * Off unless both TURNSTILE_SITE_KEY (var) and TURNSTILE_SECRET_KEY (secret) are set.
 * When on, a visitor passes the check once; the server then gives them a signed
 * "upload pass" cookie that is valid for 2 hours, so a batch of 60 photos needs
 * only one check. The owner never sees the check.
 */
import { env } from "cloudflare:workers";
import { createCookie } from "react-router";

const PASS_HOURS = 2;
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** The public site key when the check is on, otherwise null. */
export function humanCheckSiteKey(): string | null {
  const ready = env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY && env.SESSION_SECRET;
  return ready ? env.TURNSTILE_SITE_KEY : null;
}

let cookie: ReturnType<typeof createCookie> | null = null;
function passCookie() {
  cookie ??= createCookie("__archive_upload_pass", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: import.meta.env.PROD,
    maxAge: PASS_HOURS * 3600,
    secrets: [env.SESSION_SECRET],
  });
  return cookie;
}

/** True when the check is off, or the request carries a valid, unexpired upload pass. */
export async function hasUploadPass(request: Request): Promise<boolean> {
  if (!humanCheckSiteKey()) return true;
  const value = (await passCookie().parse(request.headers.get("Cookie"))) as { until?: number } | null;
  return typeof value?.until === "number" && value.until > Date.now();
}

/** Checks a Turnstile token with Cloudflare. On success returns the Set-Cookie header for the pass. */
export async function issueUploadPass(request: Request, token: string): Promise<string | null> {
  if (!humanCheckSiteKey() || !token || token.length > 2048) return null;
  const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token });
  const ip = request.headers.get("CF-Connecting-IP");
  if (ip) body.set("remoteip", ip);
  try {
    const res = await fetch(VERIFY_URL, { method: "POST", body });
    const data = (await res.json()) as { success?: boolean };
    if (!data.success) return null;
  } catch {
    return null;
  }
  return passCookie().serialize({ until: Date.now() + PASS_HOURS * 3_600_000 });
}
