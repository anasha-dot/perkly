import { errorBody } from "@perkly/contracts";
import {
  ACCESS_RATE_LIMIT,
  ACCESS_RATE_WINDOW_SECONDS,
  adminGrantExists,
  consumeRateLimit,
  findActiveSession,
  staffRolesForActor,
} from "@perkly/database";
import {
  canInviteStaff,
  canReadBusiness,
  canReadOwnUser,
  hasAdminAssurance,
  isStaffRole,
  strongestStaffRole,
} from "@perkly/domain";
import type { Express, Request, Response } from "express";
import type { AppConfig } from "@perkly/integrations";
import type pg from "pg";
import {
  clientAddress,
  currentRequestId,
  readCookie,
  rejectBrowserMutation,
} from "./request-guards.ts";

const COOKIE_NAME = "perkly_session";
const RESOURCE_ID = /^[A-Za-z0-9_-]{1,80}$/;

export function registerAccessRoutes(
  app: Express,
  config: AppConfig,
  pool: pg.Pool | undefined,
): void {
  app.get("/api/v1/account", (request, response) => {
    void readAccount(request, response, pool);
  });
  app.get("/api/v1/users/:userId", (request, response) => {
    void readUser(request, response, pool);
  });
  app.get("/api/v1/businesses/:businessId/staff", (request, response) => {
    void readStaffMembership(request, response, pool);
  });
  app.post("/api/v1/businesses/:businessId/staff", (request, response) => {
    void requestStaffInvite(request, response, config, pool);
  });
  app.get("/api/v1/admin/assurance", (request, response) => {
    void readAdminAssurance(request, response, pool);
  });
}

async function readAccount(
  request: Request,
  response: Response,
  pool: pg.Pool | undefined,
): Promise<void> {
  const actor = await loadActor(request, response, pool);
  if (actor === undefined) {
    return;
  }
  response.json({
    user: { id: actor.user.id, locale: actor.user.locale, role: actor.user.role },
  });
}

async function readUser(
  request: Request,
  response: Response,
  pool: pg.Pool | undefined,
): Promise<void> {
  const actor = await loadActor(request, response, pool);
  if (actor === undefined) {
    return;
  }
  const requestedUserId = resourceId(request.params.userId);
  if (requestedUserId === undefined || !canReadOwnUser(actor.user.id, requestedUserId)) {
    deny(response, "not_found", 404);
    return;
  }
  response.json({
    user: { id: actor.user.id, locale: actor.user.locale, role: actor.user.role },
  });
}

async function readStaffMembership(
  request: Request,
  response: Response,
  pool: pg.Pool | undefined,
): Promise<void> {
  const actor = await loadActor(request, response, pool);
  if (actor === undefined || actor.pool === undefined) {
    return;
  }
  const businessId = resourceId(request.params.businessId);
  const role =
    businessId === undefined ? null : await membershipRole(actor.pool, businessId, actor.user);
  if (businessId === undefined || !canReadBusiness(role)) {
    deny(response, "not_found", 404);
    return;
  }
  response.json({ businessId, role });
}

async function requestStaffInvite(
  request: Request,
  response: Response,
  config: AppConfig,
  pool: pg.Pool | undefined,
): Promise<void> {
  const actor = await loadActor(request, response, pool);
  if (actor === undefined || actor.pool === undefined) {
    return;
  }
  if (rejectBrowserMutation(request, response, config, actor.csrfToken)) {
    return;
  }
  const businessId = resourceId(request.params.businessId);
  const role =
    businessId === undefined ? null : await membershipRole(actor.pool, businessId, actor.user);
  if (businessId === undefined || role === null) {
    deny(response, "not_found", 404);
    return;
  }
  if (!canInviteStaff(role)) {
    deny(response, "not_allowed", 403);
    return;
  }
  response.status(403).json(errorBody("not_in_this_build", currentRequestId(response)));
}

async function readAdminAssurance(
  request: Request,
  response: Response,
  pool: pg.Pool | undefined,
): Promise<void> {
  const actor = await loadActor(request, response, pool);
  if (actor === undefined || actor.pool === undefined) {
    return;
  }
  const granted = await adminGrantExists(actor.pool, actor.user.id);
  if (!hasAdminAssurance({ pool: actor.user.pool, granted })) {
    deny(response, "not_allowed", 403);
    return;
  }
  response.json({ assured: true });
}

type Actor = {
  pool: pg.Pool | undefined;
  csrfToken: string;
  user: {
    id: string;
    locale: string;
    role: string;
    fixtureProfileId: string | null;
    pool: "customer" | "admin" | null;
  };
};

async function loadActor(
  request: Request,
  response: Response,
  pool: pg.Pool | undefined,
): Promise<Actor | undefined> {
  const requestId = currentRequestId(response);
  if (pool === undefined) {
    response.status(503).json(errorBody("not_ready", requestId));
    return undefined;
  }
  const allowed = await consumeRateLimit(
    pool,
    `access:${clientAddress(request)}`,
    ACCESS_RATE_LIMIT,
    ACCESS_RATE_WINDOW_SECONDS,
  );
  if (!allowed) {
    response.status(429).json(errorBody("rate_limited", requestId));
    return undefined;
  }
  const token = readCookie(request.header("cookie"), COOKIE_NAME);
  if (token === undefined) {
    response.status(401).json(errorBody("no_session", requestId));
    return undefined;
  }
  const active = await findActiveSession(pool, token);
  if (active === undefined) {
    response.status(401).json(errorBody("no_session", requestId));
    return undefined;
  }
  return { pool, csrfToken: active.csrfToken, user: active.user };
}

async function membershipRole(
  pool: pg.Pool,
  businessId: string,
  user: { id: string; fixtureProfileId: string | null },
) {
  const roles = (
    await staffRolesForActor(pool, businessId, {
      userId: user.id,
      fixtureProfileId: user.fixtureProfileId,
    })
  ).filter(isStaffRole);
  return strongestStaffRole(roles);
}

function deny(response: Response, code: string, status: number): void {
  response.status(status).json(errorBody(code, currentRequestId(response)));
}

function resourceId(value: string | string[] | undefined): string | undefined {
  if (typeof value !== "string" || !RESOURCE_ID.test(value)) {
    return undefined;
  }
  return value;
}
