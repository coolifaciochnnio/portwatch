import { buildReport, formatReport, ReportOptions } from './reporter';
import { PortEvent } from './monitor';

const sampleEvents: PortEvent[] = [
  { port: 3000, status: 'open', timestamp: '2024-01-01T10:00:00.000Z' },
  { port: 3000, status: 'closed', timestamp: '2024-01-01T11:00:00.000Z' },
  { port: 8080, status: 'open', timestamp: '2024-01-01T12:00:00.000Z' },
  { port: 8080, status: 'open', timestamp: '2024-01-01T13:00:00.000Z' },
  { port: 5432, status: 'open', timestamp: '2024-01-01T14:00:00.000Z' },
];

describe('buildReport', () => {
  it('counts total events correctly', () => {
    const report = buildReport(sampleEvents);
    expect(report.totalEvents).toBe(5);
  });

  it('counts open and closed events', () => {
    const report = buildReport(sampleEvents);
    expect(report.openCount).toBe(4);
    expect(report.closeCount).toBe(1);
  });

  it('identifies the most active port', () => {
    const report = buildReport(sampleEvents);
    expect(report.mostActivePort).toBe(8080);
  });

  it('filters by port', () => {
    const report = buildReport(sampleEvents, { port: 3000 });
    expect(report.totalEvents).toBe(2);
    expect(report.mostActivePort).toBe(3000);
  });

  it('filters by since date', () => {
    const since = new Date('2024-01-01T12:00:00.000Z');
    const report = buildReport(sampleEvents, { since });
    expect(report.totalEvents).toBe(3);
  });

  it('returns null mostActivePort when no events', () => {
    const report = buildReport([]);
    expect(report.mostActivePort).toBeNull();
    expect(report.totalEvents).toBe(0);
  });
});

describe('formatReport', () => {
  it('returns valid JSON when format is json', () => {
    const report = buildReport(sampleEvents);
    const output = formatReport(report, 'json');
    expect(() => JSON.parse(output)).not.toThrow();
    const parsed = JSON.parse(output);
    expect(parsed.totalEvents).toBe(5);
  });

  it('returns text output containing key labels', () => {
    const report = buildReport(sampleEvents);
    const output = formatReport(report, 'text');
    expect(output).toContain('Total Events');
    expect(output).toContain('Ports Opened');
    expect(output).toContain('Ports Closed');
  });
});
