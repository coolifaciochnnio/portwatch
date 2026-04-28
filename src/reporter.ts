import { PortEvent } from './monitor';
import { summarizeHistory } from './history';
import { colorize } from './logger';

export interface ReportOptions {
  since?: Date;
  port?: number;
  format?: 'text' | 'json';
}

export interface ReportSummary {
  totalEvents: number;
  openCount: number;
  closeCount: number;
  mostActivePort: number | null;
  generatedAt: string;
}

export function buildReport(events: PortEvent[], options: ReportOptions = {}): ReportSummary {
  let filtered = [...events];

  if (options.since) {
    filtered = filtered.filter(e => new Date(e.timestamp) >= options.since!);
  }

  if (options.port !== undefined) {
    filtered = filtered.filter(e => e.port === options.port);
  }

  const openCount = filtered.filter(e => e.status === 'open').length;
  const closeCount = filtered.filter(e => e.status === 'closed').length;

  const portFrequency: Record<number, number> = {};
  for (const event of filtered) {
    portFrequency[event.port] = (portFrequency[event.port] ?? 0) + 1;
  }

  const mostActivePort = Object.keys(portFrequency).length > 0
    ? Number(Object.entries(portFrequency).sort((a, b) => b[1] - a[1])[0][0])
    : null;

  return {
    totalEvents: filtered.length,
    openCount,
    closeCount,
    mostActivePort,
    generatedAt: new Date().toISOString(),
  };
}

export function formatReport(summary: ReportSummary, format: 'text' | 'json' = 'text'): string {
  if (format === 'json') {
    return JSON.stringify(summary, null, 2);
  }

  const lines = [
    colorize('bold', '=== PortWatch Report ==='),
    `Generated: ${summary.generatedAt}`,
    `Total Events:  ${summary.totalEvents}`,
    `Ports Opened:  ${colorize('green', String(summary.openCount))}`,
    `Ports Closed:  ${colorize('red', String(summary.closeCount))}`,
    `Most Active:   ${summary.mostActivePort !== null ? colorize('yellow', String(summary.mostActivePort)) : 'N/A'}`,
  ];

  return lines.join('\n');
}

export function printReport(events: PortEvent[], options: ReportOptions = {}): void {
  const summary = buildReport(events, options);
  const output = formatReport(summary, options.format ?? 'text');
  console.log(output);
}
