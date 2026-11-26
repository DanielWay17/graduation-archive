/** Visitor upload limits: parsing, validation and fallbacks. No I/O, so it is unit-tested. */
export type UploadLimits = { perHour: number; perDay: number };

export const DEFAULT_LIMITS: UploadLimits = { perHour: 60, perDay: 1000 };
export const LIMIT_BOUNDS = {
  perHour: { min: 1, max: 1000 },
  perDay: { min: 1, max: 100_000 },
} as const;

/** Keys in the `settings` table. */
export const SETTING_KEYS = {
  perHour: "guest_uploads_per_hour",
  perDay: "guest_uploads_per_day",
} as const;

type Bounds = { min: number; max: number };

/** A whole number inside the bounds, or null. */
export function parseLimit(raw: unknown, bounds: Bounds): number | null {
  const text = String(raw ?? "").trim();
  if (!/^\d+$/.test(text)) return null;
  const n = Number(text);
  return n >= bounds.min && n <= bounds.max ? n : null;
}

/** First valid value wins: the owner's saved setting, then the wrangler.jsonc var, then the default. */
export function resolveLimits(saved: Record<string, string | undefined>, vars: Record<string, unknown>): UploadLimits {
  return {
    perHour:
      parseLimit(saved[SETTING_KEYS.perHour], LIMIT_BOUNDS.perHour) ??
      parseLimit(vars.GUEST_UPLOADS_PER_HOUR, LIMIT_BOUNDS.perHour) ??
      DEFAULT_LIMITS.perHour,
    perDay:
      parseLimit(saved[SETTING_KEYS.perDay], LIMIT_BOUNDS.perDay) ??
      parseLimit(vars.GUEST_UPLOADS_PER_DAY, LIMIT_BOUNDS.perDay) ??
      DEFAULT_LIMITS.perDay,
  };
}

/** Checks the owner's form input. */
export function validateLimits(input: { perHour: unknown; perDay: unknown }): { ok: true; limits: UploadLimits } | { ok: false; error: string } {
  const perHour = parseLimit(input.perHour, LIMIT_BOUNDS.perHour);
  if (perHour === null) return { ok: false, error: `Photos per hour must be a whole number from 1 to ${LIMIT_BOUNDS.perHour.max.toLocaleString("en-US")}.` };
  const perDay = parseLimit(input.perDay, LIMIT_BOUNDS.perDay);
  if (perDay === null) return { ok: false, error: `Photos per day must be a whole number from 1 to ${LIMIT_BOUNDS.perDay.max.toLocaleString("en-US")}.` };
  if (perDay < perHour) return { ok: false, error: "Photos per day must be at least as many as photos per hour." };
  return { ok: true, limits: { perHour, perDay } };
}
