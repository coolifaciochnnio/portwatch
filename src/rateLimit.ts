/**
 * rateLimit.ts
 * Tracks how frequently ports change state and flags ports that are
 * flapping (opening/closing repeatedly) within a sliding time window.
 */

export interface RateLimitConfig {
  windowMs: number;   // sliding window in milliseconds
  maxEvents: number;  // max state changes allowed within the window
}

export interface PortActivity {
  port: number;
  timestamps: number[];
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60_000,
  maxEvents: 5,
};

// In-memory store: port -> list of event timestamps
const activityMap = new Map<number, number[]>();

export function recordEvent(port: number, now = Date.now()): void {
  const timestamps = activityMap.get(port) ?? [];
  timestamps.push(now);
  activityMap.set(port, timestamps);
}

export function isFlapping(
  port: number,
  config: Partial<RateLimitConfig> = {},
  now = Date.now()
): boolean {
  const { windowMs, maxEvents } = { ...DEFAULT_CONFIG, ...config };
  const timestamps = activityMap.get(port) ?? [];
  const recent = timestamps.filter((t) => now - t <= windowMs);
  // prune stale entries in place
  activityMap.set(port, recent);
  return recent.length >= maxEvents;
}

export function getActivitySummary(
  port: number,
  config: Partial<RateLimitConfig> = {},
  now = Date.now()
): PortActivity {
  const { windowMs } = { ...DEFAULT_CONFIG, ...config };
  const timestamps = activityMap.get(port) ?? [];
  const recent = timestamps.filter((t) => now - t <= windowMs);
  return { port, timestamps: recent };
}

export function resetActivity(port?: number): void {
  if (port !== undefined) {
    activityMap.delete(port);
  } else {
    activityMap.clear();
  }
}
