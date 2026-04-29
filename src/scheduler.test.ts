import { Scheduler, createScheduler } from './scheduler';

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('Scheduler', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('should not be running before start', () => {
    const s = createScheduler({ intervalMs: 1000 });
    expect(s.isRunning()).toBe(false);
  });

  it('should be running after start', () => {
    const s = createScheduler({ intervalMs: 1000 });
    s.start();
    expect(s.isRunning()).toBe(true);
    s.stop();
  });

  it('should stop correctly', () => {
    const s = createScheduler({ intervalMs: 1000 });
    s.start();
    s.stop();
    expect(s.isRunning()).toBe(false);
  });

  it('should not double-start', () => {
    jest.useFakeTimers();
    const s = createScheduler({ intervalMs: 500 });
    s.start();
    s.start(); // second call should be a no-op
    jest.advanceTimersByTime(500);
    expect(s.getStats().ticks).toBe(1);
    s.stop();
  });

  it('should emit tick events on each interval', () => {
    jest.useFakeTimers();
    const s = createScheduler({ intervalMs: 500 });
    const ticks: number[] = [];
    s.on('tick', (count) => ticks.push(count));
    s.start();
    jest.advanceTimersByTime(1500);
    expect(ticks).toEqual([1, 2, 3]);
    s.stop();
  });

  it('should fire immediately when immediate option is set', () => {
    jest.useFakeTimers();
    const s = createScheduler({ intervalMs: 1000, immediate: true });
    const ticks: number[] = [];
    s.on('tick', (count) => ticks.push(count));
    s.start();
    expect(ticks).toEqual([1]);
    jest.advanceTimersByTime(1000);
    expect(ticks).toEqual([1, 2]);
    s.stop();
  });

  it('should emit stopped event with stats', () => {
    jest.useFakeTimers();
    const s = createScheduler({ intervalMs: 500 });
    let stoppedStats: any = null;
    s.on('stopped', (stats) => { stoppedStats = stats; });
    s.start();
    jest.advanceTimersByTime(1000);
    s.stop();
    expect(stoppedStats).not.toBeNull();
    expect(stoppedStats.ticks).toBe(2);
  });

  it('getStats returns correct tick count and timestamps', () => {
    jest.useFakeTimers();
    const s = createScheduler({ intervalMs: 300 });
    s.start();
    expect(s.getStats().startedAt).toBeInstanceOf(Date);
    jest.advanceTimersByTime(300);
    const stats = s.getStats();
    expect(stats.ticks).toBe(1);
    expect(stats.lastTickAt).toBeInstanceOf(Date);
    s.stop();
  });
});
