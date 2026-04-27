import * as net from 'net';
import { checkPort, scanPorts, getOpenPorts, getClosedPorts } from './scanner';

describe('checkPort', () => {
  let server: net.Server;
  let openPort: number;

  beforeAll((done) => {
    server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      openPort = (server.address() as net.AddressInfo).port;
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  it('returns open: true for a listening port', async () => {
    const result = await checkPort(openPort);
    expect(result.open).toBe(true);
    expect(result.port).toBe(openPort);
    expect(result.responseTimeMs).toBeGreaterThanOrEqual(0);
    expect(result.checkedAt).toBeInstanceOf(Date);
  });

  it('returns open: false for a closed port', async () => {
    const result = await checkPort(19999, '127.0.0.1', 300);
    expect(result.open).toBe(false);
    expect(result.responseTimeMs).toBeUndefined();
  });
});

describe('scanPorts', () => {
  it('returns a status for each port', async () => {
    const results = await scanPorts([19997, 19998], '127.0.0.1', 300);
    expect(results).toHaveLength(2);
    results.forEach((r) => expect(r).toHaveProperty('open'));
  });
});

describe('getOpenPorts / getClosedPorts', () => {
  const statuses = [
    { port: 80, open: true, responseTimeMs: 5, checkedAt: new Date() },
    { port: 443, open: false, checkedAt: new Date() },
    { port: 3000, open: true, responseTimeMs: 12, checkedAt: new Date() },
  ];

  it('filters open ports', () => {
    expect(getOpenPorts(statuses).map((s) => s.port)).toEqual([80, 3000]);
  });

  it('filters closed ports', () => {
    expect(getClosedPorts(statuses).map((s) => s.port)).toEqual([443]);
  });
});
