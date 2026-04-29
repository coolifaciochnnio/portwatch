import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  shouldThrottle,
  notifyConsole,
  dispatchNotification,
  resetThrottleState,
  NotifierConfig,
} from "./notifier";
import { AlertEvent } from "./alerts";

const makeEvent = (port = 3000, type: "opened" | "closed" = "opened"): AlertEvent => ({
  port,
  type,
  message: `Port ${port} ${type}`,
  timestamp: Date.now(),
});

beforeEach(() => {
  resetThrottleState();
});

describe("shouldThrottle", () => {
  it("returns false on first call", () => {
    expect(shouldThrottle("3000:opened", 1000)).toBe(false);
  });

  it("returns true within throttle window", () => {
    shouldThrottle("3000:opened", 5000);
    expect(shouldThrottle("3000:opened", 5000)).toBe(true);
  });

  it("allows different keys independently", () => {
    shouldThrottle("3000:opened", 5000);
    expect(shouldThrottle("3001:opened", 5000)).toBe(false);
  });
});

describe("notifyConsole", () => {
  it("logs to console without throwing", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await notifyConsole(makeEvent());
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });
});

describe("dispatchNotification", () => {
  it("dispatches to console channel", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const config: NotifierConfig = { channels: ["console"] };
    await dispatchNotification(makeEvent(), config);
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });

  it("skips notification when throttled", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const config: NotifierConfig = { channels: ["console"], throttleMs: 5000 };
    await dispatchNotification(makeEvent(), config);
    await dispatchNotification(makeEvent(), config);
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });

  it("dispatches to multiple channels", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const config: NotifierConfig = { channels: ["console", "console"] };
    await dispatchNotification(makeEvent(), config);
    expect(spy).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });
});
