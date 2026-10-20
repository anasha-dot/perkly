import { randomUUID } from "node:crypto";
import type pg from "pg";
import type { CognitoPoolName } from "@perkly/integrations";

export type StoredOAuthFlow = {
  id: string;
  pool: CognitoPoolName;
  nonceHash: string;
  codeVerifier: string;
  redirectUri: string;
};

const FLOW_TTL_MS = 10 * 60 * 1000;

export async function insertOAuthFlow(
  pool: pg.Pool,
  input: {
    poolName: CognitoPoolName;
    stateHash: string;
    nonceHash: string;
    codeVerifierHash: string;
    codeVerifier: string;
    redirectUri: string;
  },
): Promise<void> {
  await pool.query(
    `INSERT INTO app.oauth_flows (
       id, pool, state_hash, nonce_hash, code_verifier_hash, code_verifier, redirect_uri, expires_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      randomUUID(),
      input.poolName,
      input.stateHash,
      input.nonceHash,
      input.codeVerifierHash,
      input.codeVerifier,
      input.redirectUri,
      new Date(Date.now() + FLOW_TTL_MS),
    ],
  );
}

export async function consumeOAuthFlow(
  pool: pg.Pool,
  stateHash: string,
): Promise<StoredOAuthFlow | undefined> {
  const consumed = await pool.query<{
    id: string;
    pool: CognitoPoolName;
    nonce_hash: string;
    code_verifier: string;
    redirect_uri: string;
  }>(
    `WITH target AS (
       SELECT id, pool, nonce_hash, code_verifier, redirect_uri
       FROM app.oauth_flows
       WHERE state_hash = $1
         AND consumed_at IS NULL
         AND expires_at > now()
         AND code_verifier IS NOT NULL
       FOR UPDATE
     )
     UPDATE app.oauth_flows AS flows
     SET consumed_at = now(), code_verifier = NULL
     FROM target
     WHERE flows.id = target.id
     RETURNING target.id, target.pool, target.nonce_hash, target.code_verifier, target.redirect_uri`,
    [stateHash],
  );
  const row = consumed.rows[0];
  if (row === undefined) {
    return undefined;
  }
  return {
    id: row.id,
    pool: row.pool,
    nonceHash: row.nonce_hash,
    codeVerifier: row.code_verifier,
    redirectUri: row.redirect_uri,
  };
}
