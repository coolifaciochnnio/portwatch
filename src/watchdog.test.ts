import { createWatchdog } from './watchdog';
import * as scanner from './scanner';
import * as snapshot from './snapshot';
import * as history from './history';
import * as notifier from './notifier';
import * as rateLimit from './rateLimit';

jest.mock('./scanner');
jest.mock('./snapshot');
jest.mock('./history');
jest.mock('./notifier');
jest.mock('./rateLimit');
jest.mock('./logger');

const mockGetOpenPorts = scanner.getOpenPorts as jest.Mock;
const mockLoadSnapshot = snapshot.loadSnapshot as jest.Mock;
const mockSaveSnapshot = snapshot.saveSnapshot as jest.Mock;
const mockDiffSnapshots = snapshot.diffSnapshots as jest.Mock;
const mockAppendEvent = history.appendEvent as jest.Mock;
const mockShouldThrottle = notifier.shouldThrottle as jest.Mock;
const mockIsFlapping = rateLimit.isFlapping as jest.Mock;
const mockRecordEvent = rateLimit.recordEvent as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockShouldThrottle.mockReturnValue(false);
  mockIsFlapping.mockReturnValue(false);
  mockRecordEvent.mockReturnValue(undefined);
  mockSaveSnapshot.mockReturnValue(undefined);
  mockAppendEvent.mockReturnValue(undefined);
});

test('emits open event when port newly appears', async () => {
  mockGetOpenPorts.mockResolvedValue([3000]);
  mockLoadSnapshot.mockReturnValue({ ports: [], timestamp: Date.now() });
  mockDiffSnapshots.mockReturnValue({ opened: [3000], closed: [] });

  const alerts: any[] = [];
  const wd = createWatchdog({ ports: [3000], intervalMs: 1000, snapshotPath: '/tmp/snap', onAlert: (e) => alerts.push(e) });
  await wd.tick();

  expect(alerts).toHaveLength(1);
  expect(alerts[0].port).toBe(3000);
  expect(alerts[0].status).toBe('open');
});

test('skips event when flapping', async () => {
  mockGetOpenPorts.mockResolvedValue([8080]);
  mockLoadSnapshot.mockReturnValue({ ports: [8080], timestamp: Date.now() });
  mockDiffSnapshots.mockReturnValue({ opened: [], closed: [8080] });
  mockIsFlapping.mockReturnValue(true);

  const alerts: any[] = [];
  const wd = createWatchdog({ ports: [8080], intervalMs: 1000, snapshotPath: '/tmp/snap', onAlert: (e) => alerts.push(e) });
  await wd.tick();

  expect(alerts).toHaveLength(0);
});

test('skips event when throttled', async () => {
  mockGetOpenPorts.mockResolvedValue([9000]);
  mockLoadSnapshot.mockReturnValue(null);
  mockDiffSnapshots.mockReturnValue({ opened: [9000], closed: [] });
  mockShouldThrottle.mockReturnValue(true);

  const alerts: any[] = [];
  const wd = createWatchdog({ ports: [9000], intervalMs: 1000, snapshotPath: '/tmp/snap', onAlert: (e) => alerts.push(e) });
  await wd.tick();

  expect(alerts).toHaveLength(0);
  expect(mockAppendEvent).not.toHaveBeenCalled();
});

test('uses all open ports as opened when no previous snapshot', async () => {
  mockGetOpenPorts.mockResolvedValue([443, 80]);
  mockLoadSnapshot.mockReturnValue(null);

  const alerts: any[] = [];
  const wd = createWatchdog({ ports: [80, 443], intervalMs: 1000, snapshotPath: '/tmp/snap', onAlert: (e) => alerts.push(e) });
  await wd.tick();

  expect(alerts.map((a) => a.port).sort()).toEqual([80, 443]);
});
