/** Owner-editable settings, stored in D1 with fallbacks from wrangler.jsonc. */
import { env } from "cloudflare:workers";
import { getSettings, saveSettings } from "./db.server";
import { SETTING_KEYS, resolveLimits, type UploadLimits } from "~/lib/upload-limits";

export async function getUploadLimits(): Promise<UploadLimits> {
  const saved = await getSettings(Object.values(SETTING_KEYS));
  return resolveLimits(saved, env as unknown as Record<string, unknown>);
}

export async function saveUploadLimits(limits: UploadLimits) {
  await saveSettings({
    [SETTING_KEYS.perHour]: String(limits.perHour),
    [SETTING_KEYS.perDay]: String(limits.perDay),
  });
}
