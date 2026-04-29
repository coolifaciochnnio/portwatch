import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  saveSnapshot,
  loadSnapshot,
  diffSnapshots,
  snapshotAge,
  deleteSnapshot,
  PortSnapshot,
} from './snapshot';

const tmpFile = () => path.join(os.tmpdir(), `portwatch-test-${Date.now()}.json`);

describe('saveSnapshot / loadSnapshot', () => {
  it('saves and loads a snapshot correctly', () => {
    const file = tmpFile();
    saveSnapshot([3000, 8080, 443], file);
    const loaded = loadSnapshot(file);
    expect(loaded).not.toBeNull();
    expect(loaded!.ports).toEqual([443, 3000, 8080]);
    fs.unlinkSync(file);
  });

  it('returns null when file does not exist', () => {
    const result = loadSnapshot('/nonexistent/path/snapshot.json');
    expect(result).toBeNull();
  });

  it('returns null for malformed JSON', () => {
    const file = tmpFile();
    fs.writeFileSync(file, 'not json');
    expect(loadSnapshot(file)).toBeNull();
    fs.unlinkSync(file);
  });
});

describe('diffSnapshots', () => {
  const prev: PortSnapshot = { timestamp: 0, ports: [80, 443, 3000] };

  it('detects opened ports', () => {
    const diff = diffSnapshots(prev, [80, 443, 3000, 8080]);
    expect(diff.opened).toEqual([8080]);
  });

  it('detects closed ports', () => {
    const diff = diffSnapshots(prev, [80, 443]);
    expect(diff.closed).toEqual([3000]);
  });

  it('handles null previous snapshot', () => {
    const diff = diffSnapshots(null, [80, 443]);
    expect(diff.opened).toEqual([80, 443]);
    expect(diff.closed).toEqual([]);
  });

  it('reports unchanged ports', () => {
    const diff = diffSnapshots(prev, [80, 443, 3000]);
    expect(diff.unchanged).toEqual([80, 443, 3000]);
  });
});

describe('snapshotAge', () => {
  it('returns approximate age in ms', () => {
    const ts = Date.now() - 5000;
    const age = snapshotAge({ timestamp: ts, ports: [] });
    expect(age).toBeGreaterThanOrEqual(5000);
    expect(age).toBeLessThan(6000);
  });
});

describe('deleteSnapshot', () => {
  it('removes existing snapshot file', () => {
    const file = tmpFile();
    fs.writeFileSync(file, '{}');
    deleteSnapshot(file);
    expect(fs.existsSync(file)).toBe(false);
  });

  it('does not throw when file is missing', () => {
    expect(() => deleteSnapshot('/nonexistent/file.json')).not.toThrow();
  });
});
