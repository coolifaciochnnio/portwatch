import {
  recordEvent,
  isFlapping,
  getActivitySummary,
  resetActivity,
} from "./rateLimit";

beforeEach(() => {
  resetActivity();
});

describe("recordEvent / isFlapping", () => {
  it("returns false when no events recorded", () => {
    expect(isFlapping(3000)).toBe(false);
  });

  it("returns false when events are below threshold", () => {
    const now = Date.now();
    for (let i = 0; i < 4; i++) recordEvent(3000, now - i * 1000);
    expect(isFlapping(3000, { windowMs: 60_000, maxEvents: 5 }, now)).toBe(false);
  });

  it("returns true when events meet or exceed threshold", () => {
    const now = Date.now();
    for (let i = 0; i < 5; i++) recordEvent(3000, now - i * 1000);
    expect(isFlapping(3000, { windowMs: 60_000, maxEvents: 5 }, now)).toBe(true);
  });

  it("ignores events outside the time window", () => {
    const now = Date.now();
    // 5 old events well outside the 10-second window
    for (let i = 0; i < 5; i++) recordEvent(8080, now - 20_000 - i * 1000);
    expect(isFlapping(8080, { windowMs: 10_000, maxEvents: 5 }, now)).toBe(false);
  });

  it("prunes stale timestamps on isFlapping call", () => {
    const now = Date.now();
    for (let i = 0; i < 5; i++) recordEvent(9000, now - 120_000);
    isFlapping(9000, { windowMs: 60_000, maxEvents: 5 }, now);
    const summary = getActivitySummary(9000, { windowMs: 60_000 }, now);
    expect(summary.timestamps).toHaveLength(0);
  });
});

describe("getActivitySummary", () => {
  it("returns only recent timestamps", () => {
    const now = Date.now();
    recordEvent(4000, now - 5_000);
    recordEvent(4000, now - 90_000); // outside 60s window
    const summary = getActivitySummary(4000, { windowMs: 60_000 }, now);
    expect(summary.port).toBe(4000);
    expect(summary.timestamps).toHaveLength(1);
  });
});

describe("resetActivity", () => {
  it("clears a specific port", () => {
    const now = Date.now();
    for (let i = 0; i < 5; i++) recordEvent(5000, now);
    resetActivity(5000);
    expect(isFlapping(5000, {}, now)).toBe(false);
  });

  it("clears all ports when called without argument", () => {
    const now = Date.now();
    for (let i = 0; i < 5; i++) recordEvent(6000, now);
    for (let i = 0; i < 5; i++) recordEvent(7000, now);
    resetActivity();
    expect(isFlapping(6000, {}, now)).toBe(false);
    expect(isFlapping(7000, {}, now)).toBe(false);
  });
});
