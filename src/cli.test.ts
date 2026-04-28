import { execSync } from 'child_process';
import path from 'path';

const CLI = path.resolve(__dirname, '../src/cli.ts');
const run = (args: string) =>
  execSync(`npx ts-node ${CLI} ${args}`, { encoding: 'utf-8', timeout: 5000 });

describe('cli help command', () => {
  it('prints usage information', () => {
    const output = run('help');
    expect(output).toContain('Usage: portwatch');
    expect(output).toContain('start');
    expect(output).toContain('report');
    expect(output).toContain('history');
    expect(output).toContain('clear');
  });

  it('defaults to help on unknown command', () => {
    const output = run('unknown-command');
    expect(output).toContain('Usage: portwatch');
  });
});

describe('cli history command', () => {
  it('outputs no history message when history is empty', () => {
    // clear first to ensure clean state
    try { run('clear'); } catch (_) {}
    const output = run('history');
    expect(output).toMatch(/no history/i);
  });
});

describe('cli clear command', () => {
  it('prints confirmation after clearing', () => {
    const output = run('clear');
    expect(output).toContain('History cleared');
  });
});

describe('cli report command', () => {
  it('outputs report in json format', () => {
    const output = run('report --json');
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it('outputs text report by default', () => {
    const output = run('report');
    expect(output).toContain('Total Events');
  });
});
