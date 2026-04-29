import { runSnapshotSave, runSnapshotDiff, runSnapshotClear, runSnapshotShow } from './snapshotCmd';
import * as scanner from './scanner';
import * as snapshot from './snapshot';
import type { Config } from './config';

const mockConfig: Config = {
  ports: [80, 443, 3000, 8080],
  interval: 5000,
  logFile: null,
  alertCommand: null,
  alertOnOpen: true,
  alertOnClose: true,
};

beforeEach(() => jest.clearAllMocks());

describe('runSnapshotSave', () => {
  it('saves a snapshot and logs output', async () => {
    jest.spyOn(scanner, 'getOpenPorts').mockResolvedValue([3000, 8080]);
    const saveSpy = jest.spyOn(snapshot, 'saveSnapshot').mockImplementation(() => {});
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await runSnapshotSave(mockConfig);

    expect(saveSpy).toHaveBeenCalledWith([3000, 8080]);
    expect(logSpy).toHaveBeenCalled();
  });
});

describe('runSnapshotDiff', () => {
  it('warns when no snapshot exists', async () => {
    jest.spyOn(snapshot, 'loadSnapshot').mockReturnValue(null);
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await runSnapshotDiff(mockConfig);

    expect(logSpy.mock.calls[0][0]).toMatch(/No snapshot found/);
  });

  it('reports opened and closed ports', async () => {
    jest.spyOn(snapshot, 'loadSnapshot').mockReturnValue({ timestamp: Date.now() - 1000, ports: [80, 443] });
    jest.spyOn(scanner, 'getOpenPorts').mockResolvedValue([443, 3000]);
    jest.spyOn(snapshot, 'snapshotAge').mockReturnValue(1000);
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await runSnapshotDiff(mockConfig);

    const output = logSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toMatch(/3000/);
    expect(output).toMatch(/80/);
  });
});

describe('runSnapshotClear', () => {
  it('calls deleteSnapshot and logs', () => {
    const delSpy = jest.spyOn(snapshot, 'deleteSnapshot').mockImplementation(() => {});
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    runSnapshotClear();

    expect(delSpy).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalled();
  });
});

describe('runSnapshotShow', () => {
  it('prints snapshot info when available', () => {
    jest.spyOn(snapshot, 'loadSnapshot').mockReturnValue({ timestamp: Date.now() - 2000, ports: [80, 443] });
    jest.spyOn(snapshot, 'snapshotAge').mockReturnValue(2000);
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    runSnapshotShow();

    const output = logSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toMatch(/80/);
  });

  it('warns when no snapshot on disk', () => {
    jest.spyOn(snapshot, 'loadSnapshot').mockReturnValue(null);
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    runSnapshotShow();

    expect(logSpy.mock.calls[0][0]).toMatch(/No snapshot/);
  });
});
