# Changelog

## 2.0.0

- Return a `Promise<void>` from every logging method so delivery can be awaited.
- Reject requests that time out or receive a non-2xx HTTP response.
- Add the `requestTimeoutMs` option and require HTTPS webhook URLs.
- Document error-webhook routing and correct the npm package name.
- Add automated tests and continuous integration for supported Node.js versions.

### Migration from 1.x

Logging calls still use the same method names and arguments. When delivery matters, await the returned promise or handle its rejection:

```ts
await logger.error("Something went wrong");
```

If a call is intentionally fire-and-forget, explicitly handle delivery failures:

```ts
void logger.info("Application started").catch(console.error);
```
