import { getOpenPorts } from './scanner';
import { saveSnapshot, loadSnapshot, diffSnapshots, snapshotAge, deleteSnapshot } from './snapshot';
import { colorize } from './logger';
import type { Config } from './config';

export async function runSnapshotSave(config: Config): Promise<void> {
  const ports = await getOpenPorts(config.ports);
  saveSnapshot(ports);
  console.log(colorize('green', `Snapshot saved: ${ports.length} open port(s) recorded.`));
  if (ports.length > 0) {
    console.log(colorize('cyan', `  Ports: ${ports.join(', ')}`));
  }
}

export async function runSnapshotDiff(config: Config): Promise<void> {
  const previous = loadSnapshot();
  if (!previous) {
    console.log(colorize('yellow', 'No snapshot found. Run `portwatch snapshot save` first.'));
    return;
  }

  const ageSeconds = Math.round(snapshotAge(previous) / 1000);
  console.log(colorize('cyan', `Comparing against snapshot from ${ageSeconds}s ago...`));

  const current = await getOpenPorts(config.ports);
  const diff = diffSnapshots(previous, current);

  if (diff.opened.length === 0 && diff.closed.length === 0) {
    console.log(colorize('green', 'No changes since last snapshot.'));
    return;
  }

  if (diff.opened.length > 0) {
    console.log(colorize('red', `  Opened: ${diff.opened.join(', ')}`));
  }
  if (diff.closed.length > 0) {
    console.log(colorize('yellow', `  Closed: ${diff.closed.join(', ')}`));
  }
}

export function runSnapshotClear(): void {
  deleteSnapshot();
  console.log(colorize('yellow', 'Snapshot cleared.'));
}

export function runSnapshotShow(): void {
  const snapshot = loadSnapshot();
  if (!snapshot) {
    console.log(colorize('yellow', 'No snapshot on disk.'));
    return;
  }
  const age = Math.round(snapshotAge(snapshot) / 1000);
  console.log(colorize('cyan', `Snapshot from ${age}s ago:`));
  console.log(colorize('white', `  Ports: ${snapshot.ports.length > 0 ? snapshot.ports.join(', ') : '(none)'}`))
}
