import { errorBody } from "@perkly/contracts";
import {
  AUTH_RATE_LIMIT,
  AUTH_RATE_WINDOW_SECONDS,
  consumeOAuthFlow,
  consumeRateLimit,
  createCognitoSession,
  findActiveSession,
  insertOAuthFlow,
  readRefreshToken,
  replaceRefreshToken,
  revokeSession,
} from "@perkly/database";
import {
  CognitoProtocolError,
  authorizeUrl,
  createLogger,
  createPkce,
  exchangeAuthorizationCode,
  refreshTokens,
  revokeRefreshToken,
  sha256Hex,
  verifyIdToken,
  type AppConfig,
  type CognitoPoolName,
} from "@perkly/integrations";
import { randomBytes } from "node:crypto";
import type { Express, Request, Response } from "express";
import type pg from "pg";
import { clientAddress, currentRequestId, rejectBrowserMutation } from "./request-guards.ts";
import { publicSession, sessionCookie } from "./sessions.ts";

const log = createLogger("perkly-api");
const PUBLIC_CODE = /^[a-z0-9_]{1,40}$/;

export function registerCognitoRoutes(
  app: Express,
  config: AppConfig,
  pool: pg.Pool | undefined,
): void {
  app.get("/api/v1/auth/login", (request, response, next) => {
    startLogin(request, response, config, pool).catch(next);
  });
  app.get("/api/v1/auth/callback", (request, response, next) => {
    finishLogin(request, response, config, pool).catch(next);
  });
  app.post("/api/v1/auth/refresh", (request, response, next) => {
    refreshLogin(request, response, config, pool).catch(next);
  });
}

async function startLogin(
  request: Request,
  response: Response,
  config: AppConfig,
  pool: pg.Pool | undefined,
): Promise<void> {
  const requestId = currentRequestId(response);
  if (config.cognito === undefined) {
    response.status(404).json(errorBody("cognito_not_configured", requestId));
    return;
  }
  if (pool === undefined) {
    response.status(503).json(errorBody("not_ready", requestId));
    return;
  }
  if (!(await allowAuth(pool, request, response))) {
    return;
  }
  const poolName = requestedPool(request.query.pool);
  if (poolName === undefined) {
    response
      .status(400)
      .json(errorBody("validation_failed", requestId, [{ field: "pool", code: "invalid" }]));
    return;
  }
  const state = randomBytes(32).toString("base64url");
  const nonce = randomBytes(32).toString("base64url");
  const pkce = createPkce();
  await insertOAuthFlow(pool, {
    poolName,
    stateHash: sha256Hex(state),
    nonceHash: sha256Hex(nonce),
    codeVerifierHash: sha256Hex(pkce.verifier),
    codeVerifier: pkce.verifier,
    redirectUri: config.cognito.redirectUri,
  });
  response.redirect(
    authorizeUrl(config.cognito[poolName], {
      redirectUri: config.cognito.redirectUri,
      state,
      nonce,
      challenge: pkce.challenge,
    }),
  );
}

async function finishLogin(
  request: Request,
  response: Response,
  config: AppConfig,
  pool: pg.Pool | undefined,
): Promise<void> {
  const requestId = currentRequestId(response);
  if (config.cognito === undefined) {
    response.status(404).json(errorBody("cognito_not_configured", requestId));
    return;
  }
  if (pool === undefined) {
    response.status(503).json(errorBody("not_ready", requestId));
    return;
  }
  if (!(await allowAuth(pool, request, response))) {
    return;
  }
  const state = readQuery(request, "state");
  const code = readQuery(request, "code");
  if (state === undefined || code === undefined) {
    response.status(400).json(errorBody("oauth_state_invalid", requestId));
    return;
  }
  const flow = await consumeOAuthFlow(pool, sha256Hex(state));
  if (flow === undefined) {
    response.status(400).json(errorBody("oauth_state_invalid", requestId));
    return;
  }
  const settings = config.cognito[flow.pool];
  try {
    const tokens = await exchangeAuthorizationCode(settings, {
      code,
      redirectUri: flow.redirectUri,
      verifier: flow.codeVerifier,
    });
    const identity = await verifyIdToken(tokens.idToken, settings, { poolName: flow.pool });
    if (identity.nonce === undefined || sha256Hex(identity.nonce) !== flow.nonceHash) {
      throw new CognitoProtocolError(
        "nonce_mismatch",
        "The identity token nonce does not match this login.",
      );
    }
    const created = await createCognitoSession(pool, {
      subject: identity.subject,
      email: identity.email,
      poolName: identity.pool,
      refreshToken: tokens.refreshToken,
    });
    response.setHeader(
      "set-cookie",
      sessionCookie(created.token, created.expiresAt, config.origin),
    );
    response.redirect(config.origin);
  } catch (error) {
    if (error instanceof CognitoProtocolError) {
      const codeName = publicCode(error.code, "oauth_failed");
      log.error("cognito_callback_failed", { requestId, code: codeName });
      response.status(400).json(errorBody(codeName, requestId));
      return;
    }
    throw error;
  }
}

async function refreshLogin(
  request: Request,
  response: Response,
  config: AppConfig,
  pool: pg.Pool | undefined,
): Promise<void> {
  const requestId = currentRequestId(response);
  const token = readCookie(request.header("cookie"), "perkly_session");
  if (token === undefined || config.cognito === undefined || pool === undefined) {
    response.status(401).json(errorBody("no_session", requestId));
    return;
  }
  if (!(await allowAuth(pool, request, response))) {
    return;
  }
  const active = await findActiveSession(pool, token);
  if (active === undefined) {
    response.status(401).json(errorBody("no_session", requestId));
    return;
  }
  if (rejectBrowserMutation(request, response, config, active.csrfToken)) {
    return;
  }
  const material = await readRefreshToken(pool, token);
  if (material === undefined) {
    response.status(401).json(errorBody("no_session", requestId));
    return;
  }
  const settings = config.cognito[material.poolName];
  try {
    const tokens = await refreshTokens(settings, material.refreshToken);
    const identity = await verifyIdToken(tokens.idToken, settings, {
      poolName: material.poolName,
    });
    if (identity.subject !== material.subject || identity.pool !== material.poolName) {
      await revokeProviderToken(settings, tokens.refreshToken, requestId);
      await revokeSession(pool, token);
      response.status(401).json(errorBody("identity_mismatch", requestId));
      return;
    }
    if (tokens.refreshToken !== material.refreshToken) {
      await replaceRefreshToken(pool, token, tokens.refreshToken);
    }
    const current = await findActiveSession(pool, token);
    if (current === undefined) {
      response.status(401).json(errorBody("no_session", requestId));
      return;
    }
    response.json(await publicSession(pool, current.user, current.csrfToken));
  } catch (error) {
    if (error instanceof CognitoProtocolError) {
      const codeName = publicCode(error.code, "refresh_failed");
      log.error("cognito_refresh_failed", { requestId, code: codeName });
      response.status(401).json(errorBody(codeName, requestId));
      return;
    }
    throw error;
  }
}

async function revokeProviderToken(
  settings: NonNullable<AppConfig["cognito"]>[CognitoPoolName],
  refreshToken: string,
  requestId: string,
): Promise<void> {
  try {
    await revokeRefreshToken(settings, refreshToken);
  } catch (error) {
    const codeName =
      error instanceof CognitoProtocolError
        ? publicCode(error.code, "revoke_failed")
        : "revoke_failed";
    log.error("cognito_revoke_failed", { requestId, code: codeName });
  }
}

function requestedPool(value: unknown): CognitoPoolName | undefined {
  if (value === undefined || value === "customer") {
    return "customer";
  }
  if (value === "admin") {
    return "admin";
  }
  return undefined;
}

function publicCode(code: string, fallback: string): string {
  return PUBLIC_CODE.test(code) ? code : fallback;
}

function readQuery(request: Request, name: string): string | undefined {
  const value = request.query[name];
  return typeof value === "string" && value !== "" ? value : undefined;
}

async function allowAuth(pool: pg.Pool, request: Request, response: Response): Promise<boolean> {
  const allowed = await consumeRateLimit(
    pool,
    `auth:${clientAddress(request)}`,
    AUTH_RATE_LIMIT,
    AUTH_RATE_WINDOW_SECONDS,
  );
  if (!allowed) {
    response.status(429).json(errorBody("rate_limited", currentRequestId(response)));
    return false;
  }
  return true;
}

function readCookie(header: string | undefined, name: string): string | undefined {
  if (header === undefined) {
    return undefined;
  }
  for (const part of header.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (rawName === name) {
      return rawValue.join("=");
    }
  }
  return undefined;
}
