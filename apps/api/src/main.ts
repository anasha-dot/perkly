import { createApp } from "./app.ts";

const port = Number(process.env.PORT ?? "3001");
const host = process.env.HOST ?? "127.0.0.1";

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer from 1 to 65535.");
}

const server = createApp().listen(port, host, () => {
  console.log(`perkly-api listening on http://${host}:${port}`);
});

function shutdown(): void {
  server.close(() => {
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
