import * as fs from 'fs';
import * as path from 'path';

export interface PortEvent {
  timestamp: string;
  port: number;
  status: 'opened' | 'closed';
  pid?: number;
}

export interface HistoryStore {
  events: PortEvent[];
}

const DEFAULT_HISTORY_FILE = '.portwatch_history.json';

export function loadHistory(filePath: string = DEFAULT_HISTORY_FILE): HistoryStore {
  try {
    if (!fs.existsSync(filePath)) {
      return { events: [] };
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.events)) {
      return { events: [] };
    }
    return parsed as HistoryStore;
  } catch {
    return { events: [] };
  }
}

export function appendEvent(
  event: PortEvent,
  filePath: string = DEFAULT_HISTORY_FILE
): void {
  const store = loadHistory(filePath);
  store.events.push(event);
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf-8');
}

export function getEventsForPort(
  port: number,
  filePath: string = DEFAULT_HISTORY_FILE
): PortEvent[] {
  const store = loadHistory(filePath);
  return store.events.filter((e) => e.port === port);
}

export function clearHistory(filePath: string = DEFAULT_HISTORY_FILE): void {
  fs.writeFileSync(filePath, JSON.stringify({ events: [] }, null, 2), 'utf-8');
}

export function summarizeHistory(
  filePath: string = DEFAULT_HISTORY_FILE
): Record<number, { opened: number; closed: number }> {
  const store = loadHistory(filePath);
  const summary: Record<number, { opened: number; closed: number }> = {};
  for (const event of store.events) {
    if (!summary[event.port]) {
      summary[event.port] = { opened: 0, closed: 0 };
    }
    summary[event.port][event.status]++;
  }
  return summary;
}
