import https from "https";
import { URL } from "url";

export interface DiscordLoggerOptions {
  webhookUrl: string;
  username?: string;
  avatarUrl?: string;
  enableConsole?: boolean;
}

type LogLevel = "info" | "warn" | "error" | "debug";

export class DiscordLogger {
  private webhookUrl: URL;
  private username: string;
  private avatarUrl?: string;
  private enableConsole: boolean;

  constructor(options: DiscordLoggerOptions) {
    this.webhookUrl = new URL(options.webhookUrl);
    this.username = options.username || "Logger";
    this.avatarUrl = options.avatarUrl;
    this.enableConsole = options.enableConsole !== false;
  }

  private sendToDiscord(level: LogLevel, message: string): void {
    const colorMap: Record<LogLevel, number> = {
      info: 3447003,
      warn: 16776960,
      error: 16711680,
      debug: 9807270,
    };

    const payload = JSON.stringify({
      username: this.username,
      avatar_url: this.avatarUrl,
      embeds: [
        {
          title: `[${level.toUpperCase()}]`,
          description: message,
          color: colorMap[level],
          timestamp: new Date().toISOString(),
        },
      ],
    });

    const options = {
      method: "POST",
      hostname: this.webhookUrl.hostname,
      path: this.webhookUrl.pathname + this.webhookUrl.search,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      res.on("data", () => {}); // Ignore response
    });

    req.on("error", (err) => {
      if (this.enableConsole) {
        console.error("[DiscordLogger] Error:", err.message);
      }
    });

    req.write(payload);
    req.end();
  }

  private log(level: LogLevel, message: string): void {
    if (this.enableConsole) {
      console[level](`[${level.toUpperCase()}] ${message}`);
    }
    this.sendToDiscord(level, message);
  }

  info(message: string) {
    this.log("info", message);
  }

  warn(message: string) {
    this.log("warn", message);
  }

  error(message: string) {
    this.log("error", message);
  }

  debug(message: string) {
    this.log("debug", message);
  }
}
