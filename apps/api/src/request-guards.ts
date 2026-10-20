import { errorBody } from "@perkly/contracts";
import { timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import type { AppConfig } from "@perkly/integrations";

export function currentRequestId(response: Response): string {
  const value = response.locals.requestId;
  return typeof value === "string" ? value : "req_unknown";
}

export function clientAddress(request: Request): string {
  const address = request.socket.remoteAddress ?? "unknown";
  return address.replace(/^::ffff:/i, "").toLowerCase();
}

export function readCookie(header: string | undefined, name: string): string | undefined {
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

export function sameOrigin(supplied: string | undefined, allowed: string): boolean {
  return supplied === allowed;
}

export function sameCsrf(supplied: string | undefined, expected: string): boolean {
  if (supplied === undefined) {
    return false;
  }
  const actual = Buffer.from(supplied);
  const wanted = Buffer.from(expected);
  if (actual.length !== wanted.length || actual.length === 0) {
    return false;
  }
  return timingSafeEqual(actual, wanted);
}

export function rejectBrowserMutation(
  request: Request,
  response: Response,
  config: AppConfig,
  csrfToken: string | undefined,
): boolean {
  const requestId = currentRequestId(response);
  if (!sameOrigin(request.header("origin"), config.origin)) {
    response.status(403).json(errorBody("origin_rejected", requestId));
    return true;
  }
  if (csrfToken !== undefined && !sameCsrf(request.header("x-csrf-token"), csrfToken)) {
    response.status(403).json(errorBody("csrf_failed", requestId));
    return true;
  }
  return false;
}
