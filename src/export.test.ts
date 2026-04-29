import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  eventsToCSV,
  eventsToJSON,
  exportEvents,
  resolveExportPath,
} from './export';
import { PortEvent } from './history';

const sampleEvents: PortEvent[] = [
  { timestamp: 1700000000000, port: 3000, status: 'open', message: 'Port opened' },
  { timestamp: 1700000060000, port: 3000, status: 'closed', message: 'Port closed' },
  { timestamp: 1700000120000, port: 8080, status: 'open', message: undefined },
];

describe('eventsToCSV', () => {
  it('includes header row', () => {
    const csv = eventsToCSV(sampleEvents);
    expect(csv.split('\n')[0]).toBe('timestamp,port,status,message');
  });

  it('produces correct number of rows', () => {
    const lines = eventsToCSV(sampleEvents).split('\n');
    expect(lines).toHaveLength(sampleEvents.length + 1);
  });

  it('replaces commas in message with semicolons', () => {
    const events: PortEvent[] = [
      { timestamp: 1700000000000, port: 9000, status: 'open', message: 'hello, world' },
    ];
    const csv = eventsToCSV(events);
    expect(csv).toContain('hello; world');
  });
});

describe('eventsToJSON', () => {
  it('returns valid JSON', () => {
    const json = eventsToJSON(sampleEvents);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('pretty prints when requested', () => {
    const json = eventsToJSON(sampleEvents, true);
    expect(json).toContain('\n');
  });
});

describe('exportEvents', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'portwatch-export-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('writes a json file', () => {
    const out = path.join(tmpDir, 'out.json');
    exportEvents(sampleEvents, { format: 'json', outputPath: out });
    expect(fs.existsSync(out)).toBe(true);
    const parsed = JSON.parse(fs.readFileSync(out, 'utf-8'));
    expect(parsed).toHaveLength(sampleEvents.length);
  });

  it('writes a csv file', () => {
    const out = path.join(tmpDir, 'out.csv');
    exportEvents(sampleEvents, { format: 'csv', outputPath: out });
    const lines = fs.readFileSync(out, 'utf-8').split('\n');
    expect(lines[0]).toBe('timestamp,port,status,message');
  });

  it('does not write file when events are empty', () => {
    const out = path.join(tmpDir, 'empty.json');
    exportEvents([], { format: 'json', outputPath: out });
    expect(fs.existsSync(out)).toBe(false);
  });
});

describe('resolveExportPath', () => {
  it('appends .json extension if missing', () => {
    expect(resolveExportPath('output', 'json')).toBe('output.json');
  });

  it('appends .csv extension if missing', () => {
    expect(resolveExportPath('output', 'csv')).toBe('output.csv');
  });

  it('does not double-append extension', () => {
    expect(resolveExportPath('output.csv', 'csv')).toBe('output.csv');
  });
});
