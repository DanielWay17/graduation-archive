import { data, Form, redirect, useNavigation } from "react-router";
import type { Route } from "./+types/login";
import { assertSameOrigin, isOwner, login } from "~/server/auth.server";
import { Seo } from "~/components/Seo";

function safeNext(value: FormDataEntryValue | string | null) {
  const next = String(value ?? "/admin");
  return next.startsWith("/") && !next.startsWith("//") ? next : "/admin";
}

export async function loader({ request }: Route.LoaderArgs) {
  if (await isOwner(request)) throw redirect("/admin");
  return { next: safeNext(new URL(request.url).searchParams.get("next")) };
}

export async function action({ request }: Route.ActionArgs) {
  assertSameOrigin(request);
  const form = await request.formData();
  const result = await login(request, String(form.get("password") ?? ""));
  if (!result.ok) return data({ error: result.error }, { status: 401 });
  return redirect(safeNext(form.get("next")), { headers: { "Set-Cookie": result.setCookie } });
}

export default function Login({ loaderData, actionData }: Route.ComponentProps) {
  const busy = useNavigation().state !== "idle";
  return (
    <div className="container-page py-16">
      <Seo title="Owner login" noindex />
      <div className="mx-auto max-w-sm paper-card px-6 pt-10 pb-8">
        <h1 className="text-3xl text-center">Owner’s desk</h1>
        <p className="mt-2 text-center text-sm text-ink-soft">For the owner of the archive only.</p>
        <Form method="post" className="mt-6 grid gap-4">
          <input type="hidden" name="next" value={loaderData.next} />
          <div>
            <label htmlFor="password" className="field-label">Password</label>
            <input id="password" name="password" type="password" required autoComplete="current-password" className="field" autoFocus aria-describedby={actionData?.error ? "login-error" : undefined} />
          </div>
          {actionData?.error && (
            <p id="login-error" role="alert" className="text-sm text-danger">{actionData.error}</p>
          )}
          <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Checking…" : "Log in"}</button>
        </Form>
      </div>
    </div>
  );
}
