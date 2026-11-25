/**
 * Owner authentication. The password and the cookie-signing secret are Worker
 * secrets (OWNER_PASSWORD, SESSION_SECRET); they never reach the browser.
 */
import { env } from "cloudflare:workers";
import { createCookieSessionStorage, redirect } from "react-router";
import { countRecentEvents, recordEvents } from "./db.server";

type SessionData = { owner: true };

let storage: ReturnType<typeof createCookieSessionStorage<SessionData>> | null = null;

function sessionStorage() {
  if (!storage) {
    if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) {
      throw new Error("SESSION_SECRET is missing or shorter than 32 characters. See README → Secrets.");
    }
    storage = createCookieSessionStorage<SessionData>({
      cookie: {
        name: "__archive_owner",
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: import.meta.env.PROD,
        maxAge: 60 * 60 * 24 * 14, // 14 days
        secrets: [env.SESSION_SECRET],
      },
    });
  }
  return storage;
}

export async function isOwner(request: Request): Promise<boolean> {
  if (!env.SESSION_SECRET) return false;
  const session = await sessionStorage().getSession(request.headers.get("Cookie"));
  return session.get("owner") === true;
}

/** Use at the top of every owner-only loader and action. */
export async function requireOwner(request: Request) {
  if (!(await isOwner(request))) {
    const url = new URL(request.url);
    throw redirect(`/admin/login?next=${encodeURIComponent(url.pathname)}`);
  }
}

/** Rejects cross-site form posts (defence in depth on top of the SameSite cookie). */
export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin) {
    throw new Response("Cross-site request blocked", { status: 403 });
  }
}

async function sha256(text: string) {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
}

/** Constant-time comparison of two equal-length digests. */
function equalDigests(a: ArrayBuffer, b: ArrayBuffer) {
  const x = new Uint8Array(a);
  const y = new Uint8Array(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

export async function clientKey(request: Request) {
  const ip = request.headers.get("CF-Connecting-IP") ?? "local";
  const digest = await sha256(`${env.SESSION_SECRET ?? ""}:${ip}`);
  return Array.from(new Uint8Array(digest).slice(0, 12), (b) => b.toString(16).padStart(2, "0")).join("");
}

export type LoginResult = { ok: true; setCookie: string } | { ok: false; error: string };

export async function login(request: Request, password: string): Promise<LoginResult> {
  if (!env.OWNER_PASSWORD) return { ok: false, error: "The owner password is not configured yet. See README → Secrets." };
  const bucket = `login:${await clientKey(request)}`;
  if ((await countRecentEvents(bucket, 15 * 60_000)) >= 10) {
    return { ok: false, error: "Too many attempts. Please wait 15 minutes and try again." };
  }
  const [given, expected] = await Promise.all([sha256(password), sha256(env.OWNER_PASSWORD)]);
  if (!equalDigests(given, expected)) {
    await recordEvents([bucket]);
    return { ok: false, error: "That password is not right." };
  }
  const s = sessionStorage();
  const session = await s.getSession();
  session.set("owner", true);
  return { ok: true, setCookie: await s.commitSession(session) };
}

export async function logout(request: Request) {
  const s = sessionStorage();
  const session = await s.getSession(request.headers.get("Cookie"));
  return s.destroySession(session);
}
