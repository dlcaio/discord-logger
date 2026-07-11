import https from "https";
import { URL } from "url";

export interface DiscordLoggerOptions {
  webhookUrl: string;
  errorWebhookUrl?: string;
  username?: string;
  avatarUrl?: string;
  enableConsole?: boolean;
  requestTimeoutMs?: number;
}

type LogLevel = "info" | "warn" | "error" | "debug";

const COLORS: Record<LogLevel, number> = {
  info: 3447003,
  warn: 16776960,
  error: 16711680,
  debug: 9807270,
};

const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;

function parseWebhookUrl(value: string, optionName: string): URL {
  const url = new URL(value);

  if (url.protocol !== "https:") {
    throw new TypeError(`${optionName} must use HTTPS`);
  }

  return url;
}

export class DiscordLogger {
  private readonly webhookUrl: URL;
  private readonly errorWebhookUrl?: URL;
  private readonly username: string;
  private readonly avatarUrl?: string;
  private readonly enableConsole: boolean;
  private readonly requestTimeoutMs: number;

  constructor(options: DiscordLoggerOptions) {
    this.webhookUrl = parseWebhookUrl(options.webhookUrl, "webhookUrl");
    this.errorWebhookUrl = options.errorWebhookUrl
      ? parseWebhookUrl(options.errorWebhookUrl, "errorWebhookUrl")
      : undefined;
    this.username = options.username || "Logger";
    this.avatarUrl = options.avatarUrl;
    this.enableConsole = options.enableConsole !== false;
    this.requestTimeoutMs =
      options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;

    if (!Number.isFinite(this.requestTimeoutMs) || this.requestTimeoutMs <= 0) {
      throw new RangeError("requestTimeoutMs must be a positive number");
    }
  }

  private sendToDiscord(level: LogLevel, message: string): Promise<void> {
    const payload = JSON.stringify({
      username: this.username,
      avatar_url: this.avatarUrl,
      embeds: [
        {
          title: `[${level.toUpperCase()}]`,
          description: message,
          color: COLORS[level],
          timestamp: new Date().toISOString(),
        },
      ],
    });

    const webhookUrl =
      this.errorWebhookUrl && level === "error"
        ? this.errorWebhookUrl
        : this.webhookUrl;

    return new Promise((resolve, reject) => {
      const req = https.request(
        {
          method: "POST",
          hostname: webhookUrl.hostname,
          port: webhookUrl.port || undefined,
          path: `${webhookUrl.pathname}${webhookUrl.search}`,
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload),
          },
        },
        (res) => {
          let responseBody = "";

          res.setEncoding("utf8");
          res.on("data", (chunk: string) => {
            responseBody += chunk;
          });
          res.on("end", () => {
            const statusCode = res.statusCode ?? 0;

            if (statusCode >= 200 && statusCode < 300) {
              resolve();
              return;
            }

            const details = responseBody.trim();
            reject(
              new Error(
                `Discord webhook returned HTTP ${statusCode}${
                  details ? `: ${details}` : ""
                }`,
              ),
            );
          });
        },
      );

      req.setTimeout(this.requestTimeoutMs, () => {
        req.destroy(
          new Error(
            `Discord webhook request timed out after ${this.requestTimeoutMs}ms`,
          ),
        );
      });
      req.on("error", reject);
      req.write(payload);
      req.end();
    });
  }

  private log(level: LogLevel, message: string): Promise<void> {
    if (this.enableConsole) {
      console[level](`[${level.toUpperCase()}] ${message}`);
    }

    return this.sendToDiscord(level, message);
  }

  info(message: string): Promise<void> {
    return this.log("info", message);
  }

  warn(message: string): Promise<void> {
    return this.log("warn", message);
  }

  error(message: string): Promise<void> {
    return this.log("error", message);
  }

  debug(message: string): Promise<void> {
    return this.log("debug", message);
  }
}
