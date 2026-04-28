import { exec } from 'child_process';
import { PortStatus } from './monitor';

export type AlertLevel = 'info' | 'warn' | 'critical';

export interface AlertConfig {
  onOpen?: boolean;
  onClose?: boolean;
  level?: AlertLevel;
  notifyCommand?: string;
}

export interface AlertEvent {
  port: number;
  event: 'opened' | 'closed';
  level: AlertLevel;
  timestamp: Date;
  message: string;
}

export function buildAlertMessage(port: number, event: 'opened' | 'closed'): string {
  const action = event === 'opened' ? 'opened' : 'closed';
  return `[portwatch] Port ${port} ${action} at ${new Date().toISOString()}`;
}

export function shouldAlert(event: 'opened' | 'closed', config: AlertConfig): boolean {
  if (event === 'opened' && config.onOpen === false) return false;
  if (event === 'closed' && config.onClose === false) return false;
  return true;
}

export function createAlertEvent(
  port: number,
  event: 'opened' | 'closed',
  level: AlertLevel = 'info'
): AlertEvent {
  return {
    port,
    event,
    level,
    timestamp: new Date(),
    message: buildAlertMessage(port, event),
  };
}

export function runNotifyCommand(command: string, message: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const interpolated = command.replace('{{message}}', message);
    exec(interpolated, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export async function dispatchAlerts(
  changes: { opened: number[]; closed: number[] },
  config: AlertConfig
): Promise<AlertEvent[]> {
  const events: AlertEvent[] = [];
  const level = config.level ?? 'info';

  for (const port of changes.opened) {
    if (shouldAlert('opened', config)) {
      const event = createAlertEvent(port, 'opened', level);
      events.push(event);
      if (config.notifyCommand) {
        await runNotifyCommand(config.notifyCommand, event.message).catch(() => {});
      }
    }
  }

  for (const port of changes.closed) {
    if (shouldAlert('closed', config)) {
      const event = createAlertEvent(port, 'closed', level);
      events.push(event);
      if (config.notifyCommand) {
        await runNotifyCommand(config.notifyCommand, event.message).catch(() => {});
      }
    }
  }

  return events;
}
