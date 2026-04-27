# portwatch

A lightweight CLI that monitors and logs port activity on localhost with configurable alerts.

## Installation

```bash
npm install -g portwatch
```

## Usage

Start monitoring a specific port:

```bash
portwatch --port 3000
```

Monitor multiple ports with an alert threshold:

```bash
portwatch --port 3000 8080 443 --alert-on open
```

Watch all ports in a range and log output to a file:

```bash
portwatch --range 3000-4000 --log ./portwatch.log
```

### Options

| Flag | Description |
|------|-------------|
| `--port <ports...>` | One or more ports to monitor |
| `--range <start-end>` | Monitor a range of ports |
| `--alert-on <event>` | Trigger alert on `open`, `close`, or `both` |
| `--log <path>` | Write activity log to a file |
| `--interval <ms>` | Polling interval in milliseconds (default: `1000`) |

### Example Output

```
[12:04:31] PORT 3000  OPEN    PID 48291  node
[12:05:10] PORT 3000  CLOSED  PID 48291
[12:05:45] PORT 8080  OPEN    PID 51002  python3
```

## Requirements

- Node.js 16 or higher
- macOS, Linux, or Windows (WSL recommended)

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](./LICENSE)