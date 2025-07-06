# Discord Logger

A lightweight and configurable TypeScript logger that sends logs to a Discord channel via webhook. Supports `info`, `warn`, `error`, and `debug` levels, with optional console logging.

![npm version](https://img.shields.io/npm/v/@dlcaio/discord-logger?style=flat-square)
![typescript](https://img.shields.io/badge/Built%20with-TypeScript-blue?style=flat-square)
![license](https://img.shields.io/npm/l/@dlcaio/discord-logger?style=flat-square)

---

## ✨ Features

- ✅ Send logs directly to a Discord channel
- ✅ Console logging (optional)
- ✅ Custom username and avatar
- ✅ Supports all common log levels
- ✅ Zero dependencies

---

## 📦 Installation

```bash
npm install discord-logger-ts
```

## Usage

```ts
import { DiscordLogger } from "discord-logger-ts";

const logger = new DiscordLogger({
  webhookUrl: "https://discord.com/api/webhooks/WEBHOOK_ID/TOKEN",
  username: "My Logger Bot",
  avatarUrl: "https://example.com/icon.png", // optional
  enableConsole: true, // optional, defaults to true
});

logger.info("Application started");
logger.warn("This is a warning");
logger.error("Something went wrong");
logger.debug("Debug info here");
```