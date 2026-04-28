import { scanPorts, PortStatus } from './scanner';
import { loadConfig } from './config';

export type ChangeType = 'opened' | 'closed';

export interface PortChange {
  port: number;
  change: ChangeType;
  detectedAt: Date;
}

export type ChangeHandler = (changes: PortChange[]) => void;

export interface MonitorHandle {
  stop: () => void;
}

function diffStatuses(prev: PortStatus[], curr: PortStatus[]): PortChange[] {
  const changes: PortChange[] = [];
  const now = new Date();

  for (const c of curr) {
    const p = prev.find((s) => s.port === c.port);
    if (!p) continue;
    if (!p.open && c.open) changes.push({ port: c.port, change: 'opened', detectedAt: now });
    if (p.open && !c.open) changes.push({ port: c.port, change: 'closed', detectedAt: now });
  }

  return changes;
}

/**
 * Starts monitoring the configured ports for open/close changes.
 *
 * @param onChanges - Callback invoked whenever port state changes are detected.
 * @param configPath - Optional path to a config file; defaults to the standard config location.
 * @returns A handle with a `stop()` method to cancel monitoring.
 */
export function startMonitor(
  onChanges: ChangeHandler,
  configPath?: string
): MonitorHandle {
  const config = loadConfig(configPath);
  const { ports, host, intervalMs, timeoutMs } = config;

  let previous: PortStatus[] = [];
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const tick = async () => {
    if (stopped) return;

    try {
      const current = await scanPorts(ports, host, timeoutMs);

      if (previous.length > 0) {
        const changes = diffStatuses(previous, current);
        if (changes.length > 0) onChanges(changes);
      }

      previous = current;
    } catch (err) {
      // Log scan errors but keep the monitor running
      console.error('[portwatch] Scan error:', err);
    }

    if (!stopped) timer = setTimeout(tick, intervalMs);
  };

  timer = setTimeout(tick, 0);

  return {
    stop: () => {
      stopped = true;
      if (timer !== undefined) clearTimeout(timer);
    },
  };
}
