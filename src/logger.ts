import * as fs from 'fs';
import * as path from 'path';
import { AlertEvent, AlertLevel } from './alerts';

export interface LoggerOptions {
  logFile?: string;
  silent?: boolean;
}

const LEVEL_COLORS: Record<AlertLevel, string> = {
  info: '\x1b[36m',
  warn: '\x1b[33m',
  critical: '\x1b[31m',
};

const RESET = '\x1b[0m';

export function formatLogLine(event: AlertEvent): string {
  const ts = event.timestamp.toISOString();
  return `[${ts}] [${event.level.toUpperCase()}] ${event.message}`;
}

export function colorize(level: AlertLevel, text: string): string {
  return `${LEVEL_COLORS[level]}${text}${RESET}`;
}

export function printEvent(event: AlertEvent, silent = false): void {
  if (silent) return;
  const line = formatLogLine(event);
  console.log(colorize(event.level, line));
}

export function appendToLogFile(event: AlertEvent, logFile: string): void {
  const line = formatLogLine(event) + '\n';
  const dir = path.dirname(logFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.appendFileSync(logFile, line, 'utf-8');
}

export function logEvents(events: AlertEvent[], options: LoggerOptions = {}): void {
  for (const event of events) {
    printEvent(event, options.silent);
    if (options.logFile) {
      appendToLogFile(event, options.logFile);
    }
  }
}

export function createLogger(options: LoggerOptions) {
  return {
    log: (events: AlertEvent[]) => logEvents(events, options),
    logOne: (event: AlertEvent) => logEvents([event], options),
  };
}
