import { data, useFetcher } from "react-router";
import type { Route } from "./+types/settings";
import { assertSameOrigin, requireOwner } from "~/server/auth.server";
import { countRecentEvents } from "~/server/db.server";
import { getUploadLimits, saveUploadLimits } from "~/server/settings.server";
import { DEFAULT_LIMITS, LIMIT_BOUNDS, validateLimits } from "~/lib/upload-limits";

export async function loader({ request }: Route.LoaderArgs) {
  await requireOwner(request);
  const [limits, lastDay] = await Promise.all([getUploadLimits(), countRecentEvents("upload:all", 86_400_000)]);
  return { limits, lastDay };
}

export async function action({ request }: Route.ActionArgs) {
  await requireOwner(request);
  assertSameOrigin(request);
  const form = await request.formData();
  const result = validateLimits({ perHour: form.get("perHour"), perDay: form.get("perDay") });
  if (!result.ok) return data({ ok: false, error: result.error }, { status: 400 });
  await saveUploadLimits(result.limits);
  return { ok: true, error: "" };
}

const n = (value: number) => value.toLocaleString("en-US");

export default function AdminSettings({ loaderData }: Route.ComponentProps) {
  const { limits, lastDay } = loaderData;
  const fetcher = useFetcher<typeof action>();
  const busy = fetcher.state !== "idle";
  return (
    <section className="paper-card max-w-3xl p-5 sm:p-7" aria-labelledby="limits-title">
      <h2 id="limits-title" className="text-2xl">Upload limits for visitors</h2>
      <p className="mt-1 text-sm text-ink-soft">
        These limits slow down spam. They never apply to you while you are logged in.
      </p>

      <fetcher.Form method="post" className="mt-6 grid gap-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="perHour">Photos per hour, per visitor</label>
            <input
              id="perHour"
              name="perHour"
              type="number"
              inputMode="numeric"
              min={LIMIT_BOUNDS.perHour.min}
              max={LIMIT_BOUNDS.perHour.max}
              step={1}
              required
              className="field"
              defaultValue={limits.perHour}
              aria-describedby="perHour-hint"
            />
            <p id="perHour-hint" className="field-hint">
              Counted per internet connection, so people on the same Wi-Fi share it. Default {n(DEFAULT_LIMITS.perHour)}.
            </p>
          </div>
          <div>
            <label className="field-label" htmlFor="perDay">Photos per day, all visitors together</label>
            <input
              id="perDay"
              name="perDay"
              type="number"
              inputMode="numeric"
              min={LIMIT_BOUNDS.perDay.min}
              max={LIMIT_BOUNDS.perDay.max}
              step={1}
              required
              className="field"
              defaultValue={limits.perDay}
              aria-describedby="perDay-hint"
            />
            <p id="perDay-hint" className="field-hint">
              {n(lastDay)} uploaded by visitors in the last 24 hours. Default {n(DEFAULT_LIMITS.perDay)}.
            </p>
          </div>
        </div>

        {fetcher.data?.error && <p role="alert" className="text-sm text-danger">{fetcher.data.error}</p>}

        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
          <button className="btn btn-primary btn-sm" disabled={busy}>{busy ? "Saving…" : "Save limits"}</button>
          {fetcher.state === "idle" && fetcher.data?.ok && <span className="text-sm text-ink-soft" role="status">Saved. New uploads use these limits now.</span>}
        </div>
      </fetcher.Form>
    </section>
  );
}
