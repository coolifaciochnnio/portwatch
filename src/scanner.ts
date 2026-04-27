import * as net from 'net';

export interface PortStatus {
  port: number;
  open: boolean;
  responseTimeMs?: number;
  checkedAt: Date;
}

export async function checkPort(port: number, host = '127.0.0.1', timeoutMs = 1000): Promise<PortStatus> {
  const start = Date.now();

  return new Promise((resolve) => {
    const socket = new net.Socket();

    const cleanup = (open: boolean) => {
      socket.destroy();
      resolve({
        port,
        open,
        responseTimeMs: open ? Date.now() - start : undefined,
        checkedAt: new Date(),
      });
    };

    socket.setTimeout(timeoutMs);

    socket.on('connect', () => cleanup(true));
    socket.on('timeout', () => cleanup(false));
    socket.on('error', () => cleanup(false));

    socket.connect(port, host);
  });
}

export async function scanPorts(ports: number[], host = '127.0.0.1', timeoutMs = 1000): Promise<PortStatus[]> {
  const results = await Promise.all(
    ports.map((port) => checkPort(port, host, timeoutMs))
  );
  return results;
}

export function getOpenPorts(statuses: PortStatus[]): PortStatus[] {
  return statuses.filter((s) => s.open);
}

export function getClosedPorts(statuses: PortStatus[]): PortStatus[] {
  return statuses.filter((s) => !s.open);
}
