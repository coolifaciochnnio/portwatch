import { exec } from "child_process";
import { promisify } from "util";
import { AlertEvent } from "./alerts";

const execAsync = promisify(exec);

export type NotifyChannel = "console" | "command" | "file";

export interface NotifierConfig {
  channels: NotifyChannel[];
  command?: string;
  filePath?: string;
  throttleMs?: number;
}

const lastNotified: Map<string, number> = new Map();

export function shouldThrottle(key: string, throttleMs: number): boolean {
  const now = Date.now();
  const last = lastNotified.get(key);
  if (last !== undefined && now - last < throttleMs) return true;
  lastNotified.set(key, now);
  return false;
}

export async function notifyConsole(event: AlertEvent): Promise<void> {
  const tag = event.type === "opened" ? "\x1b[32mOPENED\x1b[0m" : "\x1b[31mCLOSED\x1b[0m";
  console.log(`[ALERT] Port ${event.port} ${tag} — ${event.message}`);
}

export async function notifyCommand(event: AlertEvent, command: string): Promise<void> {
  const cmd = command
    .replace("{port}", String(event.port))
    .replace("{type}", event.type)
    .replace("{message}", event.message);
  await execAsync(cmd);
}

export async function notifyFile(event: AlertEvent, filePath: string): Promise<void> {
  const { appendFile } = await import("fs/promises");
  const line = `${new Date(event.timestamp).toISOString()} [${event.type}] port=${event.port} ${event.message}\n`;
  await appendFile(filePath, line, "utf-8");
}

export async function dispatchNotification(
  event: AlertEvent,
  config: NotifierConfig
): Promise<void> {
  const throttleMs = config.throttleMs ?? 0;
  const key = `${event.port}:${event.type}`;
  if (throttleMs > 0 && shouldThrottle(key, throttleMs)) return;

  const tasks: Promise<void>[] = [];

  for (const channel of config.channels) {
    if (channel === "console") tasks.push(notifyConsole(event));
    if (channel === "command" && config.command) tasks.push(notifyCommand(event, config.command));
    if (channel === "file" && config.filePath) tasks.push(notifyFile(event, config.filePath));
  }

  await Promise.allSettled(tasks);
}

export function resetThrottleState(): void {
  lastNotified.clear();
}
