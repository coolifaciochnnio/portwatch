#!/usr/bin/env node
import { loadConfig } from './config';
import { startMonitor } from './monitor';
import { loadHistory, clearHistory } from './history';
import { printReport } from './reporter';
import { printEvent } from './logger';

const args = process.argv.slice(2);
const command = args[0] ?? 'start';

async function main() {
  switch (command) {
    case 'start': {
      const config = loadConfig(args[1]);
      console.log(`Starting portwatch with config: ${JSON.stringify(config.ports)}`);
      await startMonitor(config, (event) => {
        printEvent(event);
      });
      break;
    }

    case 'report': {
      const format = args.includes('--json') ? 'json' : 'text';
      const portArg = args.find(a => a.startsWith('--port='));
      const port = portArg ? parseInt(portArg.split('=')[1], 10) : undefined;
      const sinceArg = args.find(a => a.startsWith('--since='));
      const since = sinceArg ? new Date(sinceArg.split('=')[1]) : undefined;

      const history = loadHistory();
      printReport(history, { format, port, since });
      break;
    }

    case 'history': {
      const history = loadHistory();
      if (history.length === 0) {
        console.log('No history found.');
      } else {
        history.forEach(e => printEvent(e));
      }
      break;
    }

    case 'clear': {
      clearHistory();
      console.log('History cleared.');
      break;
    }

    case 'help':
    default: {
      console.log([
        'Usage: portwatch <command> [options]',
        '',
        'Commands:',
        '  start [config]         Start monitoring ports',
        '  report                 Show summary report',
        '    --json               Output as JSON',
        '    --port=<n>           Filter by port',
        '    --since=<ISO date>   Filter by date',
        '  history                Print all recorded events',
        '  clear                  Clear event history',
        '  help                   Show this help message',
      ].join('\n'));
      break;
    }
  }
}

main().catch(err => {
  console.error('portwatch error:', err.message);
  process.exit(1);
});
