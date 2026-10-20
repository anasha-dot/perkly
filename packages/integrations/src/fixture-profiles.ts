import type { LocaleCode } from "@perkly/contracts";

export const FIXTURE_PROFILE_ROLES = ["customer", "cashier", "manager", "business_owner"] as const;

export type FixtureProfileRole = (typeof FIXTURE_PROFILE_ROLES)[number];

export type FixtureProfile = {
  id: string;
  displayName: string;
  locale: LocaleCode;
  role: FixtureProfileRole;
  email: string;
};

export const FIXTURE_PROFILES: readonly FixtureProfile[] = [
  {
    id: "fixture-customer-nour",
    displayName: "Nour Fixture",
    locale: "ar",
    role: "customer",
    email: "nour.fixture@example.com",
  },
  {
    id: "fixture-customer-yael",
    displayName: "Yael Fixture",
    locale: "he",
    role: "customer",
    email: "yael.fixture@example.com",
  },
  {
    id: "fixture-cashier-omar",
    displayName: "Omar Fixture",
    locale: "en",
    role: "cashier",
    email: "omar.fixture@example.com",
  },
  {
    id: "fixture-manager-lina",
    displayName: "Lina Fixture",
    locale: "he",
    role: "manager",
    email: "lina.fixture@example.com",
  },
  {
    id: "fixture-owner-samir",
    displayName: "Samir Fixture",
    locale: "ar",
    role: "business_owner",
    email: "samir.fixture@example.com",
  },
];

export const FIXTURE_OUTBOX_MESSAGE = {
  id: "fixture-outbox-seed",
  profileId: "fixture-customer-nour",
  toAddress: "nour.fixture@example.com",
  subject: "Local outbox only",
  body: "This fictional message was stored in the local outbox. It was not sent.",
} as const;
