import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { once } from "node:events";
import test from "node:test";
import { createApp } from "../../apps/api/src/app.ts";
import { localIdentityAllowed } from "../../apps/api/src/sessions.ts";
import { hashSessionToken } from "@perkly/database";
import { loadConfig } from "@perkly/integrations";

test("session hashes do not store the raw token", () => {
  const token = "opaque-token-value";
  const hash = hashSessionToken(token);
  assert.equal(hash, createHash("sha256").update(token).digest("hex"));
  assert.notEqual(hash, token);
});

test("fictional login is refused unless the listener and the client are loopback", () => {
  const local = loadConfig({
    APP_MODE: "local",
    HOST: "127.0.0.1",
    APP_ORIGIN: "http://127.0.0.1:5173",
  });
  assert.equal(localIdentityAllowed(local, "127.0.0.1"), true);
  assert.equal(localIdentityAllowed(local, "::ffff:127.0.0.1"), true);
  assert.equal(localIdentityAllowed(local, "203.0.113.10"), false);

  const publicHost = loadConfig({
    APP_MODE: "local",
    HOST: "127.0.0.1",
    APP_ORIGIN: "http://127.0.0.1:5173",
  });
  assert.equal(localIdentityAllowed({ ...publicHost, host: "0.0.0.0" }, "127.0.0.1"), false);
});

test("hosted mode does not expose the local identity route", async () => {
  const config = loadConfig({
    APP_MODE: "staging",
    HOST: "0.0.0.0",
    APP_ORIGIN: "https://perkly.example.com",
    DATABASE_URL: "postgres://perkly_runtime:pw@db.internal:5432/perkly?sslmode=verify-full",
    AUTH_PROVIDER: "cognito",
    EMAIL_PROVIDER: "ses",
    SEARCH_PROVIDER: "filters",
    IMAGE_PROVIDER: "s3",
    PAYMENT_PROVIDER: "disabled",
  });
  const server = createApp(config).listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  const port = typeof address === "object" && address !== null ? address.port : 0;
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/v1/auth/local/session`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ profileId: "fixture-customer-nour" }),
    });
    const body = (await response.json()) as { code: string };
    assert.equal(response.status, 404);
    assert.equal(body.code, "local_identity_unavailable");
  } finally {
    server.close();
  }
});
