import { errorBody, serviceDescriptor, type ErrorBody } from "@perkly/contracts";
import {
  clientErrorLog,
  createLogger,
  publicConfigSummary,
  type AppConfig,
} from "@perkly/integrations";
import { pingRuntimeDatabase } from "@perkly/database";
import { randomBytes } from "node:crypto";
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import type pg from "pg";
import { registerCognitoRoutes } from "./cognito-auth.ts";
import { registerSessionRoutes } from "./sessions.ts";

const REQUEST_ID = /^[A-Za-z0-9_-]{8,80}$/;
const log = createLogger("perkly-api");

let shuttingDown = false;

export function setShuttingDown(value: boolean): void {
  shuttingDown = value;
}

export function createApp(
  config: AppConfig,
  options: { databaseUrl?: string; pool?: pg.Pool } = {},
): Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "2kb" }));
  const summary = publicConfigSummary(config);
  const databaseUrl = options.databaseUrl;

  app.use((request, response, next) => {
    const incoming = request.header("x-request-id");
    const requestId =
      incoming !== undefined && REQUEST_ID.test(incoming) ? incoming : newRequestId();
    response.locals.requestId = requestId;
    response.setHeader("x-request-id", requestId);
    log.info("request", { requestId, method: request.method, path: request.path });
    next();
  });

  app.get("/api/v1/health", (_request, response) => {
    if (shuttingDown) {
      response.status(503).json(notReady(response));
      return;
    }
    response.json({ status: "ok", service: "perkly-api" });
  });

  app.get("/api/v1/ready", (_request, response) => {
    void respondReady(response, databaseUrl);
  });

  app.get("/api/v1", (_request, response) => {
    response.json({
      ...serviceDescriptor,
      mode: summary.mode,
      adapters: summary.adapters,
    });
  });

  registerSessionRoutes(app, config, options.pool);
  registerCognitoRoutes(app, config, options.pool);

  app.use((_request, response) => {
    response.status(404).json(errorBody("not_found", currentRequestId(response)));
  });

  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    const logged = clientErrorLog(error);
    log.error("request_failed", { requestId: currentRequestId(response), detail: logged.detail });
    response.status(500).json(errorBody("internal_error", currentRequestId(response)));
  });

  return app;
}

async function respondReady(response: Response, databaseUrl: string | undefined): Promise<void> {
  const requestId = currentRequestId(response);
  if (shuttingDown) {
    response.status(503).json(notReady(response));
    return;
  }
  if (databaseUrl === undefined || databaseUrl.trim() === "") {
    response.json({ status: "ready", checks: { process: "ok", database: "not_configured" } });
    return;
  }
  const database = await pingRuntimeDatabase(databaseUrl);
  if (database !== "ok") {
    log.info("readiness", { requestId, database: "unavailable" });
    response.status(503).json(errorBody("not_ready", requestId));
    return;
  }
  response.json({ status: "ready", checks: { process: "ok", database: "ok" } });
}

function notReady(response: Response): ErrorBody {
  return errorBody("not_ready", currentRequestId(response));
}

function currentRequestId(response: Response): string {
  const value = response.locals.requestId;
  return typeof value === "string" ? value : "req_unknown";
}

function newRequestId(): string {
  return `req_${randomBytes(12).toString("hex")}`;
}
