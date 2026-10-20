import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import test from "node:test";
import { EnvironmentConfigError, loadConfig } from "@perkly/integrations";

const hostedDatabase = "postgres://perkly_runtime:pw@db.internal:5432/perkly?sslmode=verify-full";

test("local defaults select fictional profiles, the outbox, and fixtures without AWS", () => {
  const config = loadConfig(localEnv());
  assert.equal(config.mode, "local");
  assert.equal(config.adapters.identity, "local-fixtures");
  assert.equal(config.adapters.email, "outbox");
  assert.equal(config.adapters.search, "fixtures");
  assert.equal(config.adapters.images, "local");
  assert.equal(config.adapters.payment, "disabled");
  assert.equal("aws" in config, false);
});

test("hosted mode accepts real adapter names and does not require AWS credentials", () => {
  const config = loadConfig(
    hostedEnv({
      AUTH_PROVIDER: "cognito",
      EMAIL_PROVIDER: "ses",
      SEARCH_PROVIDER: "filters",
      IMAGE_PROVIDER: "s3",
      PAYMENT_PROVIDER: "disabled",
    }),
  );
  assert.equal(config.mode, "staging");
  assert.equal(config.adapters.identity, "cognito");
  assert.equal(config.adapters.email, "ses");
  assert.equal(config.adapters.search, "filters");
  assert.equal(config.adapters.payment, "disabled");
});

test("hosted mode rejects demo identity, the outbox, fixture search, and simulator payments", () => {
  assert.throws(() => loadConfig(hostedEnv({ AUTH_PROVIDER: "local" })), /demo identity/);
  assert.throws(() => loadConfig(hostedEnv({ EMAIL_PROVIDER: "outbox" })), /outbox/);
  assert.throws(() => loadConfig(hostedEnv({ SEARCH_PROVIDER: "fixtures" })), /demo search/);
  assert.throws(
    () => loadConfig(hostedEnv({ PAYMENT_PROVIDER: "simulator" })),
    /simulator payments/,
  );
  assert.throws(
    () => loadConfig(hostedEnv({ PAYMENT_PROVIDER: "payplus" })),
    /Membership billing is not in this build/,
  );
  assert.throws(() => loadConfig(hostedEnv({ PAYMENT_ENV: "live" })), /live payment environment/);
});

test("local mode rejects a public listener and a hosted database", () => {
  assert.throws(() => loadConfig(localEnv({ HOST: "0.0.0.0" })), /loopback listener/);
  assert.throws(
    () =>
      loadConfig(
        localEnv({
          DATABASE_URL: "postgres://perkly_runtime:pw@db.internal:5432/perkly",
        }),
      ),
    /without AWS/,
  );
});

test("the local api process starts without AWS settings", async () => {
  const output = await listenAndStop(["apps/api/src/main.ts"], localEnv({ PORT: "34567" }));
  assert.match(output, /identity=local-fixtures/);
  assert.match(output, /payment=disabled/);
});

test("a hosted api process with a valid adapter set starts without AWS credentials", async () => {
  const output = await listenAndStop(
    ["apps/api/src/main.ts"],
    hostedEnv({
      AUTH_PROVIDER: "cognito",
      EMAIL_PROVIDER: "ses",
      SEARCH_PROVIDER: "bedrock",
      IMAGE_PROVIDER: "s3",
      PAYMENT_PROVIDER: "disabled",
      PORT: "34568",
    }),
  );
  assert.match(output, /identity=cognito/);
  assert.match(output, /search=bedrock/);
  assert.doesNotMatch(output, /amazonaws/);
});

test("hosted startup with demo adapters exits before listening", () => {
  const result = spawnSync(process.execPath, ["apps/api/src/main.ts"], {
    encoding: "utf8",
    env: hostedEnv({
      AUTH_PROVIDER: "local-fixtures",
      EMAIL_PROVIDER: "ses",
      SEARCH_PROVIDER: "filters",
      IMAGE_PROVIDER: "s3",
      PORT: "34569",
    }),
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /demo identity/);
  assert.doesNotMatch(`${result.stdout}`, /listening/);
});

test("the worker rejects demo search in production", () => {
  const result = spawnSync(process.execPath, ["apps/worker/src/main.ts"], {
    encoding: "utf8",
    env: hostedEnv({
      APP_MODE: "production",
      AUTH_PROVIDER: "cognito",
      EMAIL_PROVIDER: "ses",
      SEARCH_PROVIDER: "fixtures",
      IMAGE_PROVIDER: "s3",
      APP_ORIGIN: "https://perkly.example.com",
    }),
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /demo search/);
});

function localEnv(extra: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    ...withoutCloud(process.env),
    APP_MODE: "local",
    HOST: "127.0.0.1",
    APP_ORIGIN: "http://127.0.0.1:5173",
    ...extra,
  };
}

function hostedEnv(extra: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  return {
    ...withoutCloud(process.env),
    APP_MODE: "staging",
    HOST: "0.0.0.0",
    APP_ORIGIN: "https://perkly.example.com",
    DATABASE_URL: hostedDatabase,
    AUTH_PROVIDER: "cognito",
    EMAIL_PROVIDER: "ses",
    SEARCH_PROVIDER: "filters",
    IMAGE_PROVIDER: "s3",
    PAYMENT_PROVIDER: "disabled",
    ...extra,
  };
}

function withoutCloud(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const next: NodeJS.ProcessEnv = {};
  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith("AWS_") || key === "DATABASE_URL" || key === "APP_MODE") {
      continue;
    }
    next[key] = value;
  }
  return next;
}

function listenAndStop(args: string[], env: NodeJS.ProcessEnv): Promise<string> {
  const child = spawn(process.execPath, args, {
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  return new Promise((resolve, reject) => {
    let output = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`timed out waiting for startup\n${output}`));
    }, 5_000);
    child.stdout.on("data", (chunk: Buffer) => {
      output += chunk.toString();
      if (output.includes("listening") || output.includes("perkly-worker started")) {
        clearTimeout(timer);
        child.kill("SIGTERM");
        resolve(output);
      }
    });
    child.stderr.on("data", (chunk: Buffer) => {
      output += chunk.toString();
    });
    child.on("exit", (code) => {
      clearTimeout(timer);
      if (!output.includes("listening") && !output.includes("perkly-worker started")) {
        reject(new Error(`exited ${code ?? "null"} before ready\n${output}`));
      }
    });
  });
}

test("config errors are the environment error type", () => {
  assert.throws(
    () => loadConfig(hostedEnv({ APP_ORIGIN: "http://perkly.example.com" })),
    EnvironmentConfigError,
  );
});
