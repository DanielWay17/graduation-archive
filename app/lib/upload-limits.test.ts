import { describe, expect, it } from "vitest";
import { DEFAULT_LIMITS, LIMIT_BOUNDS, SETTING_KEYS, parseLimit, resolveLimits, validateLimits } from "./upload-limits";

describe("parseLimit", () => {
  it("accepts whole numbers inside the bounds", () => {
    expect(parseLimit("60", LIMIT_BOUNDS.perHour)).toBe(60);
    expect(parseLimit(" 1000 ", LIMIT_BOUNDS.perHour)).toBe(1000);
  });
  it("rejects zero, negatives, decimals, text and values over the maximum", () => {
    for (const bad of ["0", "-5", "2.5", "abc", "", "1001", undefined, null]) {
      expect(parseLimit(bad, LIMIT_BOUNDS.perHour)).toBeNull();
    }
  });
});

describe("resolveLimits", () => {
  it("prefers the saved setting", () => {
    const saved = { [SETTING_KEYS.perHour]: "200", [SETTING_KEYS.perDay]: "5000" };
    expect(resolveLimits(saved, { GUEST_UPLOADS_PER_HOUR: "60", GUEST_UPLOADS_PER_DAY: "1000" })).toEqual({ perHour: 200, perDay: 5000 });
  });
  it("falls back to the wrangler var, then the default", () => {
    expect(resolveLimits({}, { GUEST_UPLOADS_PER_HOUR: "30" })).toEqual({ perHour: 30, perDay: DEFAULT_LIMITS.perDay });
    expect(resolveLimits({ [SETTING_KEYS.perHour]: "broken" }, {})).toEqual(DEFAULT_LIMITS);
  });
});

describe("validateLimits", () => {
  it("accepts valid input", () => {
    expect(validateLimits({ perHour: "200", perDay: "2000" })).toEqual({ ok: true, limits: { perHour: 200, perDay: 2000 } });
  });
  it("explains what is wrong", () => {
    expect(validateLimits({ perHour: "0", perDay: "100" })).toMatchObject({ ok: false, error: expect.stringContaining("per hour") });
    expect(validateLimits({ perHour: "10", perDay: "x" })).toMatchObject({ ok: false, error: expect.stringContaining("per day") });
    expect(validateLimits({ perHour: "500", perDay: "100" })).toMatchObject({ ok: false, error: expect.stringContaining("at least") });
  });
});
