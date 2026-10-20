import pg from "pg";
import { loopbackHost } from "./admin.ts";
import { localRoles } from "./local.ts";
import { assertSafeDatabaseTarget } from "./target.ts";

export async function pingRuntimeDatabase(url: string): Promise<"ok" | "unavailable"> {
  let target;
  try {
    target = assertSafeDatabaseTarget(url, "seed-local");
  } catch {
    return "unavailable";
  }
  const client = new pg.Client({
    host: loopbackHost(target.host),
    port: target.port,
    user: localRoles.runtime.user,
    password: localRoles.runtime.password,
    database: target.database,
    connectionTimeoutMillis: 1_000,
  });
  try {
    await client.connect();
    await client.query("SELECT 1");
    return "ok";
  } catch {
    return "unavailable";
  } finally {
    await client.end().catch(() => undefined);
  }
}
