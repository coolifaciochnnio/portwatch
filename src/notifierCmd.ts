import { NotifierConfig, NotifyChannel } from "./notifier";

export interface NotifierCLIArgs {
  notify?: string;
  notifyCommand?: string;
  notifyFile?: string;
  notifyThrottle?: number;
}

export function parseNotifyChannels(raw: string): NotifyChannel[] {
  const valid: NotifyChannel[] = ["console", "command", "file"];
  return raw
    .split(",")
    .map((s) => s.trim() as NotifyChannel)
    .filter((ch) => valid.includes(ch));
}

export function buildNotifierConfig(args: NotifierCLIArgs): NotifierConfig | null {
  if (!args.notify) return null;

  const channels = parseNotifyChannels(args.notify);
  if (channels.length === 0) return null;

  const config: NotifierConfig = { channels };

  if (args.notifyCommand) config.command = args.notifyCommand;
  if (args.notifyFile) config.filePath = args.notifyFile;
  if (args.notifyThrottle !== undefined) config.throttleMs = args.notifyThrottle;

  return config;
}

export function describeNotifier(config: NotifierConfig): string {
  const parts: string[] = [`channels: ${config.channels.join(", ")}`];
  if (config.command) parts.push(`command: "${config.command}"`);
  if (config.filePath) parts.push(`file: ${config.filePath}`);
  if (config.throttleMs) parts.push(`throttle: ${config.throttleMs}ms`);
  return `Notifier(${parts.join(" | ")})`;
}

export function printNotifierHelp(): void {
  console.log("Notifier options:");
  console.log("  --notify <channels>       Comma-separated: console, command, file");
  console.log("  --notify-command <cmd>    Shell command; use {port}, {type}, {message}");
  console.log("  --notify-file <path>      Append alerts to file");
  console.log("  --notify-throttle <ms>    Minimum ms between duplicate alerts");
}
