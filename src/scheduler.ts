import { EventEmitter } from 'events';

export interface SchedulerOptions {
  intervalMs: number;
  immediate?: boolean;
}

export interface SchedulerStats {
  ticks: number;
  startedAt: Date | null;
  lastTickAt: Date | null;
}

export class Scheduler extends EventEmitter {
  private timer: ReturnType<typeof setInterval> | null = null;
  private stats: SchedulerStats = {
    ticks: 0,
    startedAt: null,
    lastTickAt: null,
  };

  constructor(private options: SchedulerOptions) {
    super();
  }

  start(): void {
    if (this.timer !== null) return;

    this.stats.startedAt = new Date();

    if (this.options.immediate) {
      this.tick();
    }

    this.timer = setInterval(() => this.tick(), this.options.intervalMs);
  }

  stop(): void {
    if (this.timer === null) return;
    clearInterval(this.timer);
    this.timer = null;
    this.emit('stopped', this.stats);
  }

  isRunning(): boolean {
    return this.timer !== null;
  }

  getStats(): Readonly<SchedulerStats> {
    return { ...this.stats };
  }

  private tick(): void {
    this.stats.ticks += 1;
    this.stats.lastTickAt = new Date();
    this.emit('tick', this.stats.ticks);
  }
}

export function createScheduler(options: SchedulerOptions): Scheduler {
  return new Scheduler(options);
}
