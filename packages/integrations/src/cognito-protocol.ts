import {
  createHash,
  createPublicKey,
  createVerify,
  randomBytes,
  type JsonWebKey,
} from "node:crypto";
import type { CognitoPoolName, CognitoPoolSettings } from "./environment.ts";

export class CognitoProtocolError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "CognitoProtocolError";
    this.code = code;
  }
}

export type PkcePair = {
  verifier: string;
  challenge: string;
};

export function createPkce(): PkcePair {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function authorizeUrl(
  pool: CognitoPoolSettings,
  input: { redirectUri: string; state: string; nonce: string; challenge: string },
): string {
  const url = new URL(`${pool.hostedUi}/oauth2/authorize`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", pool.clientId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("scope", "openid email");
  url.searchParams.set("state", input.state);
  url.searchParams.set("nonce", input.nonce);
  url.searchParams.set("code_challenge", input.challenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

export async function exchangeAuthorizationCode(
  pool: CognitoPoolSettings,
  input: { code: string; redirectUri: string; verifier: string },
  fetchImpl: typeof fetch = fetch,
): Promise<{ idToken: string; refreshToken: string }> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: pool.clientId,
    code: input.code,
    redirect_uri: input.redirectUri,
    code_verifier: input.verifier,
  });
  return readTokenResponse(pool, body, fetchImpl);
}

export async function refreshTokens(
  pool: CognitoPoolSettings,
  refreshToken: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ idToken: string; refreshToken: string }> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: pool.clientId,
    refresh_token: refreshToken,
  });
  const tokens = await readTokenResponse(pool, body, fetchImpl);
  return {
    idToken: tokens.idToken,
    refreshToken: tokens.refreshToken || refreshToken,
  };
}

export async function revokeRefreshToken(
  pool: CognitoPoolSettings,
  refreshToken: string,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const response = await fetchImpl(`${pool.hostedUi}/oauth2/revoke`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token: refreshToken, client_id: pool.clientId }),
  });
  if (!response.ok) {
    throw new CognitoProtocolError(
      "revoke_failed",
      "The identity provider did not revoke the refresh token.",
    );
  }
}

export async function verifyIdToken(
  token: string,
  pool: CognitoPoolSettings,
  input: { nonce?: string; now?: number; poolName: CognitoPoolName },
  fetchImpl: typeof fetch = fetch,
): Promise<VerifiedIdentity> {
  const payload = await verifySignature(token, pool.issuer, fetchImpl);
  return assertVerifiedIdentity(payload, pool, input);
}

export type VerifiedIdentity = {
  subject: string;
  email: string;
  emailVerified: true;
  pool: CognitoPoolName;
  nonce?: string;
};

export function assertVerifiedIdentity(
  payload: Record<string, unknown>,
  pool: CognitoPoolSettings,
  input: { nonce?: string; now?: number; poolName: CognitoPoolName },
): VerifiedIdentity {
  const now = input.now ?? Math.floor(Date.now() / 1000);
  if (payload.iss !== pool.issuer) {
    throw new CognitoProtocolError(
      "issuer_mismatch",
      "The identity token issuer does not match the selected pool.",
    );
  }
  const audience = payload.aud;
  const audiences = Array.isArray(audience) ? audience : [audience];
  if (!audiences.includes(pool.clientId)) {
    throw new CognitoProtocolError(
      "audience_mismatch",
      "The identity token audience does not match the pool client.",
    );
  }
  if (payload.token_use !== "id") {
    throw new CognitoProtocolError("token_use_invalid", "The token is not an identity token.");
  }
  if (typeof payload.exp !== "number" || payload.exp <= now) {
    throw new CognitoProtocolError("token_expired", "The identity token is expired.");
  }
  if (input.nonce !== undefined && payload.nonce !== input.nonce) {
    throw new CognitoProtocolError(
      "nonce_mismatch",
      "The identity token nonce does not match this login.",
    );
  }
  if (
    payload.email_verified !== true ||
    typeof payload.email !== "string" ||
    payload.email === ""
  ) {
    throw new CognitoProtocolError(
      "email_unverified",
      "The identity token does not have a verified email.",
    );
  }
  if (typeof payload.sub !== "string" || payload.sub === "") {
    throw new CognitoProtocolError("subject_missing", "The identity token has no subject.");
  }
  const nonce =
    typeof payload.nonce === "string" && payload.nonce !== "" ? payload.nonce : undefined;
  return {
    subject: payload.sub,
    email: payload.email,
    emailVerified: true,
    pool: input.poolName,
    ...(nonce === undefined ? {} : { nonce }),
  };
}

async function verifySignature(
  token: string,
  issuer: string,
  fetchImpl: typeof fetch,
): Promise<Record<string, unknown>> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new CognitoProtocolError("token_malformed", "The identity token is malformed.");
  }
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  if (
    encodedHeader === undefined ||
    encodedPayload === undefined ||
    encodedSignature === undefined
  ) {
    throw new CognitoProtocolError("token_malformed", "The identity token is malformed.");
  }
  const header = parseJson(encodedHeader) as { alg?: string; kid?: string };
  if (header.alg !== "RS256" || typeof header.kid !== "string") {
    throw new CognitoProtocolError("token_malformed", "The identity token must use RS256.");
  }
  const jwk = await fetchJwk(issuer, header.kid, fetchImpl);
  const verifier = createVerify("RSA-SHA256");
  verifier.update(`${encodedHeader}.${encodedPayload}`);
  const valid = verifier.verify(
    createPublicKey({ key: jwk, format: "jwk" }),
    Buffer.from(encodedSignature, "base64url"),
  );
  if (!valid) {
    throw new CognitoProtocolError("signature_invalid", "The identity token signature is invalid.");
  }
  const payload = parseJson(encodedPayload);
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    throw new CognitoProtocolError("token_malformed", "The identity token payload is invalid.");
  }
  return payload as Record<string, unknown>;
}

async function fetchJwk(issuer: string, kid: string, fetchImpl: typeof fetch): Promise<JsonWebKey> {
  const response = await fetchImpl(`${issuer}/.well-known/jwks.json`);
  if (!response.ok) {
    throw new CognitoProtocolError(
      "jwks_unavailable",
      "The identity provider key set could not be read.",
    );
  }
  const body = (await response.json()) as { keys?: JsonWebKey[] };
  const key = body.keys?.find((item) => item.kid === kid);
  if (key === undefined) {
    throw new CognitoProtocolError(
      "jwks_unavailable",
      "The identity token key was not in the provider key set.",
    );
  }
  return key;
}

async function readTokenResponse(
  pool: CognitoPoolSettings,
  body: URLSearchParams,
  fetchImpl: typeof fetch,
): Promise<{ idToken: string; refreshToken: string }> {
  const response = await fetchImpl(`${pool.hostedUi}/oauth2/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
    id_token?: string;
    refresh_token?: string;
  };
  if (!response.ok || typeof payload.id_token !== "string") {
    throw new CognitoProtocolError(
      payload.error ?? "token_rejected",
      "The identity provider rejected the token request.",
    );
  }
  return { idToken: payload.id_token, refreshToken: payload.refresh_token ?? "" };
}

function parseJson(encoded: string): unknown {
  try {
    return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    throw new CognitoProtocolError("token_malformed", "The identity token could not be parsed.");
  }
}
