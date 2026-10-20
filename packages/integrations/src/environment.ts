import { FIXTURE_PROFILES } from "./fixture-profiles.ts";

export class EnvironmentConfigError extends Error {
  readonly code = "environment_config";

  constructor(message: string) {
    super(message);
    this.name = "EnvironmentConfigError";
  }
}

export type AppMode = "local" | "staging" | "production";

export type AdapterSelection = {
  identity: "local-fixtures" | "cognito";
  email: "outbox" | "ses";
  search: "fixtures" | "filters" | "bedrock";
  images: "local" | "s3";
  payment: "disabled";
};

export type CognitoPoolName = "customer" | "admin";

export type CognitoPoolSettings = {
  poolId: string;
  clientId: string;
  issuer: string;
  hostedUi: string;
};

export type CognitoSettings = {
  customer: CognitoPoolSettings;
  admin: CognitoPoolSettings;
  redirectUri: string;
};

export type AppConfig = {
  mode: AppMode;
  host: string;
  port: number;
  origin: string;
  adapters: AdapterSelection;
  cognito?: CognitoSettings;
};

export type PublicConfigSummary = {
  mode: AppMode;
  origin: string;
  adapters: AdapterSelection;
};

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const HOSTED_DATABASE_MARKERS = ["localhost", "127.0.0.1", "[::1]"];

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const mode = readMode(env);
  const host = read(env, "HOST") ?? (mode === "local" ? "127.0.0.1" : "");
  if (host === "") {
    throw new EnvironmentConfigError("Refused: hosted mode must set HOST.");
  }
  const port = readPort(read(env, "PORT"));
  const origin = read(env, "APP_ORIGIN") ?? (mode === "local" ? "http://127.0.0.1:5173" : "");
  if (origin === "") {
    throw new EnvironmentConfigError("Refused: hosted mode must set APP_ORIGIN.");
  }

  const adapters = selectAdapters(env, mode, host);
  if (mode === "local") {
    assertLocalOrigin(origin);
    assertLocalDatabaseUrl(read(env, "DATABASE_URL"));
  } else {
    assertHostedOrigin(origin);
    assertHostedDatabaseUrl(read(env, "DATABASE_URL"));
  }

  const cognito = adapters.identity === "cognito" ? readCognitoSettings(env, origin) : undefined;
  return cognito === undefined
    ? { mode, host, port, origin, adapters }
    : { mode, host, port, origin, adapters, cognito };
}

export function publicConfigSummary(config: AppConfig): PublicConfigSummary {
  return {
    mode: config.mode,
    origin: config.origin,
    adapters: config.adapters,
  };
}

export function localFixtureCount(): number {
  return FIXTURE_PROFILES.length;
}

function selectAdapters(env: NodeJS.ProcessEnv, mode: AppMode, host: string): AdapterSelection {
  const identity = read(env, "AUTH_PROVIDER");
  const email = read(env, "EMAIL_PROVIDER");
  const search = read(env, "SEARCH_PROVIDER");
  const images = read(env, "IMAGE_PROVIDER");
  const payment = read(env, "PAYMENT_PROVIDER");
  const paymentEnv = read(env, "PAYMENT_ENV");

  if (mode === "staging" && paymentEnv === "live") {
    throw new EnvironmentConfigError(
      "Refused: staging cannot use a live payment environment. Membership billing is not in this build.",
    );
  }

  return {
    identity: selectIdentity(mode, host, identity),
    email: selectEmail(mode, email),
    search: selectSearch(mode, search),
    images: selectImages(mode, images),
    payment: selectPayment(mode, payment, paymentEnv),
  };
}

function readCognitoSettings(env: NodeJS.ProcessEnv, appOrigin: string): CognitoSettings {
  // Store the issuer and hosted UI only. Startup must not contact them.
  // A passing config is not a hosted Cognito deployment.
  const customer = readPool(env, "CUSTOMER");
  const admin = readPool(env, "ADMIN");
  const redirectUri = read(env, "COGNITO_REDIRECT_URI");
  if (redirectUri === undefined) {
    throw new EnvironmentConfigError("Refused: Cognito requires COGNITO_REDIRECT_URI.");
  }
  const redirect = parseUrl(redirectUri, "COGNITO_REDIRECT_URI");
  const origin = parseUrl(appOrigin, "APP_ORIGIN");
  if (redirect.origin !== origin.origin) {
    throw new EnvironmentConfigError("Refused: COGNITO_REDIRECT_URI must use APP_ORIGIN.");
  }
  if (
    customer.issuer === admin.issuer ||
    customer.clientId === admin.clientId ||
    customer.poolId === admin.poolId
  ) {
    throw new EnvironmentConfigError(
      "Refused: the customer and admin Cognito pools must be separate.",
    );
  }
  return { customer, admin, redirectUri };
}

function readPool(env: NodeJS.ProcessEnv, name: "CUSTOMER" | "ADMIN"): CognitoPoolSettings {
  const poolId = read(env, `COGNITO_${name}_POOL_ID`);
  const clientId = read(env, `COGNITO_${name}_CLIENT_ID`);
  const issuer = read(env, `COGNITO_${name}_ISSUER`);
  const hostedUi = read(env, `COGNITO_${name}_HOSTED_UI`);
  if (
    poolId === undefined ||
    clientId === undefined ||
    issuer === undefined ||
    hostedUi === undefined
  ) {
    throw new EnvironmentConfigError(
      `Refused: Cognito ${name.toLowerCase()} pool settings are incomplete. This is not a hosted deployment.`,
    );
  }
  assertIssuer(issuer, `COGNITO_${name}_ISSUER`);
  assertIssuer(hostedUi, `COGNITO_${name}_HOSTED_UI`);
  return {
    poolId,
    clientId,
    issuer: issuer.replace(/\/$/, ""),
    hostedUi: hostedUi.replace(/\/$/, ""),
  };
}

function assertIssuer(value: string, label: string): void {
  const url = parseUrl(value, label);
  const loopback = LOOPBACK_HOSTS.has(url.hostname.toLowerCase());
  if (loopback && url.protocol === "http:") {
    return;
  }
  if (url.protocol !== "https:") {
    throw new EnvironmentConfigError(
      `Refused: ${label} must be https. A loopback http issuer is only for a local protocol test.`,
    );
  }
}

function selectIdentity(
  mode: AppMode,
  host: string,
  value: string | undefined,
): AdapterSelection["identity"] {
  if (mode === "local") {
    if (value === undefined || value === "local" || value === "local-fixtures") {
      if (!LOOPBACK_HOSTS.has(host.toLowerCase())) {
        throw new EnvironmentConfigError(
          "Refused: the local fixture identity adapter is only allowed on a loopback listener.",
        );
      }
      return "local-fixtures";
    }
    throw new EnvironmentConfigError(
      `Refused: local mode uses fictional profiles. AUTH_PROVIDER "${value}" is not available without AWS.`,
    );
  }
  if (value === undefined) {
    throw new EnvironmentConfigError("Refused: hosted mode must set AUTH_PROVIDER=cognito.");
  }
  if (value === "local" || value === "local-fixtures" || value === "demo" || value === "fixtures") {
    throw new EnvironmentConfigError("Refused: hosted mode rejects demo identity.");
  }
  if (value !== "cognito") {
    throw new EnvironmentConfigError(
      `Refused: AUTH_PROVIDER "${value}" is not a hosted identity adapter.`,
    );
  }
  return "cognito";
}

function selectEmail(mode: AppMode, value: string | undefined): AdapterSelection["email"] {
  if (mode === "local") {
    if (value === undefined || value === "outbox") {
      return "outbox";
    }
    throw new EnvironmentConfigError(
      `Refused: local mode uses the email outbox. EMAIL_PROVIDER "${value}" is not available without AWS.`,
    );
  }
  if (value === undefined) {
    throw new EnvironmentConfigError("Refused: hosted mode must set EMAIL_PROVIDER=ses.");
  }
  if (value === "outbox" || value === "local" || value === "demo") {
    throw new EnvironmentConfigError("Refused: hosted mode rejects the local email outbox.");
  }
  if (value !== "ses") {
    throw new EnvironmentConfigError(
      `Refused: EMAIL_PROVIDER "${value}" is not a hosted email adapter.`,
    );
  }
  return "ses";
}

function selectSearch(mode: AppMode, value: string | undefined): AdapterSelection["search"] {
  if (mode === "local") {
    if (value === undefined || value === "fixtures") {
      return "fixtures";
    }
    if (value === "filters") {
      return "filters";
    }
    throw new EnvironmentConfigError(
      `Refused: local search uses fixtures or ordinary filters. SEARCH_PROVIDER "${value}" is not available without AWS.`,
    );
  }
  if (value === undefined) {
    throw new EnvironmentConfigError(
      "Refused: hosted mode must set SEARCH_PROVIDER to filters or bedrock.",
    );
  }
  if (value === "fixtures" || value === "demo" || value === "local") {
    throw new EnvironmentConfigError("Refused: hosted mode rejects demo search.");
  }
  if (value !== "filters" && value !== "bedrock") {
    throw new EnvironmentConfigError(
      `Refused: SEARCH_PROVIDER "${value}" is not a hosted search adapter.`,
    );
  }
  return value;
}

function selectImages(mode: AppMode, value: string | undefined): AdapterSelection["images"] {
  if (mode === "local") {
    if (value === undefined || value === "local") {
      return "local";
    }
    throw new EnvironmentConfigError(
      `Refused: local images stay on disk. IMAGE_PROVIDER "${value}" is not available without AWS.`,
    );
  }
  if (value === undefined) {
    throw new EnvironmentConfigError("Refused: hosted mode must set IMAGE_PROVIDER=s3.");
  }
  if (value === "local" || value === "demo") {
    throw new EnvironmentConfigError("Refused: hosted mode rejects the local image adapter.");
  }
  if (value !== "s3") {
    throw new EnvironmentConfigError(
      `Refused: IMAGE_PROVIDER "${value}" is not a hosted image adapter.`,
    );
  }
  return "s3";
}

function selectPayment(
  mode: AppMode,
  value: string | undefined,
  paymentEnv: string | undefined,
): "disabled" {
  if (paymentEnv !== undefined && paymentEnv !== "disabled") {
    throw new EnvironmentConfigError(
      "Refused: membership billing is not in this build, so PAYMENT_ENV cannot select a live or sandbox charge.",
    );
  }
  if (value === undefined || value === "disabled") {
    return "disabled";
  }
  if (mode !== "local" && (value === "simulator" || value === "demo" || value === "local")) {
    throw new EnvironmentConfigError("Refused: hosted mode rejects simulator payments.");
  }
  throw new EnvironmentConfigError(
    `Refused: PAYMENT_PROVIDER "${value}" is not available. Membership billing is not in this build, and Perkly does not charge a merchant sale.`,
  );
}

function assertLocalOrigin(origin: string): void {
  const url = parseUrl(origin, "APP_ORIGIN");
  if (url.protocol !== "http:") {
    throw new EnvironmentConfigError("Refused: local APP_ORIGIN must be http on loopback.");
  }
  if (!LOOPBACK_HOSTS.has(url.hostname.toLowerCase())) {
    throw new EnvironmentConfigError("Refused: local APP_ORIGIN must use a loopback host.");
  }
}

function assertHostedOrigin(origin: string): void {
  const url = parseUrl(origin, "APP_ORIGIN");
  if (url.protocol !== "https:") {
    throw new EnvironmentConfigError("Refused: hosted APP_ORIGIN must be https.");
  }
  if (LOOPBACK_HOSTS.has(url.hostname.toLowerCase())) {
    throw new EnvironmentConfigError("Refused: hosted APP_ORIGIN cannot be loopback.");
  }
}

function assertLocalDatabaseUrl(value: string | undefined): void {
  if (value === undefined) {
    return;
  }
  const url = parseUrl(value, "DATABASE_URL");
  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new EnvironmentConfigError("Refused: DATABASE_URL must be a postgres URL.");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!LOOPBACK_HOSTS.has(host) || hostedMarker(value)) {
    throw new EnvironmentConfigError(
      "Refused: local mode cannot use a hosted database. The local app runs without AWS.",
    );
  }
  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (database !== "perkly") {
    throw new EnvironmentConfigError(
      'Refused: the local application database must be "perkly". The disposable test database is not the app database.',
    );
  }
}

function assertHostedDatabaseUrl(value: string | undefined): void {
  if (value === undefined) {
    throw new EnvironmentConfigError("Refused: hosted mode must set DATABASE_URL.");
  }
  const url = parseUrl(value, "DATABASE_URL");
  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new EnvironmentConfigError("Refused: DATABASE_URL must be a postgres URL.");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (
    LOOPBACK_HOSTS.has(host) ||
    HOSTED_DATABASE_MARKERS.some((marker) => value.includes(marker))
  ) {
    throw new EnvironmentConfigError("Refused: hosted mode cannot use a loopback database.");
  }
  if (url.searchParams.get("sslmode") !== "verify-full") {
    throw new EnvironmentConfigError("Refused: hosted DATABASE_URL must set sslmode=verify-full.");
  }
}

function hostedMarker(value: string): boolean {
  const lowered = value.toLowerCase();
  return (
    lowered.includes("amazonaws.com") ||
    lowered.includes("neon.tech") ||
    lowered.includes("supabase.co") ||
    lowered.includes("azure.com")
  );
}

function readMode(env: NodeJS.ProcessEnv): AppMode {
  const value = read(env, "APP_MODE") ?? "local";
  if (value === "local" || value === "staging" || value === "production") {
    return value;
  }
  throw new EnvironmentConfigError(
    `Refused: APP_MODE "${value}" is not local, staging, or production.`,
  );
}

function readPort(value: string | undefined): number {
  if (value === undefined) {
    return 3001;
  }
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new EnvironmentConfigError("Refused: PORT must be an integer from 1 to 65535.");
  }
  return port;
}

function read(env: NodeJS.ProcessEnv, key: string): string | undefined {
  const value = env[key];
  if (value === undefined || value.trim() === "") {
    return undefined;
  }
  return value.trim();
}

function parseUrl(value: string, label: string): URL {
  try {
    return new URL(value);
  } catch {
    throw new EnvironmentConfigError(`Refused: ${label} could not be parsed.`);
  }
}
