import { createWatchdog, WatchdogOptions } from './watchdog';
import { buildFilterConfig } from './filterCmd';
import { applyFilter } from './filter';
import { buildNotifierConfig } from './notifierCmd';
import { exportEvents, resolveExportPath } from './export';
import { loadHistory } from './history';
import type { PortEvent } from './types';

export interface WatchdogCmdArgs {
  ports?: string;
  interval?: number;
  snapshot?: string;
  export?: string;
  exportFormat?: 'csv' | 'json';
  include?: string;
  exclude?: string;
  range?: string;
  notifyChannels?: string;
  maxFlaps?: number;
}

export function buildWatchdogOptions(args: WatchdogCmdArgs): WatchdogOptions {
  const filterCfg = buildFilterConfig({
    include: args.include,
    exclude: args.exclude,
    range: args.range,
  });

  const rawPorts = args.ports
    ? args.ports.split(',').map(Number).filter(Boolean)
    : Array.from({ length: 1000 }, (_, i) => i + 1);

  const ports = applyFilter(rawPorts, filterCfg);

  const onAlert = args.export
    ? (_event: PortEvent) => {
        const events = loadHistory();
        const path = resolveExportPath(args.export!);
        exportEvents(events, path, args.exportFormat ?? 'json');
      }
    : undefined;

  return {
    ports,
    intervalMs: (args.interval ?? 5) * 1000,
    snapshotPath: args.snapshot ?? '.portwatch-snapshot.json',
    onAlert,
    maxFlaps: args.maxFlaps ?? 5,
  };
}

export function describeWatchdog(opts: WatchdogOptions): string {
  return [
    `Watching ${opts.ports.length} port(s)`,
    `Interval: ${opts.intervalMs / 1000}s`,
    `Snapshot: ${opts.snapshotPath}`,
    opts.maxFlaps !== undefined ? `Max flaps: ${opts.maxFlaps}` : null,
  ]
    .filter(Boolean)
    .join(' | ');
}

export async function runWatchdog(args: WatchdogCmdArgs): Promise<void> {
  const opts = buildWatchdogOptions(args);
  console.log(describeWatchdog(opts));
  const wd = createWatchdog(opts);
  wd.start();

  process.on('SIGINT', () => {
    wd.stop();
    console.log('\nWatchdog stopped.');
    process.exit(0);
  });
}
