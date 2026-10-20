import { errorBody } from "@perkly/contracts";
import { createLocalFixtureSession, findActiveSession, revokeSession } from "@perkly/database";
import type { AppConfig } from "@perkly/integrations";
import type { Express, Request, Response } from "express";
import type pg from "pg";

const COOKIE_NAME = "perkly_session";

export function registerSessionRoutes(
  app: Express,
  config: AppConfig,
  pool: pg.Pool | undefined,
): void {
  app.post("/api/v1/auth/local/session", (request, response) => {
    void createSession(request, response, config, pool);
  });

  app.get("/api/v1/session", (request, response) => {
    void readSession(request, response, pool);
  });

  app.post("/api/v1/auth/logout", (request, response) => {
    void logout(request, response, pool);
  });
}

export function localIdentityAllowed(
  config: AppConfig,
  remoteAddress: string | undefined,
): boolean {
  return (
    config.mode === "local" &&
    config.adapters.identity === "local-fixtures" &&
    isLoopback(config.host) &&
    isLoopback(remoteAddress)
  );
}

async function createSession(
  request: Request,
  response: Response,
  config: AppConfig,
  pool: pg.Pool | undefined,
): Promise<void> {
  const requestId = currentRequestId(response);
  if (!localIdentityAllowed(config, request.socket.remoteAddress)) {
    response.status(404).json(errorBody("local_identity_unavailable", requestId));
    return;
  }
  if (pool === undefined) {
    response.status(503).json(errorBody("not_ready", requestId));
    return;
  }
  const profileId = readProfileId(request.body);
  if (profileId === undefined) {
    response
      .status(400)
      .json(errorBody("validation_failed", requestId, [{ field: "profileId", code: "invalid" }]));
    return;
  }
  const created = await createLocalFixtureSession(pool, profileId);
  if (created === undefined) {
    response.status(404).json(errorBody("profile_not_found", requestId));
    return;
  }
  response.setHeader("set-cookie", sessionCookie(created.token, created.expiresAt, config.origin));
  response.status(201).json(sessionBody(created.user, created.csrfToken));
}

async function readSession(
  request: Request,
  response: Response,
  pool: pg.Pool | undefined,
): Promise<void> {
  const requestId = currentRequestId(response);
  const token = readCookie(request.header("cookie"), COOKIE_NAME);
  if (token === undefined || pool === undefined) {
    response.status(401).json(errorBody("no_session", requestId));
    return;
  }
  const active = await findActiveSession(pool, token);
  if (active === undefined) {
    response.status(401).json(errorBody("no_session", requestId));
    return;
  }
  response.json(sessionBody(active.user, active.csrfToken));
}

async function logout(
  request: Request,
  response: Response,
  pool: pg.Pool | undefined,
): Promise<void> {
  const token = readCookie(request.header("cookie"), COOKIE_NAME);
  if (token !== undefined && pool !== undefined) {
    await revokeSession(pool, token);
  }
  response.setHeader("set-cookie", `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
  response.status(204).end();
}

function sessionBody(
  user: {
    id: string;
    locale: string;
    role: string;
    fictional: true;
    identityProvider: "local-fixtures";
    fixtureProfileId: string;
  },
  csrfToken: string,
) {
  return {
    user: {
      id: user.id,
      locale: user.locale,
      role: user.role,
      fictional: user.fictional,
      identityProvider: user.identityProvider,
      fixtureProfileId: user.fixtureProfileId,
    },
    capabilities: [user.role],
    csrfToken,
  };
}

function readProfileId(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return undefined;
  }
  const record = body as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length !== 1 || keys[0] !== "profileId") {
    return undefined;
  }
  const profileId = record.profileId;
  if (typeof profileId !== "string" || !/^fixture-[a-z0-9-]+$/.test(profileId)) {
    return undefined;
  }
  return profileId;
}

function sessionCookie(token: string, expiresAt: Date, origin: string): string {
  const maxAge = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
  const secure = origin.startsWith("https://") ? "; Secure" : "";
  return `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`;
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

function currentRequestId(response: Response): string {
  const value = response.locals.requestId;
  return typeof value === "string" ? value : "req_unknown";
}

function isLoopback(address: string | undefined): boolean {
  if (address === undefined) {
    return false;
  }
  const normalized = address.replace(/^::ffff:/i, "").toLowerCase();
  return normalized === "127.0.0.1" || normalized === "::1" || normalized === "localhost";
}
