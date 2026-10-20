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

export const FIXTURE_BUSINESSES = [
  { id: "fixture-business-north", displayName: "North Fixture" },
  { id: "fixture-business-south", displayName: "South Fixture" },
] as const;

export const FIXTURE_MEMBERSHIPS = [
  {
    id: "fixture-membership-north-omar",
    businessId: "fixture-business-north",
    profileId: "fixture-cashier-omar",
    role: "cashier",
  },
  {
    id: "fixture-membership-north-lina",
    businessId: "fixture-business-north",
    profileId: "fixture-manager-lina",
    role: "manager",
  },
  {
    id: "fixture-membership-north-samir",
    businessId: "fixture-business-north",
    profileId: "fixture-owner-samir",
    role: "business_owner",
  },
  {
    id: "fixture-membership-south-samir",
    businessId: "fixture-business-south",
    profileId: "fixture-owner-samir",
    role: "cashier",
  },
] as const;

export const FIXTURE_OUTBOX_MESSAGE = {
  id: "fixture-outbox-seed",
  profileId: "fixture-customer-nour",
  toAddress: "nour.fixture@example.com",
  subject: "Local outbox only",
  body: "This fictional message was stored in the local outbox. It was not sent.",
} as const;
