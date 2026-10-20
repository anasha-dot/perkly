export { FIXTURE_OUTBOX_MESSAGE, FIXTURE_PROFILES } from "./fixture-profiles.ts";
export type { FixtureProfile, FixtureProfileRole } from "./fixture-profiles.ts";
export {
  EnvironmentConfigError,
  loadConfig,
  localFixtureCount,
  publicConfigSummary,
} from "./environment.ts";
export type { AdapterSelection, AppConfig, AppMode, PublicConfigSummary } from "./environment.ts";

export const merchantPayment = "outside_perkly" as const;

export const membershipBilling = "not_in_this_build" as const;
