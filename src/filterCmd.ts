/**
 * filterCmd.ts — CLI integration for port filtering
 * Parses CLI flags and builds a FilterConfig from user input.
 */

import { FilterConfig, parsePortList, parsePortRange } from './filter';

export interface FilterFlags {
  include?: string;
  exclude?: string;
  includeRange?: string;
  excludeRange?: string;
}

export function buildFilterConfig(flags: FilterFlags): FilterConfig {
  const config: FilterConfig = {};

  if (flags.include) {
    const ports = parsePortList(flags.include);
    if (ports.length > 0) config.include = ports;
  }

  if (flags.exclude) {
    const ports = parsePortList(flags.exclude);
    if (ports.length > 0) config.exclude = ports;
  }

  if (flags.includeRange) {
    const range = parsePortRange(flags.includeRange);
    if (range) {
      config.includeRange = range;
    } else {
      console.warn(`[portwatch] Invalid --include-range value: "${flags.includeRange}", ignoring.`);
    }
  }

  if (flags.excludeRange) {
    const range = parsePortRange(flags.excludeRange);
    if (range) {
      config.excludeRange = range;
    } else {
      console.warn(`[portwatch] Invalid --exclude-range value: "${flags.excludeRange}", ignoring.`);
    }
  }

  return config;
}

export function describeFilter(config: FilterConfig): string {
  const parts: string[] = [];
  if (config.include) parts.push(`include: [${config.include.join(', ')}]`);
  if (config.includeRange) parts.push(`include-range: ${config.includeRange[0]}-${config.includeRange[1]}`);
  if (config.exclude) parts.push(`exclude: [${config.exclude.join(', ')}]`);
  if (config.excludeRange) parts.push(`exclude-range: ${config.excludeRange[0]}-${config.excludeRange[1]}`);
  return parts.length > 0 ? `Filter(${parts.join(', ')})` : 'Filter(none)';
}
