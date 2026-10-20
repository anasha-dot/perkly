import assert from "node:assert/strict";
import test from "node:test";
import { clearSessionCookie, sessionCookie } from "../../apps/api/src/sessions.ts";
import { sameCsrf, sameOrigin } from "../../apps/api/src/request-guards.ts";
import {
  canInviteStaff,
  canReadOwnUser,
  hasAdminAssurance,
  sessionCapabilities,
  strongestStaffRole,
} from "@perkly/domain";

test("staff authority stays inside one business role", () => {
  assert.equal(canReadOwnUser("user-a", "user-a"), true);
  assert.equal(canReadOwnUser("user-a", "user-b"), false);
  assert.equal(strongestStaffRole(["cashier", "business_owner"]), "business_owner");
  assert.equal(strongestStaffRole(["cashier"]), "cashier");
  assert.equal(canInviteStaff("business_owner"), true);
  assert.equal(canInviteStaff("manager"), false);
  assert.equal(canInviteStaff("cashier"), false);
  assert.equal(canInviteStaff(null), false);
});

test("admin assurance requires the admin pool and a separate grant", () => {
  assert.equal(hasAdminAssurance({ pool: "customer", granted: true }), false);
  assert.equal(hasAdminAssurance({ pool: "admin", granted: false }), false);
  assert.equal(hasAdminAssurance({ pool: null, granted: true }), false);
  assert.equal(hasAdminAssurance({ pool: "admin", granted: true }), true);
  assert.deepEqual(
    sessionCapabilities({ role: "customer", pool: "customer", adminGranted: true }),
    ["customer"],
  );
  assert.deepEqual(
    sessionCapabilities({ role: "admin_pool", pool: "admin", adminGranted: false }),
    [],
  );
  assert.deepEqual(sessionCapabilities({ role: "admin_pool", pool: "admin", adminGranted: true }), [
    "administrator",
  ]);
});

test("mutation guards require the exact origin and the session csrf token", () => {
  assert.equal(sameOrigin("http://127.0.0.1:5173", "http://127.0.0.1:5173"), true);
  assert.equal(sameOrigin("http://127.0.0.1:5173/", "http://127.0.0.1:5173"), false);
  assert.equal(sameOrigin("https://perkly.example.com", "http://127.0.0.1:5173"), false);
  assert.equal(sameOrigin(undefined, "http://127.0.0.1:5173"), false);
  assert.equal(sameCsrf("token-value", "token-value"), true);
  assert.equal(sameCsrf("token-value", "token-other"), false);
  assert.equal(sameCsrf(undefined, "token-value"), false);
});

test("clearing a hosted session cookie stays HttpOnly and Secure", () => {
  const hosted = clearSessionCookie("https://perkly.example.com");
  assert.match(hosted, /HttpOnly/);
  assert.match(hosted, /Secure/);
  assert.match(hosted, /SameSite=Lax/);
  assert.match(hosted, /Path=\//);
  assert.doesNotMatch(hosted, /SameSite=None/);
  const local = sessionCookie(
    "opaque-token",
    new Date(Date.now() + 60_000),
    "http://127.0.0.1:5173",
  );
  assert.match(local, /HttpOnly/);
  assert.doesNotMatch(local, /Secure/);
  assert.equal(local.includes("csrf"), false);
});
