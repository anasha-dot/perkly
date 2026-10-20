export {
  FIXTURE_BUSINESSES,
  FIXTURE_MEMBERSHIPS,
  FIXTURE_OUTBOX_MESSAGE,
  FIXTURE_PROFILES,
} from "./fixture-profiles.ts";
export type { FixtureProfile, FixtureProfileRole } from "./fixture-profiles.ts";
export {
  EnvironmentConfigError,
  loadConfig,
  localFixtureCount,
  publicConfigSummary,
} from "./environment.ts";
export type {
  AdapterSelection,
  AppConfig,
  AppMode,
  CognitoPoolName,
  CognitoPoolSettings,
  CognitoSettings,
  PublicConfigSummary,
} from "./environment.ts";

export {
  CognitoProtocolError,
  assertVerifiedIdentity,
  authorizeUrl,
  createPkce,
  exchangeAuthorizationCode,
  refreshTokens,
  revokeRefreshToken,
  sha256Hex,
  verifyIdToken,
} from "./cognito-protocol.ts";
export type { PkcePair, VerifiedIdentity } from "./cognito-protocol.ts";
export { clientErrorLog, createLogger, redact } from "./log.ts";
export type { LogFields, LogLevel } from "./log.ts";

export const merchantPayment = "outside_perkly" as const;

export const membershipBilling = "not_in_this_build" as const;
