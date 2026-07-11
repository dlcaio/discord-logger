const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const https = require("node:https");
const { afterEach, test } = require("node:test");

const { DiscordLogger } = require("../dist");

const originalRequest = https.request;

afterEach(() => {
  https.request = originalRequest;
});

function interceptRequest(
  { statusCode = 204, responseBody = "", respond = true } = {},
) {
  const calls = [];

  https.request = (options, callback) => {
    const request = new EventEmitter();
    let body = "";

    request.setTimeout = (timeout, onTimeout) => {
      calls.push({ options, get body() { return body; }, timeout, onTimeout });
      return request;
    };
    request.write = (chunk) => {
      body += chunk;
    };
    request.destroy = (error) => {
      queueMicrotask(() => request.emit("error", error));
    };
    request.end = () => {
      if (!respond) return;

      queueMicrotask(() => {
        const response = new EventEmitter();
        response.statusCode = statusCode;
        response.setEncoding = () => response;
        callback(response);
        if (responseBody) response.emit("data", responseBody);
        response.emit("end");
      });
    };

    return request;
  };

  return calls;
}

test("sends a structured embed to the primary webhook", async () => {
  const calls = interceptRequest();
  const logger = new DiscordLogger({
    webhookUrl: "https://discord.com/api/webhooks/primary?wait=true",
    username: "Test Logger",
    avatarUrl: "https://example.com/avatar.png",
    enableConsole: false,
    requestTimeoutMs: 2500,
  });

  await logger.info("Application started");

  assert.equal(calls.length, 1);
  assert.equal(calls[0].options.hostname, "discord.com");
  assert.equal(calls[0].options.path, "/api/webhooks/primary?wait=true");
  assert.equal(calls[0].timeout, 2500);

  const payload = JSON.parse(calls[0].body);
  assert.equal(payload.username, "Test Logger");
  assert.equal(payload.avatar_url, "https://example.com/avatar.png");
  assert.equal(payload.embeds[0].title, "[INFO]");
  assert.equal(payload.embeds[0].description, "Application started");
  assert.equal(typeof payload.embeds[0].timestamp, "string");
  assert.equal(payload.timestamp, undefined);
});

test("routes only error logs to the dedicated error webhook", async () => {
  const calls = interceptRequest();
  const logger = new DiscordLogger({
    webhookUrl: "https://discord.com/api/webhooks/primary",
    errorWebhookUrl: "https://discord.com/api/webhooks/errors",
    enableConsole: false,
  });

  await logger.warn("Warning");
  await logger.error("Failure");

  assert.equal(calls[0].options.path, "/api/webhooks/primary");
  assert.equal(calls[1].options.path, "/api/webhooks/errors");
});

test("rejects when Discord returns a non-success status", async () => {
  interceptRequest({ statusCode: 429, responseBody: "rate limited" });
  const logger = new DiscordLogger({
    webhookUrl: "https://discord.com/api/webhooks/primary",
    enableConsole: false,
  });

  await assert.rejects(
    logger.error("Failure"),
    /Discord webhook returned HTTP 429: rate limited/,
  );
});

test("aborts and rejects a request that times out", async () => {
  const calls = interceptRequest({ respond: false });
  const logger = new DiscordLogger({
    webhookUrl: "https://discord.com/api/webhooks/primary",
    enableConsole: false,
    requestTimeoutMs: 25,
  });

  const delivery = logger.error("Failure");
  calls[0].onTimeout();

  await assert.rejects(
    delivery,
    /Discord webhook request timed out after 25ms/,
  );
});

test("requires secure webhook URLs and a positive timeout", () => {
  assert.throws(
    () => new DiscordLogger({ webhookUrl: "http://example.com/webhook" }),
    /webhookUrl must use HTTPS/,
  );
  assert.throws(
    () =>
      new DiscordLogger({
        webhookUrl: "https://example.com/webhook",
        requestTimeoutMs: 0,
      }),
    /requestTimeoutMs must be a positive number/,
  );
});
