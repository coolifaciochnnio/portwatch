import * as fs from 'fs';
import * as path from 'path';

export interface PortwatchConfig {
  ports: number[];
  interval: number; // polling interval in ms
  logFile?: string;
  alerts: AlertConfig[];
}

export interface AlertConfig {
  port: number;
  onOpen?: boolean;
  onClose?: boolean;
  command?: string; // shell command to run on alert
}

const DEFAULT_CONFIG: PortwatchConfig = {
  ports: [3000, 8080, 8443],
  interval: 2000,
  alerts: [],
};

export function loadConfig(configPath?: string): PortwatchConfig {
  const resolvedPath = configPath
    ? path.resolve(configPath)
    : path.resolve(process.cwd(), 'portwatch.config.json');

  if (!fs.existsSync(resolvedPath)) {
    console.warn(`[portwatch] No config file found at ${resolvedPath}, using defaults.`);
    return DEFAULT_CONFIG;
  }

  try {
    const raw = fs.readFileSync(resolvedPath, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<PortwatchConfig>;
    return mergeWithDefaults(parsed);
  } catch (err) {
    console.error(`[portwatch] Failed to parse config: ${(err as Error).message}`);
    return DEFAULT_CONFIG;
  }
}

function mergeWithDefaults(partial: Partial<PortwatchConfig>): PortwatchConfig {
  return {
    ports: partial.ports ?? DEFAULT_CONFIG.ports,
    interval: partial.interval ?? DEFAULT_CONFIG.interval,
    logFile: partial.logFile,
    alerts: partial.alerts ?? DEFAULT_CONFIG.alerts,
  };
}

export function validateConfig(config: PortwatchConfig): string[] {
  const errors: string[] = [];

  if (!Array.isArray(config.ports) || config.ports.length === 0) {
    errors.push('`ports` must be a non-empty array of numbers.');
  } else {
    config.ports.forEach((p) => {
      if (typeof p !== 'number' || p < 1 || p > 65535) {
        errors.push(`Invalid port number: ${p}. Must be between 1 and 65535.`);
      }
    });
  }

  if (typeof config.interval !== 'number' || config.interval < 500) {
    errors.push('`interval` must be a number >= 500ms.');
  }

  return errors;
}
