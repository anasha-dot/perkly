import assert from "node:assert/strict";
import {
  createHash,
  createSign,
  generateKeyPairSync,
  randomBytes,
  type JsonWebKey,
  type KeyObject,
} from "node:crypto";
import { once } from "node:events";
import http from "node:http";
import test from "node:test";
import { createApp } from "../../apps/api/src/app.ts";
import {
  assertSafeDatabaseTarget,
  createPool,
  databaseUrlFromEnv,
  hashSessionToken,
  migrate,
} from "@perkly/database";
import { sha256Hex, type AppConfig } from "@perkly/integrations";
import type pg from "pg";

// Loopback stand-in for authorize, token, revoke, and JWKS.
// This is not a hosted Cognito deployment. There is no AWS account.

test(
  "authorization code, PKCE, claims, refresh, and logout work against a loopback identity provider",
  { timeout: 60_000 },
  async () => {
    const url = databaseUrlFromEnv("test");
    const target = assertSafeDatabaseTarget(url, "test");
    await migrate(url);
    const pool = createPool("runtime", target);
    const idp = await startIdentityProvider();
    const server = createApp(protocolConfig(idp.origin), { pool }).listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    const port = typeof address === "object" && address !== null ? address.port : 0;
    const base = `http://127.0.0.1:${port}`;
    try {
      await expectSqlState(pool.query("DELETE FROM app.oauth_flows"), "42501");
      const password = await pool.query<{ column_name: string }>(
        `SELECT column_name FROM information_schema.columns
         WHERE table_schema = 'app' AND table_name = 'users' AND column_name = 'password'`,
      );
      assert.equal(password.rows.length, 0);

      const denied = await fetch(`${base}/api/v1/auth/local/session`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profileId: "fixture-customer-nour" }),
      });
      assert.equal(denied.status, 404);
      assert.equal(((await denied.json()) as { code: string }).code, "local_identity_unavailable");

      const invalidPool = await fetch(`${base}/api/v1/auth/login?pool=staff`, {
        redirect: "manual",
      });
      assert.equal(invalidPool.status, 400);

      const customer = await login(base, pool, idp, {
        poolName: "customer",
        subject: `customer-${randomBytes(4).toString("hex")}`,
        email: "nour@example.test",
      });
      assert.equal(customer.session.user.role, "customer");
      assert.equal(customer.session.user.pool, "customer");
      assert.equal(customer.session.user.fictional, false);
      assert.equal(customer.session.user.identityProvider, "cognito");
      assert.equal(customer.session.user.fixtureProfileId, null);
      assert.deepEqual(customer.session.capabilities, ["customer"]);
      assert.equal(customer.text.includes(customer.cookie), false);
      assert.equal(customer.text.includes(customer.refreshToken), false);
      assert.equal(customer.text.includes("eyJ"), false);
      assert.equal(customer.storedHash, hashSessionToken(customer.cookie));
      assert.notEqual(customer.storedHash, customer.cookie);
      assert.match(customer.cookieHeader, /HttpOnly/i);
      assert.doesNotMatch(customer.cookieHeader, /Secure/i);

      const reused = await callback(base, customer.code, customer.state);
      assert.equal(reused.status, 400);
      assert.equal(((await reused.json()) as { code: string }).code, "oauth_state_invalid");

      const admin = await login(base, pool, idp, {
        poolName: "admin",
        subject: `admin-${randomBytes(4).toString("hex")}`,
        email: "admin@example.test",
      });
      assert.equal(admin.session.user.role, "admin_pool");
      assert.equal(admin.session.user.pool, "admin");
      assert.notEqual(admin.session.user.id, customer.session.user.id);
      const customerStill = await readSession(base, customer.cookie);
      assert.equal(customerStill.user.pool, "customer");
      assert.equal(customerStill.user.role, "customer");

      const crossed = await start(base, "admin");
      const crossedCode = randomBytes(8).toString("hex");
      idp.prepare(crossedCode, {
        challenge: crossed.challenge,
        subject: "customer-subject",
        email: "nour@example.test",
        nonce: crossed.nonce,
        emailVerified: true,
        signPool: "admin",
        issuer: `${idp.origin}/customer`,
        audience: "loopback-customer-client",
      });
      const crossedResponse = await callback(base, crossedCode, crossed.state);
      assert.equal(crossedResponse.status, 400);
      assert.equal(((await crossedResponse.json()) as { code: string }).code, "issuer_mismatch");

      await expectFailure(base, pool, idp, {
        code: "nonce_mismatch",
        prepare: (started) => ({
          challenge: started.challenge,
          subject: "nonce-subject",
          email: "nour@example.test",
          nonce: "wrong-nonce",
          emailVerified: true,
          signPool: "customer",
          issuer: `${idp.origin}/customer`,
          audience: "loopback-customer-client",
        }),
      });
      await expectFailure(base, pool, idp, {
        code: "email_unverified",
        prepare: (started) => ({
          challenge: started.challenge,
          subject: "unverified-subject",
          email: "nour@example.test",
          nonce: started.nonce,
          emailVerified: false,
          signPool: "customer",
          issuer: `${idp.origin}/customer`,
          audience: "loopback-customer-client",
        }),
      });
      await expectFailure(base, pool, idp, {
        code: "token_expired",
        prepare: (started) => ({
          challenge: started.challenge,
          subject: "expired-subject",
          email: "nour@example.test",
          nonce: started.nonce,
          emailVerified: true,
          exp: 1_600_000_000,
          signPool: "customer",
          issuer: `${idp.origin}/customer`,
          audience: "loopback-customer-client",
        }),
      });

      const pkce = await start(base, "customer");
      await pool.query("UPDATE app.oauth_flows SET code_verifier = $2 WHERE state_hash = $1", [
        sha256Hex(pkce.state),
        "wrong-verifier-value",
      ]);
      const pkceCode = randomBytes(8).toString("hex");
      idp.prepare(pkceCode, {
        challenge: pkce.challenge,
        subject: "pkce-subject",
        email: "nour@example.test",
        nonce: pkce.nonce,
        emailVerified: true,
        signPool: "customer",
        issuer: `${idp.origin}/customer`,
        audience: "loopback-customer-client",
      });
      const pkceResponse = await callback(base, pkceCode, pkce.state);
      assert.equal(pkceResponse.status, 400);
      assert.equal(((await pkceResponse.json()) as { code: string }).code, "invalid_grant");

      const unknown = await callback(base, "missing", "missing-state");
      assert.equal(unknown.status, 400);
      assert.equal(((await unknown.json()) as { code: string }).code, "oauth_state_invalid");

      const expiredState = randomBytes(8).toString("hex");
      await pool.query(
        `INSERT INTO app.oauth_flows (
           id, pool, state_hash, nonce_hash, code_verifier_hash, code_verifier, redirect_uri, expires_at
         ) VALUES ($1, 'customer', $2, $2, $2, 'verifier', $3, now() - interval '1 minute')`,
        [
          `flow-${expiredState}`,
          sha256Hex(expiredState),
          "http://127.0.0.1:5173/api/v1/auth/callback",
        ],
      );
      const expired = await callback(base, "code", expiredState);
      assert.equal(expired.status, 400);
      assert.equal(((await expired.json()) as { code: string }).code, "oauth_state_invalid");

      const beforeRefresh = customer.refreshToken;
      const refreshed = await fetch(`${base}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { cookie: `perkly_session=${customer.cookie}` },
      });
      const refreshedText = await refreshed.text();
      assert.equal(refreshed.status, 200);
      const refreshedBody = JSON.parse(refreshedText) as SessionBody;
      assert.equal(refreshedBody.user.id, customer.session.user.id);
      assert.equal(refreshedBody.user.pool, "customer");
      const rotated = await refreshTokenFor(pool, customer.session.user.id);
      assert.notEqual(rotated, beforeRefresh);
      assert.equal(refreshedText.includes(beforeRefresh), false);
      assert.equal(refreshedText.includes(rotated), false);
      assert.equal(refreshedText.includes("eyJ"), false);

      idp.failRefresh = true;
      const failedRefresh = await fetch(`${base}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { cookie: `perkly_session=${customer.cookie}` },
      });
      assert.equal(failedRefresh.status, 401);
      assert.equal(((await failedRefresh.json()) as { code: string }).code, "invalid_grant");
      assert.equal((await readSession(base, customer.cookie)).user.id, customer.session.user.id);

      idp.refreshSubject = "intruder-subject";
      const mismatch = await fetch(`${base}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { cookie: `perkly_session=${admin.cookie}` },
      });
      assert.equal(mismatch.status, 401);
      assert.equal(((await mismatch.json()) as { code: string }).code, "identity_mismatch");
      const mismatchSession = await fetch(`${base}/api/v1/session`, {
        headers: { cookie: `perkly_session=${admin.cookie}` },
      });
      assert.equal(mismatchSession.status, 401);

      const latest = await refreshTokenFor(pool, customer.session.user.id);
      const logout = await fetch(`${base}/api/v1/auth/logout`, {
        method: "POST",
        headers: { cookie: `perkly_session=${customer.cookie}` },
      });
      assert.equal(logout.status, 204);
      assert.equal(idp.revoked.includes(latest), true);
      const afterLogout = await fetch(`${base}/api/v1/session`, {
        headers: { cookie: `perkly_session=${customer.cookie}` },
      });
      assert.equal(afterLogout.status, 401);

      const again = await login(base, pool, idp, {
        poolName: "customer",
        subject: customer.session.user.id,
        email: "nour@example.test",
      });
      idp.failRevoke = true;
      const logoutFails = await fetch(`${base}/api/v1/auth/logout`, {
        method: "POST",
        headers: { cookie: `perkly_session=${again.cookie}` },
      });
      assert.equal(logoutFails.status, 204);
      const dead = await fetch(`${base}/api/v1/session`, {
        headers: { cookie: `perkly_session=${again.cookie}` },
      });
      assert.equal(dead.status, 401);
    } finally {
      server.close();
      await idp.close();
      await pool.end();
    }
  },
);

type SessionBody = {
  user: {
    id: string;
    role: string;
    fictional: boolean;
    identityProvider: string;
    fixtureProfileId: string | null;
    pool: string | null;
  };
  capabilities: string[];
  csrfToken: string;
};

type StartedLogin = {
  state: string;
  nonce: string;
  challenge: string;
  clientId: string;
};

type LoginResult = {
  code: string;
  state: string;
  cookie: string;
  cookieHeader: string;
  text: string;
  session: SessionBody;
  refreshToken: string;
  storedHash: string;
};

type PreparedCode = {
  challenge: string;
  subject: string;
  email: string;
  nonce?: string;
  emailVerified: boolean;
  exp?: number;
  signPool: "customer" | "admin";
  issuer: string;
  audience: string;
};

type IdentityProvider = {
  origin: string;
  revoked: string[];
  failRefresh: boolean;
  failRevoke: boolean;
  refreshSubject: string | undefined;
  prepare: (code: string, input: PreparedCode) => void;
  close: () => Promise<void>;
};

async function login(
  base: string,
  pool: pg.Pool,
  idp: IdentityProvider,
  input: { poolName: "customer" | "admin"; subject: string; email: string },
): Promise<LoginResult> {
  const started = await start(base, input.poolName);
  const code = randomBytes(8).toString("hex");
  const before = await flowRow(pool, started.state);
  assert.equal(before.code_verifier_hash, sha256Hex(before.code_verifier ?? ""));
  assert.equal(before.nonce_hash, sha256Hex(started.nonce));
  assert.notEqual(before.code_verifier, before.code_verifier_hash);
  idp.prepare(code, {
    challenge: started.challenge,
    subject: input.subject,
    email: input.email,
    nonce: started.nonce,
    emailVerified: true,
    signPool: input.poolName,
    issuer: `${idp.origin}/${input.poolName}`,
    audience: started.clientId,
  });
  const response = await callback(base, code, started.state);
  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), "http://127.0.0.1:5173");
  const cookieHeader = setCookie(response);
  const cookie = /perkly_session=([^;]+)/.exec(cookieHeader)?.[1];
  assert.ok(cookie);
  const after = await flowRow(pool, started.state);
  assert.equal(after.code_verifier, null);
  assert.ok(after.consumed_at);
  const sessionResponse = await fetch(`${base}/api/v1/session`, {
    headers: { cookie: `perkly_session=${cookie}` },
  });
  const text = await sessionResponse.text();
  assert.equal(sessionResponse.status, 200);
  const session = JSON.parse(text) as SessionBody;
  const stored = await pool.query<{ token_hash: string; refresh_token: string }>(
    `SELECT token_hash, refresh_token
     FROM app.sessions
     WHERE user_id = $1 AND revoked_at IS NULL
     ORDER BY created_at DESC
     LIMIT 1`,
    [session.user.id],
  );
  const refreshToken = stored.rows[0]?.refresh_token;
  const storedHash = stored.rows[0]?.token_hash;
  assert.ok(refreshToken);
  assert.ok(storedHash);
  return {
    code,
    state: started.state,
    cookie,
    cookieHeader,
    text,
    session,
    refreshToken,
    storedHash,
  };
}

async function expectFailure(
  base: string,
  pool: pg.Pool,
  idp: IdentityProvider,
  input: { code: string; prepare: (started: StartedLogin) => PreparedCode },
): Promise<void> {
  const started = await start(base, "customer");
  const code = randomBytes(8).toString("hex");
  idp.prepare(code, input.prepare(started));
  const response = await callback(base, code, started.state);
  assert.equal(response.status, 400);
  assert.equal(((await response.json()) as { code: string }).code, input.code);
  const row = await flowRow(pool, started.state);
  assert.equal(row.code_verifier, null);
}

async function start(base: string, poolName: "customer" | "admin"): Promise<StartedLogin> {
  const response = await fetch(`${base}/api/v1/auth/login?pool=${poolName}`, {
    redirect: "manual",
  });
  assert.equal(response.status, 302);
  const location = response.headers.get("location");
  assert.ok(location);
  const params = new URL(location).searchParams;
  const state = params.get("state");
  const nonce = params.get("nonce");
  const challenge = params.get("code_challenge");
  const clientId = params.get("client_id");
  assert.ok(state);
  assert.ok(nonce);
  assert.ok(challenge);
  assert.ok(clientId);
  assert.equal(params.get("code_challenge_method"), "S256");
  assert.equal(params.get("response_type"), "code");
  assert.equal(location.includes("code_verifier"), false);
  return { state, nonce, challenge, clientId };
}

function callback(base: string, code: string, state: string): Promise<Response> {
  const url = new URL(`${base}/api/v1/auth/callback`);
  url.searchParams.set("code", code);
  url.searchParams.set("state", state);
  return fetch(url, { redirect: "manual" });
}

async function readSession(base: string, cookie: string): Promise<SessionBody> {
  const response = await fetch(`${base}/api/v1/session`, {
    headers: { cookie: `perkly_session=${cookie}` },
  });
  assert.equal(response.status, 200);
  return (await response.json()) as SessionBody;
}

async function flowRow(
  pool: pg.Pool,
  state: string,
): Promise<{
  code_verifier: string | null;
  code_verifier_hash: string;
  nonce_hash: string;
  consumed_at: Date | null;
}> {
  const result = await pool.query<{
    code_verifier: string | null;
    code_verifier_hash: string;
    nonce_hash: string;
    consumed_at: Date | null;
  }>(
    `SELECT code_verifier, code_verifier_hash, nonce_hash, consumed_at
     FROM app.oauth_flows WHERE state_hash = $1`,
    [sha256Hex(state)],
  );
  const row = result.rows[0];
  assert.ok(row);
  return row;
}

async function refreshTokenFor(pool: pg.Pool, userId: string): Promise<string> {
  const stored = await pool.query<{ refresh_token: string | null }>(
    `SELECT refresh_token FROM app.sessions
     WHERE user_id = $1 AND revoked_at IS NULL
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId],
  );
  const refreshToken = stored.rows[0]?.refresh_token;
  assert.ok(refreshToken);
  return refreshToken;
}

function setCookie(response: Response): string {
  const lines =
    typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];
  return (
    lines.find((line) => line.startsWith("perkly_session=")) ??
    response.headers.get("set-cookie") ??
    ""
  );
}

function protocolConfig(origin: string): AppConfig {
  return {
    mode: "local",
    host: "127.0.0.1",
    port: 0,
    origin: "http://127.0.0.1:5173",
    adapters: {
      identity: "cognito",
      email: "outbox",
      search: "fixtures",
      images: "local",
      payment: "disabled",
    },
    cognito: {
      redirectUri: "http://127.0.0.1:5173/api/v1/auth/callback",
      customer: {
        poolId: "loopback-customer-pool",
        clientId: "loopback-customer-client",
        issuer: `${origin}/customer`,
        hostedUi: origin,
      },
      admin: {
        poolId: "loopback-admin-pool",
        clientId: "loopback-admin-client",
        issuer: `${origin}/admin`,
        hostedUi: origin,
      },
    },
  };
}

type PoolKey = {
  name: "customer" | "admin";
  privateKey: KeyObject;
  jwk: JsonWebKey;
  clientId: string;
  kid: string;
};

function startIdentityProvider(): Promise<IdentityProvider> {
  const customer = poolKey("customer", "loopback-customer-client", "customer-1");
  const admin = poolKey("admin", "loopback-admin-client", "admin-1");
  const codes = new Map<string, PreparedCode>();
  const refreshStore = new Map<
    string,
    { pool: "customer" | "admin"; subject: string; email: string }
  >();
  const controls = {
    revoked: [] as string[],
    failRefresh: false,
    failRevoke: false,
    refreshSubject: undefined as string | undefined,
  };
  let origin = "";
  const server = http.createServer((request, response) => {
    void handleIdentityRequest(request, response, {
      origin,
      customer,
      admin,
      codes,
      refreshStore,
      controls,
    }).catch(() => {
      if (!response.headersSent) {
        response.writeHead(500);
      }
      response.end();
    });
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address !== null ? address.port : 0;
      origin = `http://127.0.0.1:${port}`;
      resolve({
        origin: `http://127.0.0.1:${port}`,
        revoked: controls.revoked,
        get failRefresh() {
          return controls.failRefresh;
        },
        set failRefresh(value: boolean) {
          controls.failRefresh = value;
        },
        get failRevoke() {
          return controls.failRevoke;
        },
        set failRevoke(value: boolean) {
          controls.failRevoke = value;
        },
        get refreshSubject() {
          return controls.refreshSubject;
        },
        set refreshSubject(value: string | undefined) {
          controls.refreshSubject = value;
        },
        prepare(code, input) {
          codes.set(code, input);
        },
        close() {
          return new Promise((done) => {
            server.close(() => done());
          });
        },
      });
    });
  });
}

function poolKey(name: "customer" | "admin", clientId: string, kid: string): PoolKey {
  const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const jwk = {
    ...publicKey.export({ format: "jwk" }),
    kid,
    alg: "RS256",
    use: "sig",
  } as JsonWebKey;
  return { name, privateKey, jwk, clientId, kid };
}

async function handleIdentityRequest(
  request: http.IncomingMessage,
  response: http.ServerResponse,
  input: {
    origin: string;
    customer: PoolKey;
    admin: PoolKey;
    codes: Map<string, PreparedCode>;
    refreshStore: Map<string, { pool: "customer" | "admin"; subject: string; email: string }>;
    controls: {
      revoked: string[];
      failRefresh: boolean;
      failRevoke: boolean;
      refreshSubject: string | undefined;
    };
  },
): Promise<void> {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  if (request.method === "GET" && url.pathname.endsWith("/.well-known/jwks.json")) {
    const key = url.pathname.startsWith("/admin") ? input.admin : input.customer;
    sendJson(response, 200, { keys: [key.jwk] });
    return;
  }
  const body = await readBody(request);
  const form = new URLSearchParams(body);
  if (request.method === "POST" && url.pathname === "/oauth2/token") {
    if (form.get("grant_type") === "refresh_token") {
      refreshGrant(response, form, input);
      return;
    }
    authorizationGrant(response, form, input);
    return;
  }
  if (request.method === "POST" && url.pathname === "/oauth2/revoke") {
    if (input.controls.failRevoke) {
      sendJson(response, 503, { error: "temporarily_unavailable" });
      return;
    }
    const token = form.get("token");
    if (token !== null && token !== "") {
      input.controls.revoked.push(token);
    }
    response.writeHead(200);
    response.end();
    return;
  }
  sendJson(response, 404, { error: "not_found" });
}

function authorizationGrant(
  response: http.ServerResponse,
  form: URLSearchParams,
  input: {
    customer: PoolKey;
    admin: PoolKey;
    codes: Map<string, PreparedCode>;
    refreshStore: Map<string, { pool: "customer" | "admin"; subject: string; email: string }>;
  },
): void {
  const code = form.get("code") ?? "";
  const prepared = input.codes.get(code);
  const verifier = form.get("code_verifier") ?? "";
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const clientPool = poolForClient(form.get("client_id"), input.customer, input.admin);
  if (prepared === undefined || clientPool === undefined || challenge !== prepared.challenge) {
    sendJson(response, 400, { error: "invalid_grant" });
    return;
  }
  const key = prepared.signPool === "admin" ? input.admin : input.customer;
  const payload: Record<string, unknown> = {
    iss: prepared.issuer,
    aud: prepared.audience,
    token_use: "id",
    exp: prepared.exp ?? Math.floor(Date.now() / 1000) + 600,
    iat: Math.floor(Date.now() / 1000),
    email: prepared.email,
    email_verified: prepared.emailVerified,
    sub: prepared.subject,
  };
  if (prepared.nonce !== undefined) {
    payload.nonce = prepared.nonce;
  }
  const refreshToken = randomBytes(18).toString("base64url");
  input.refreshStore.set(refreshToken, {
    pool: clientPool,
    subject: prepared.subject,
    email: prepared.email,
  });
  sendJson(response, 200, {
    id_token: signJwt(key, payload),
    refresh_token: refreshToken,
  });
}

function refreshGrant(
  response: http.ServerResponse,
  form: URLSearchParams,
  input: {
    origin: string;
    customer: PoolKey;
    admin: PoolKey;
    refreshStore: Map<string, { pool: "customer" | "admin"; subject: string; email: string }>;
    controls: { failRefresh: boolean; refreshSubject: string | undefined };
  },
): void {
  if (input.controls.failRefresh) {
    input.controls.failRefresh = false;
    sendJson(response, 400, { error: "invalid_grant" });
    return;
  }
  const current = input.refreshStore.get(form.get("refresh_token") ?? "");
  const clientPool = poolForClient(form.get("client_id"), input.customer, input.admin);
  if (current === undefined || clientPool !== current.pool) {
    sendJson(response, 400, { error: "invalid_grant" });
    return;
  }
  const subject = input.controls.refreshSubject ?? current.subject;
  input.controls.refreshSubject = undefined;
  const key = clientPool === "admin" ? input.admin : input.customer;
  const rotated = randomBytes(18).toString("base64url");
  input.refreshStore.delete(form.get("refresh_token") ?? "");
  input.refreshStore.set(rotated, current);
  sendJson(response, 200, {
    id_token: signJwt(key, {
      iss: `${input.origin}/${key.name}`,
      aud: key.clientId,
      token_use: "id",
      exp: Math.floor(Date.now() / 1000) + 600,
      iat: Math.floor(Date.now() / 1000),
      email: current.email,
      email_verified: true,
      sub: subject,
    }),
    refresh_token: rotated,
  });
}

function poolForClient(
  clientId: string | null,
  customer: PoolKey,
  admin: PoolKey,
): "customer" | "admin" | undefined {
  if (clientId === customer.clientId) {
    return "customer";
  }
  if (clientId === admin.clientId) {
    return "admin";
  }
  return undefined;
}

function signJwt(key: PoolKey, payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "RS256", kid: key.kid })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const data = `${header}.${body}`;
  const signature = createSign("RSA-SHA256")
    .update(data)
    .sign(key.privateKey)
    .toString("base64url");
  return `${data}.${signature}`;
}

function sendJson(response: http.ServerResponse, status: number, payload: unknown): void {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(payload));
}

function readBody(request: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

async function expectSqlState(pending: Promise<unknown>, code: string): Promise<void> {
  try {
    await pending;
  } catch (error) {
    assert.equal(sqlState(error), code);
    return;
  }
  assert.fail(`expected SQLSTATE ${code}`);
}

function sqlState(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = error.code;
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
}
