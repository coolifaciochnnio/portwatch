import * as fs from 'fs';
import * as path from 'path';
import { loadConfig, validateConfig, PortwatchConfig } from './config';

jest.mock('fs');

const mockedFs = fs as jest.Mocked<typeof fs>;

describe('loadConfig', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns defaults when config file does not exist', () => {
    mockedFs.existsSync.mockReturnValue(false);
    const config = loadConfig('/fake/path/portwatch.config.json');
    expect(config.ports).toEqual([3000, 8080, 8443]);
    expect(config.interval).toBe(2000);
    expect(config.alerts).toEqual([]);
  });

  it('parses a valid config file', () => {
    const mockConfig: PortwatchConfig = {
      ports: [4000, 5000],
      interval: 3000,
      logFile: '/tmp/portwatch.log',
      alerts: [{ port: 4000, onOpen: true }],
    };
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig) as any);

    const config = loadConfig('/fake/portwatch.config.json');
    expect(config.ports).toEqual([4000, 5000]);
    expect(config.interval).toBe(3000);
    expect(config.logFile).toBe('/tmp/portwatch.log');
    expect(config.alerts).toHaveLength(1);
  });

  it('falls back to defaults on invalid JSON', () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue('not valid json' as any);

    const config = loadConfig('/fake/portwatch.config.json');
    expect(config.ports).toEqual([3000, 8080, 8443]);
  });
});

describe('validateConfig', () => {
  it('returns no errors for a valid config', () => {
    const config: PortwatchConfig = { ports: [3000], interval: 1000, alerts: [] };
    expect(validateConfig(config)).toHaveLength(0);
  });

  it('returns error for empty ports array', () => {
    const config: PortwatchConfig = { ports: [], interval: 1000, alerts: [] };
    const errors = validateConfig(config);
    expect(errors).toContain('`ports` must be a non-empty array of numbers.');
  });

  it('returns error for out-of-range port', () => {
    const config: PortwatchConfig = { ports: [99999], interval: 1000, alerts: [] };
    const errors = validateConfig(config);
    expect(errors.some((e) => e.includes('99999'))).toBe(true);
  });

  it('returns error for interval below 500ms', () => {
    const config: PortwatchConfig = { ports: [3000], interval: 100, alerts: [] };
    const errors = validateConfig(config);
    expect(errors).toContain('`interval` must be a number >= 500ms.');
  });
});
