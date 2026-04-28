import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  loadHistory,
  appendEvent,
  getEventsForPort,
  clearHistory,
  summarizeHistory,
  PortEvent,
} from './history';

const tmpFile = () => path.join(os.tmpdir(), `portwatch_test_${Date.now()}.json`);

describe('loadHistory', () => {
  it('returns empty store when file does not exist', () => {
    const result = loadHistory('/nonexistent/path/file.json');
    expect(result).toEqual({ events: [] });
  });

  it('returns empty store for malformed JSON', () => {
    const f = tmpFile();
    fs.writeFileSync(f, 'not json');
    expect(loadHistory(f)).toEqual({ events: [] });
    fs.unlinkSync(f);
  });
});

describe('appendEvent', () => {
  it('creates file and appends an event', () => {
    const f = tmpFile();
    const event: PortEvent = { timestamp: '2024-01-01T00:00:00Z', port: 3000, status: 'opened' };
    appendEvent(event, f);
    const store = loadHistory(f);
    expect(store.events).toHaveLength(1);
    expect(store.events[0].port).toBe(3000);
    fs.unlinkSync(f);
  });

  it('appends multiple events', () => {
    const f = tmpFile();
    appendEvent({ timestamp: 't1', port: 8080, status: 'opened' }, f);
    appendEvent({ timestamp: 't2', port: 8080, status: 'closed' }, f);
    expect(loadHistory(f).events).toHaveLength(2);
    fs.unlinkSync(f);
  });
});

describe('getEventsForPort', () => {
  it('filters events by port', () => {
    const f = tmpFile();
    appendEvent({ timestamp: 't1', port: 3000, status: 'opened' }, f);
    appendEvent({ timestamp: 't2', port: 4000, status: 'opened' }, f);
    const results = getEventsForPort(3000, f);
    expect(results).toHaveLength(1);
    expect(results[0].port).toBe(3000);
    fs.unlinkSync(f);
  });
});

describe('clearHistory', () => {
  it('resets events to empty array', () => {
    const f = tmpFile();
    appendEvent({ timestamp: 't1', port: 5000, status: 'opened' }, f);
    clearHistory(f);
    expect(loadHistory(f).events).toHaveLength(0);
    fs.unlinkSync(f);
  });
});

describe('summarizeHistory', () => {
  it('counts opened and closed per port', () => {
    const f = tmpFile();
    appendEvent({ timestamp: 't1', port: 3000, status: 'opened' }, f);
    appendEvent({ timestamp: 't2', port: 3000, status: 'opened' }, f);
    appendEvent({ timestamp: 't3', port: 3000, status: 'closed' }, f);
    const summary = summarizeHistory(f);
    expect(summary[3000]).toEqual({ opened: 2, closed: 1 });
    fs.unlinkSync(f);
  });
});
