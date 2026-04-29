import * as fs from 'fs';
import * as path from 'path';
import { PortEvent } from './history';

export type ExportFormat = 'json' | 'csv';

export interface ExportOptions {
  format: ExportFormat;
  outputPath: string;
  pretty?: boolean;
}

export function eventsToCSV(events: PortEvent[]): string {
  const header = 'timestamp,port,status,message';
  const rows = events.map((e) => {
    const ts = new Date(e.timestamp).toISOString();
    const msg = (e.message ?? '').replace(/,/g, ';');
    return `${ts},${e.port},${e.status},${msg}`;
  });
  return [header, ...rows].join('\n');
}

export function eventsToJSON(events: PortEvent[], pretty = false): string {
  return pretty
    ? JSON.stringify(events, null, 2)
    : JSON.stringify(events);
}

export function exportEvents(events: PortEvent[], options: ExportOptions): void {
  const { format, outputPath, pretty = false } = options;

  if (events.length === 0) {
    console.warn('No events to export.');
    return;
  }

  const content =
    format === 'csv'
      ? eventsToCSV(events)
      : eventsToJSON(events, pretty);

  const dir = path.dirname(outputPath);
  if (dir && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, content, 'utf-8');
  console.log(`Exported ${events.length} event(s) to ${outputPath} (${format})`);
}

export function resolveExportPath(base: string, format: ExportFormat): string {
  const ext = format === 'csv' ? '.csv' : '.json';
  if (base.endsWith(ext)) return base;
  return base + ext;
}
