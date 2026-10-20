import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import { createApp } from "../../apps/api/src/app.ts";
import {
  ACCESS_RATE_LIMIT,
  assertSafeDatabaseTarget,
  createPool,
  localRoleUrl,
  migrate,
  seedLocal,
} from "@perkly/database";
import { loadConfig } from "@perkly/integrations";
import type pg from "pg";

const ORIGIN = "http://127.0.0.1:5173";

test(
  "permission guards reject cross-user, cross-business, and unassured admin access",
  { timeout: 60_000 },
  async () => {
    const url = localRoleUrl("migrate", "perkly");
    await migrate(url);
    await seedLocal(url);
    const target = assertSafeDatabaseTarget(url, "seed-local");
    const runtime = createPool("runtime", target);
    const migratePool = createPool("migrate", target);
    await clearBuckets(migratePool);
    const config = loadConfig({
      APP_MODE: "local",
      HOST: "127.0.0.1",
      APP_ORIGIN: ORIGIN,
    });
    const server = createApp(config, { pool: runtime }).listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    const port = typeof address === "object" && address !== null ? address.port : 0;
    const base = `http://127.0.0.1:${port}`;
    try {
      const nour = await openSession(base, "fixture-customer-nour");
      const yael = await openSession(base, "fixture-customer-yael");
      const omar = await openSession(base, "fixture-cashier-omar");
      const lina = await openSession(base, "fixture-manager-lina");
      const samir = await openSession(base, "fixture-owner-samir");
      assert.match(nour.cookieHeader, /HttpOnly/i);
      assert.match(nour.cookieHeader, /SameSite=Lax/);
      assert.doesNotMatch(nour.cookieHeader, /Secure/i);
      assert.doesNotMatch(nour.cookieHeader, /SameSite=None/);
      assert.equal(nour.cookieHeader.includes(nour.csrfToken), false);
      assert.deepEqual(omar.capabilities, ["cashier"]);
      assert.equal(omar.capabilities.includes("administrator"), false);

      const own = await fetch(`${base}/api/v1/users/${nour.userId}`, {
        headers: { cookie: nour.cookie },
      });
      assert.equal(own.status, 200);
      const ownBody = (await own.json()) as { user: { id: string; locale: string } };
      assert.equal(ownBody.user.id, nour.userId);
      assert.equal(ownBody.user.locale, "ar");

      const other = await fetch(`${base}/api/v1/users/${yael.userId}`, {
        headers: { cookie: nour.cookie },
      });
      const otherText = await other.text();
      assert.equal(other.status, 404);
      assert.equal(otherText.includes(yael.userId), false);
      assert.equal(otherText.includes("yael.fixture@example.com"), false);
      assert.equal(otherText.includes("Yael"), false);

      const account = await fetch(`${base}/api/v1/account?userId=${yael.userId}`, {
        headers: { cookie: nour.cookie },
      });
      const accountBody = (await account.json()) as { user: { id: string } };
      assert.equal(account.status, 200);
      assert.equal(accountBody.user.id, nour.userId);

      const omarNorth = await fetch(`${base}/api/v1/businesses/fixture-business-north/staff`, {
        headers: { cookie: omar.cookie },
      });
      assert.equal(omarNorth.status, 200);
      assert.deepEqual(await omarNorth.json(), {
        businessId: "fixture-business-north",
        role: "cashier",
      });
      const omarSouth = await fetch(`${base}/api/v1/businesses/fixture-business-south/staff`, {
        headers: { cookie: omar.cookie },
      });
      const omarSouthText = await omarSouth.text();
      assert.equal(omarSouth.status, 404);
      assert.equal(omarSouthText.includes("South Fixture"), false);
      assert.equal(omarSouthText.includes("North Fixture"), false);
      assert.equal(omarSouthText.includes("samir.fixture@example.com"), false);

      const nourNorth = await fetch(`${base}/api/v1/businesses/fixture-business-north/staff`, {
        headers: { cookie: nour.cookie },
      });
      assert.equal(nourNorth.status, 404);

      const samirNorth = await fetch(`${base}/api/v1/businesses/fixture-business-north/staff`, {
        headers: { cookie: samir.cookie },
      });
      assert.deepEqual(await samirNorth.json(), {
        businessId: "fixture-business-north",
        role: "business_owner",
      });
      const samirSouth = await fetch(`${base}/api/v1/businesses/fixture-business-south/staff`, {
        headers: { cookie: samir.cookie },
      });
      assert.deepEqual(await samirSouth.json(), {
        businessId: "fixture-business-south",
        role: "cashier",
      });

      const cashierInvite = await postStaff(base, "fixture-business-north", omar, {
        role: "business_owner",
      });
      assert.equal(cashierInvite.status, 403);
      assert.equal(cashierInvite.body.code, "not_allowed");
      const managerInvite = await postStaff(base, "fixture-business-north", lina, {
        role: "administrator",
      });
      assert.equal(managerInvite.status, 403);
      assert.equal(managerInvite.body.code, "not_allowed");
      const ownerOnSouth = await postStaff(base, "fixture-business-south", samir, {
        role: "business_owner",
      });
      assert.equal(ownerOnSouth.status, 403);
      assert.equal(ownerOnSouth.body.code, "not_allowed");
      const ownerOnNorth = await postStaff(base, "fixture-business-north", samir, {
        role: "administrator",
      });
      assert.equal(ownerOnNorth.status, 403);
      assert.equal(ownerOnNorth.body.code, "not_in_this_build");
      const customerOnNorth = await postStaff(base, "fixture-business-north", nour, {});
      assert.equal(customerOnNorth.status, 404);

      const missingOrigin = await fetch(`${base}/api/v1/businesses/fixture-business-north/staff`, {
        method: "POST",
        headers: { cookie: samir.cookie, "x-csrf-token": samir.csrfToken },
      });
      assert.equal(missingOrigin.status, 403);
      assert.equal(((await missingOrigin.json()) as { code: string }).code, "origin_rejected");
      const wrongOrigin = await fetch(`${base}/api/v1/businesses/fixture-business-north/staff`, {
        method: "POST",
        headers: {
          cookie: samir.cookie,
          origin: "https://evil.example",
          referer: ORIGIN,
          "x-csrf-token": samir.csrfToken,
        },
      });
      assert.equal(wrongOrigin.status, 403);
      assert.equal(((await wrongOrigin.json()) as { code: string }).code, "origin_rejected");
      const badCsrf = await fetch(`${base}/api/v1/businesses/fixture-business-north/staff`, {
        method: "POST",
        headers: { cookie: samir.cookie, origin: ORIGIN, "x-csrf-token": "not-the-token" },
      });
      assert.equal(badCsrf.status, 403);
      assert.equal(((await badCsrf.json()) as { code: string }).code, "csrf_failed");

      for (const session of [nour, omar, samir]) {
        const admin = await fetch(`${base}/api/v1/admin/assurance`, {
          headers: { cookie: session.cookie },
        });
        const adminText = await admin.text();
        assert.equal(admin.status, 403);
        assert.equal(adminText.includes("assured"), false);
      }
      const bearer = await fetch(`${base}/api/v1/account`, {
        headers: { authorization: `Bearer ${nour.token}` },
      });
      assert.equal(bearer.status, 401);

      const blockedLogout = await fetch(`${base}/api/v1/auth/logout`, {
        method: "POST",
        headers: { cookie: yael.cookie, origin: ORIGIN },
      });
      assert.equal(blockedLogout.status, 403);
      const yaelStill = await fetch(`${base}/api/v1/session`, {
        headers: { cookie: yael.cookie },
      });
      assert.equal(yaelStill.status, 200);
      const logout = await fetch(`${base}/api/v1/auth/logout`, {
        method: "POST",
        headers: {
          cookie: yael.cookie,
          origin: ORIGIN,
          "x-csrf-token": yael.csrfToken,
        },
      });
      assert.equal(logout.status, 204);
      const yaelAfter = await fetch(`${base}/api/v1/session`, {
        headers: { cookie: yael.cookie },
      });
      assert.equal(yaelAfter.status, 401);

      await migratePool.query(
        `INSERT INTO app.rate_buckets (bucket_key, window_started_at, hits)
         VALUES ($1, now(), $2)
         ON CONFLICT (bucket_key) DO UPDATE
         SET hits = $2, window_started_at = now()`,
        [`access:127.0.0.1`, ACCESS_RATE_LIMIT],
      );
      const limited = await fetch(`${base}/api/v1/account`);
      const limitedText = await limited.text();
      assert.equal(limited.status, 429);
      assert.equal(limitedText.includes("nour.fixture@example.com"), false);
      assert.match(limitedText, /rate_limited/);
    } finally {
      server.close();
      await clearBuckets(migratePool);
      await migratePool.end();
      await runtime.end();
    }
  },
);

type OpenedSession = {
  token: string;
  cookie: string;
  cookieHeader: string;
  csrfToken: string;
  userId: string;
  capabilities: string[];
};

async function openSession(base: string, profileId: string): Promise<OpenedSession> {
  const response = await fetch(`${base}/api/v1/auth/local/session`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: ORIGIN },
    body: JSON.stringify({ profileId }),
  });
  assert.equal(response.status, 201);
  const cookieHeader = response.headers.get("set-cookie") ?? "";
  const token = /perkly_session=([^;]+)/.exec(cookieHeader)?.[1];
  assert.ok(token);
  const body = (await response.json()) as {
    user: { id: string };
    capabilities: string[];
    csrfToken: string;
  };
  return {
    token,
    cookie: `perkly_session=${token}`,
    cookieHeader,
    csrfToken: body.csrfToken,
    userId: body.user.id,
    capabilities: body.capabilities,
  };
}

async function postStaff(
  base: string,
  businessId: string,
  session: OpenedSession,
  payload: Record<string, string>,
): Promise<{ status: number; body: { code: string } }> {
  const response = await fetch(`${base}/api/v1/businesses/${businessId}/staff`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: session.cookie,
      origin: ORIGIN,
      "x-csrf-token": session.csrfToken,
    },
    body: JSON.stringify(payload),
  });
  return {
    status: response.status,
    body: (await response.json()) as { code: string },
  };
}

async function clearBuckets(pool: pg.Pool): Promise<void> {
  await pool.query(
    "DELETE FROM app.rate_buckets WHERE bucket_key IN ('access:127.0.0.1', 'auth:127.0.0.1')",
  );
}
