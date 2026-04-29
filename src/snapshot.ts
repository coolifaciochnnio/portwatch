import * as fs from 'fs';
import * as path from 'path';

export interface PortSnapshot {
  timestamp: number;
  ports: number[];
}

export interface SnapshotDiff {
  opened: number[];
  closed: number[];
  unchanged: number[];
}

const DEFAULT_SNAPSHOT_PATH = path.join(process.cwd(), '.portwatch-snapshot.json');

export function saveSnapshot(ports: number[], filePath: string = DEFAULT_SNAPSHOT_PATH): void {
  const snapshot: PortSnapshot = {
    timestamp: Date.now(),
    ports: [...ports].sort((a, b) => a - b),
  };
  fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2), 'utf-8');
}

export function loadSnapshot(filePath: string = DEFAULT_SNAPSHOT_PATH): PortSnapshot | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as PortSnapshot;
  } catch {
    return null;
  }
}

export function diffSnapshots(previous: PortSnapshot | null, current: number[]): SnapshotDiff {
  const previousPorts = new Set(previous?.ports ?? []);
  const currentPorts = new Set(current);

  const opened = current.filter((p) => !previousPorts.has(p));
  const closed = [...previousPorts].filter((p) => !currentPorts.has(p));
  const unchanged = current.filter((p) => previousPorts.has(p));

  return { opened, closed, unchanged };
}

export function snapshotAge(snapshot: PortSnapshot): number {
  return Date.now() - snapshot.timestamp;
}

export function deleteSnapshot(filePath: string = DEFAULT_SNAPSHOT_PATH): void {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
