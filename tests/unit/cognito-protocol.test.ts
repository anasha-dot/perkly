import assert from "node:assert/strict";
import { createHash, createSign, generateKeyPairSync, type JsonWebKey } from "node:crypto";
import { once } from "node:events";
import test from "node:test";
import { createApp } from "../../apps/api/src/app.ts";
import {
  CognitoProtocolError,
  assertVerifiedIdentity,
  authorizeUrl,
  createPkce,
  exchangeAuthorizationCode,
  loadConfig,
  refreshTokens,
  revokeRefreshToken,
  verifyIdToken,
  type AppConfig,
  type CognitoPoolSettings,
} from "@perkly/integrations";

const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const exported = publicKey.export({ format: "jwk" });
const jwk: JsonWebKey = { ...exported, kid: "test-1", alg: "RS256", use: "sig" };

const customer: CognitoPoolSettings = {
  poolId: "customer-pool",
  clientId: "customer-client",
  issuer: "https://customer.example.test/customer",
  hostedUi: "https://customer.example.test",
};

const admin: CognitoPoolSettings = {
  poolId: "admin-pool",
  clientId: "admin-client",
  issuer: "https://admin.example.test/admin",
  hostedUi: "https://admin.example.test",
};

test("PKCE sends a challenge instead of the verifier", () => {
  const first = createPkce();
  const second = createPkce();
  assert.equal(first.challenge, createHash("sha256").update(first.verifier).digest("base64url"));
  assert.notEqual(first.verifier, first.challenge);
  assert.notEqual(first.verifier, second.verifier);

  const url = new URL(
    authorizeUrl(customer, {
      redirectUri: "https://perkly.example.com/api/v1/auth/callback",
      state: "state-1",
      nonce: "nonce-1",
      challenge: first.challenge,
    }),
  );
  assert.equal(url.origin, "https://customer.example.test");
  assert.equal(url.pathname, "/oauth2/authorize");
  assert.equal(url.searchParams.get("response_type"), "code");
  assert.equal(url.searchParams.get("client_id"), "customer-client");
  assert.equal(url.searchParams.get("code_challenge"), first.challenge);
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.equal(url.searchParams.get("state"), "state-1");
  assert.equal(url.searchParams.get("nonce"), "nonce-1");
  assert.equal(url.searchParams.get("code_verifier"), null);
  assert.equal(url.searchParams.get("scope"), "openid email");
});

test("token calls send the verifier and do not echo provider secrets", async () => {
  let seen = "";
  const tokens = await exchangeAuthorizationCode(
    customer,
    {
      code: "auth-code",
      redirectUri: "https://perkly.example.com/api/v1/auth/callback",
      verifier: "verifier-secret",
    },
    async (_url, init) => {
      seen = String(init?.body);
      return new Response(
        JSON.stringify({ id_token: "header.payload.sig", refresh_token: "refresh-1" }),
        { status: 200 },
      );
    },
  );
  assert.match(seen, /grant_type=authorization_code/);
  assert.match(seen, /code_verifier=verifier-secret/);
  assert.doesNotMatch(seen, /client_secret/);
  assert.equal(tokens.refreshToken, "refresh-1");

  const refreshed = await refreshTokens(customer, "old-refresh", async () => {
    return new Response(JSON.stringify({ id_token: "next.payload.sig" }), { status: 200 });
  });
  assert.equal(refreshed.refreshToken, "old-refresh");

  await assert.rejects(
    exchangeAuthorizationCode(
      customer,
      {
        code: "auth-code",
        redirectUri: "https://perkly.example.com/api/v1/auth/callback",
        verifier: "verifier-secret",
      },
      async () =>
        new Response(
          JSON.stringify({ error: "invalid_grant", error_description: "verifier-secret" }),
          { status: 400 },
        ),
    ),
    (error: unknown) => {
      assert.ok(error instanceof CognitoProtocolError);
      assert.equal(error.code, "invalid_grant");
      assert.doesNotMatch(error.message, /verifier-secret/);
      return true;
    },
  );

  await assert.rejects(
    revokeRefreshToken(customer, "refresh-secret", async () => new Response("no", { status: 400 })),
    (error: unknown) => {
      assert.ok(error instanceof CognitoProtocolError);
      assert.equal(error.code, "revoke_failed");
      assert.doesNotMatch(error.message, /refresh-secret/);
      return true;
    },
  );
});

test("identity claims must match the selected pool", () => {
  const now = 1_700_000_000;
  const verified = assertVerifiedIdentity(claims(), customer, {
    poolName: "customer",
    now,
    nonce: "nonce-1",
  });
  assert.equal(verified.subject, "subject-1");
  assert.equal(verified.emailVerified, true);
  assert.equal(verified.pool, "customer");
  assert.equal(verified.nonce, "nonce-1");

  assertVerifiedIdentity(claims({ aud: ["customer-client", "other"] }), customer, {
    poolName: "customer",
    now,
  });
  assertVerifiedIdentity(claims({ nonce: undefined }), customer, { poolName: "customer", now });

  expectClaim("issuer_mismatch", claims({ iss: admin.issuer }), customer, {
    poolName: "customer",
    now,
  });
  expectClaim("audience_mismatch", claims({ aud: admin.clientId }), customer, {
    poolName: "customer",
    now,
  });
  expectClaim("token_use_invalid", claims({ token_use: "access" }), customer, {
    poolName: "customer",
    now,
  });
  expectClaim("token_expired", claims({ exp: now }), customer, { poolName: "customer", now });
  expectClaim("nonce_mismatch", claims(), customer, { poolName: "customer", now, nonce: "other" });
  expectClaim("email_unverified", claims({ email_verified: false }), customer, {
    poolName: "customer",
    now,
  });
  expectClaim("email_unverified", claims({ email_verified: "true" }), customer, {
    poolName: "customer",
    now,
  });
  expectClaim("subject_missing", claims({ sub: "" }), customer, { poolName: "customer", now });
});

test("identity tokens must verify as RS256 against the issuer key set", async () => {
  const payload = claims();
  const token = sign(payload);
  const verified = await verifyIdToken(
    token,
    customer,
    { poolName: "customer", nonce: "nonce-1", now: 1_700_000_000 },
    jwksFetch,
  );
  assert.equal(verified.subject, "subject-1");

  const [header, body, signature] = token.split(".");
  assert.ok(header !== undefined && body !== undefined && signature !== undefined);
  const tampered = `${header}.${body}.${signature.slice(0, -2)}aa`;
  await expectProtocol(
    verifyIdToken(tampered, customer, { poolName: "customer" }, jwksFetch),
    "signature_invalid",
  );
  await expectProtocol(
    verifyIdToken(sign(payload, "missing-kid"), customer, { poolName: "customer" }, jwksFetch),
    "jwks_unavailable",
  );
  await expectProtocol(
    verifyIdToken("not-a-token", customer, { poolName: "customer" }, jwksFetch),
    "token_malformed",
  );
  await expectProtocol(
    verifyIdToken(
      sign(claims({ iss: admin.issuer })),
      customer,
      { poolName: "customer" },
      jwksFetch,
    ),
    "issuer_mismatch",
  );
});

test("Cognito routes stay closed without a configured provider or a database", async () => {
  const local = loadConfig({
    APP_MODE: "local",
    HOST: "127.0.0.1",
    APP_ORIGIN: "http://127.0.0.1:5173",
  });
  const localBody = await getJson(local, "/api/v1/auth/login");
  assert.equal(localBody.status, 404);
  assert.equal(localBody.body.code, "cognito_not_configured");

  const configured: AppConfig = {
    ...local,
    adapters: { ...local.adapters, identity: "cognito" },
    cognito: {
      customer,
      admin,
      redirectUri: "https://perkly.example.com/api/v1/auth/callback",
    },
  };
  const ready = await getJson(configured, "/api/v1/auth/login");
  assert.equal(ready.status, 503);
  assert.equal(ready.body.code, "not_ready");
  assert.equal(JSON.stringify(ready.body).includes("example.test"), false);
});

function claims(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    iss: customer.issuer,
    aud: customer.clientId,
    token_use: "id",
    exp: 1_800_000_000,
    email: "nour@example.test",
    email_verified: true,
    sub: "subject-1",
    nonce: "nonce-1",
    ...extra,
  };
}

function expectClaim(
  code: string,
  payload: Record<string, unknown>,
  pool: CognitoPoolSettings,
  input: { poolName: "customer" | "admin"; now: number; nonce?: string },
): void {
  assert.throws(
    () => assertVerifiedIdentity(payload, pool, input),
    (error: unknown) => {
      assert.ok(error instanceof CognitoProtocolError);
      assert.equal(error.code, code);
      return true;
    },
  );
}

function sign(payload: Record<string, unknown>, kid = "test-1"): string {
  const header = Buffer.from(JSON.stringify({ alg: "RS256", kid })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const data = `${header}.${body}`;
  const signature = createSign("RSA-SHA256").update(data).sign(privateKey).toString("base64url");
  return `${data}.${signature}`;
}

const jwksFetch: typeof fetch = async (input) => {
  if (String(input) === `${customer.issuer}/.well-known/jwks.json`) {
    return new Response(JSON.stringify({ keys: [jwk] }), { status: 200 });
  }
  return new Response("missing", { status: 404 });
};

async function expectProtocol(pending: Promise<unknown>, code: string): Promise<void> {
  await assert.rejects(pending, (error: unknown) => {
    assert.ok(error instanceof CognitoProtocolError);
    assert.equal(error.code, code);
    return true;
  });
}

async function getJson(
  config: AppConfig,
  path: string,
): Promise<{ status: number; body: { code?: string } }> {
  const server = createApp(config).listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  const port = typeof address === "object" && address !== null ? address.port : 0;
  try {
    const response = await fetch(`http://127.0.0.1:${port}${path}`);
    return {
      status: response.status,
      body: (await response.json()) as { code?: string },
    };
  } finally {
    server.close();
  }
}
