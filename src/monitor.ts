import { getOpenPorts } from './scanner';
import { PortConfig } from './config';
import { appendEvent } from './history';
import { shouldAlert, createAlertEvent, runNotifyCommand } from './alerts';

export interface PortEvent {
  port: number;
  status: 'open' | 'closed';
  timestamp: string;
}

export type PortStatusMap = Record<number, 'open' | 'closed'>;

export function diffStatuses(
  previous: PortStatusMap,
  current: PortStatusMap
): PortEvent[] {
  const events: PortEvent[] = [];
  const allPorts = new Set([...Object.keys(previous), ...Object.keys(current)].map(Number));

  for (const port of allPorts) {
    const prev = previous[port];
    const curr = current[port];
    if (prev !== curr && curr !== undefined) {
      events.push({ port, status: curr, timestamp: new Date().toISOString() });
    }
  }

  return events;
}

export async function startMonitor(
  config: PortConfig,
  onEvent: (event: PortEvent) => void
): Promise<void> {
  const { ports, interval = 5000, alerts } = config;
  let previousStatus: PortStatusMap = {};

  const tick = async () => {
    const openPorts = await getOpenPorts(ports);
    const currentStatus: PortStatusMap = {};

    for (const port of ports) {
      currentStatus[port] = openPorts.includes(port) ? 'open' : 'closed';
    }

    const events = diffStatuses(previousStatus, currentStatus);

    for (const event of events) {
      appendEvent(event);
      onEvent(event);

      if (alerts && shouldAlert(event, alerts)) {
        const alertEvent = createAlertEvent(event, alerts);
        if (alertEvent && alerts.notifyCommand) {
          await runNotifyCommand(alerts.notifyCommand, alertEvent);
        }
      }
    }

    previousStatus = currentStatus;
  };

  await tick();
  setInterval(tick, interval);
}
