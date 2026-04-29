/**
 * filter.ts — Port filtering utilities for portwatch
 * Allows inclusion/exclusion of ports by range, list, or service name.
 */

export interface FilterConfig {
  include?: number[];
  exclude?: number[];
  includeRange?: [number, number];
  excludeRange?: [number, number];
}

export function isPortInRange(port: number, range: [number, number]): boolean {
  const [min, max] = range;
  return port >= min && port <= max;
}

export function applyFilter(ports: number[], config: FilterConfig): number[] {
  return ports.filter((port) => {
    if (config.exclude?.includes(port)) return false;
    if (config.excludeRange && isPortInRange(port, config.excludeRange)) return false;

    if (config.include && config.include.length > 0) {
      if (config.include.includes(port)) return true;
      if (config.includeRange && isPortInRange(port, config.includeRange)) return true;
      return false;
    }

    if (config.includeRange) {
      return isPortInRange(port, config.includeRange);
    }

    return true;
  });
}

export function parsePortList(raw: string): number[] {
  return raw
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n) && n > 0 && n <= 65535);
}

export function parsePortRange(raw: string): [number, number] | null {
  const parts = raw.split('-').map((s) => parseInt(s.trim(), 10));
  if (parts.length !== 2 || parts.some(isNaN)) return null;
  const [min, max] = parts;
  if (min > max || min < 1 || max > 65535) return null;
  return [min, max];
}
