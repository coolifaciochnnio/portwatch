import { createScheduler } from './scheduler';
import { getOpenPorts } from './scanner';
import { loadSnapshot, saveSnapshot, diffSnapshots } from './snapshot';
import { appendEvent } from './history';
import { shouldThrottle } from './notifier';
import { isFlapping, recordEvent } from './rateLimit';
import { printEvent } from './logger';
import type { PortEvent } from './types';

export interface WatchdogOptions {
  ports: number[];
  intervalMs: number;
  snapshotPath: string;
  onAlert?: (event: PortEvent) => void;
  maxFlaps?: number;
}

export function createWatchdog(opts: WatchdogOptions) {
  const { ports, intervalMs, snapshotPath, onAlert, maxFlaps = 5 } = opts;

  async function tick() {
    const open = await getOpenPorts(ports);
    const prev = loadSnapshot(snapshotPath);
    const diff = prev ? diffSnapshots(prev.ports, open) : { opened: open, closed: [] };

    saveSnapshot(snapshotPath, { ports: open, timestamp: Date.now() });

    const events: PortEvent[] = [
      ...diff.opened.map((port) => ({ port, status: 'open' as const, timestamp: Date.now() })),
      ...diff.closed.map((port) => ({ port, status: 'closed' as const, timestamp: Date.now() })),
    ];

    for (const event of events) {
      recordEvent(event.port);
      if (isFlapping(event.port, maxFlaps)) {
        continue;
      }
      if (shouldThrottle(event.port)) {
        continue;
      }
      appendEvent(event);
      printEvent(event);
      onAlert?.(event);
    }
  }

  const scheduler = createScheduler(tick, intervalMs);

  return {
    start: () => scheduler.start(),
    stop: () => scheduler.stop(),
    tick,
  };
}
