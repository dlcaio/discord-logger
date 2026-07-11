# Discord Logger

A lightweight TypeScript logger that sends structured logs to Discord webhooks. It supports separate routing for errors, optional console output, and has no runtime dependencies.

[![npm version](https://img.shields.io/npm/v/@dlcaio/discord-logger?style=flat-square)](https://www.npmjs.com/package/@dlcaio/discord-logger)
[![CI](https://github.com/dlcaio/discord-logger/actions/workflows/ci.yml/badge.svg)](https://github.com/dlcaio/discord-logger/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/@dlcaio/discord-logger?style=flat-square)](LICENSE)

## Features

- `info`, `warn`, `error`, and `debug` log levels
- Optional console output
- Custom webhook username and avatar
- Optional dedicated webhook for error logs
- Promise-based delivery with HTTP error and timeout reporting
- Zero runtime dependencies

## Installation

```bash
npm install @dlcaio/discord-logger
```

## Usage

```ts
import { DiscordLogger } from "@dlcaio/discord-logger";

const logger = new DiscordLogger({
  webhookUrl: "https://discord.com/api/webhooks/WEBHOOK_ID/TOKEN",
  errorWebhookUrl: "https://discord.com/api/webhooks/ERROR_WEBHOOK_ID/TOKEN",
  username: "My Logger Bot",
  avatarUrl: "https://example.com/icon.png",
  enableConsole: true,
});

await logger.info("Application started");
await logger.warn("A dependency is responding slowly");
await logger.error("Something went wrong");
await logger.debug("Debug information");
```

Each logging method returns a `Promise<void>`. Await it when delivery matters and handle failures as appropriate for your application:

```ts
try {
  await logger.error("Payment processing failed");
} catch (error) {
  console.error("Could not deliver the Discord log", error);
}
```

## Options

| Option | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `webhookUrl` | `string` | Yes | — | HTTPS webhook used for all logs by default. |
| `errorWebhookUrl` | `string` | No | — | Dedicated HTTPS webhook for `error` logs. |
| `username` | `string` | No | `"Logger"` | Username displayed by Discord. |
| `avatarUrl` | `string` | No | — | Avatar displayed by Discord. |
| `enableConsole` | `boolean` | No | `true` | Also write messages to the local console. |
| `requestTimeoutMs` | `number` | No | `10000` | Time before a webhook request is aborted. |

## Development

```bash
npm ci
npm test
```

`npm test` builds the package and runs the test suite without contacting Discord.

## License

[MIT](LICENSE)
