/**
 * POST /api/upload-pass  (form field: token) → checks a Turnstile token and sets the upload-pass cookie.
 */
import type { Route } from "./+types/api.upload-pass";
import { assertSameOrigin } from "~/server/auth.server";
import { issueUploadPass } from "~/server/human-check.server";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  assertSameOrigin(request);
  const form = await request.formData().catch(() => null);
  const setCookie = await issueUploadPass(request, String(form?.get("token") ?? ""));
  if (!setCookie) return Response.json({ ok: false }, { status: 403 });
  return Response.json({ ok: true }, { headers: { "Set-Cookie": setCookie } });
}
