export type PortStatus = 'open' | 'closed';

export interface PortEvent {
  port: number;
  status: PortStatus;
  timestamp: number;
  message?: string;
}

export interface PortSnapshot {
  ports: number[];
  timestamp: number;
}

export interface WatchConfig {
  ports: number[];
  intervalMs: number;
  snapshotPath: string;
  logFile?: string;
  notifyCommand?: string;
  throttleMs?: number;
  maxFlaps?: number;
  exportPath?: string;
  exportFormat?: 'csv' | 'json';
}

export interface AlertEvent extends PortEvent {
  channel: string;
  sent: boolean;
}

export interface FilterConfig {
  include?: number[];
  exclude?: number[];
  ranges?: Array<{ from: number; to: number }>;
}

export interface NotifierConfig {
  channels: string[];
  throttleMs: number;
  command?: string;
}
