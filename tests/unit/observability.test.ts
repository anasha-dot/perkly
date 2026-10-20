import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import { createApp, setShuttingDown } from "../../apps/api/src/app.ts";
import { closeHttpServer } from "../../apps/api/src/shutdown.ts";
import { errorBody } from "@perkly/contracts";
import { clientErrorLog, createLogger, loadConfig, redact } from "@perkly/integrations";
import { localRoleUrl, pingRuntimeDatabase } from "@perkly/database";

test("logs and client errors redact connection secrets", () => {
  const secretUrl = "postgres://perkly_migrate:secret@127.0.0.1:5432/perkly";
  assert.equal(redact(secretUrl), "postgres://[redacted]");
  const lines: string[] = [];
  const log = createLogger("perkly-test", (line) => {
    lines.push(line);
  });
  log.info("database", { password: secretUrl, requestId: "req_example" });
  const text = lines.join("\n");
  assert.match(text, /\[redacted\]/);
  assert.doesNotMatch(text, /secret/);
  const logged = clientErrorLog(new Error(`connect failed ${secretUrl}`));
  assert.equal(logged.code, "internal_error");
  assert.doesNotMatch(logged.detail, /secret/);
  const body = errorBody("not_found", "req_example");
  assert.deepEqual(body.fieldErrors, []);
});

test("health and readiness expose no secrets, and errors carry the request id", async () => {
  setShuttingDown(false);
  const config = loadConfig({
    APP_MODE: "local",
    HOST: "127.0.0.1",
    APP_ORIGIN: "http://127.0.0.1:5173",
  });
  const databaseUrl = "postgres://perkly_runtime:secret@127.0.0.1:1/perkly";
  const server = createApp(config, { databaseUrl }).listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  const port = typeof address === "object" && address !== null ? address.port : 0;

  try {
    const health = await fetch(`http://127.0.0.1:${port}/api/v1/health`);
    const healthText = await health.text();
    assert.equal(health.status, 200);
    assert.match(healthText, /"status":"ok"/);
    assert.doesNotMatch(healthText, /secret|postgres:\/\//);

    const ready = await fetch(`http://127.0.0.1:${port}/api/v1/ready`);
    const readyText = await ready.text();
    assert.equal(ready.status, 503);
    assert.match(readyText, /"code":"not_ready"/);
    assert.match(readyText, /"requestId":/);
    assert.doesNotMatch(readyText, /secret|postgres:\/\//);

    const missing = await fetch(`http://127.0.0.1:${port}/api/v1/missing`, {
      headers: { "x-request-id": "req_from_client" },
    });
    const missingBody = (await missing.json()) as { code: string; requestId: string };
    assert.equal(missing.status, 404);
    assert.equal(missingBody.code, "not_found");
    assert.equal(missingBody.requestId, "req_from_client");
    assert.equal(missing.headers.get("x-request-id"), "req_from_client");

    setShuttingDown(true);
    const duringShutdown = await fetch(`http://127.0.0.1:${port}/api/v1/health`);
    assert.equal(duringShutdown.status, 503);
    setShuttingDown(false);
  } finally {
    await closeHttpServer(server);
  }
});

test("a closed database port is not ready and does not echo the url", async () => {
  const result = await pingRuntimeDatabase(localRoleUrl("runtime", "perkly").replace("5432", "1"));
  assert.equal(result, "unavailable");
});
