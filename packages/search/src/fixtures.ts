import type { LocaleCode } from "@perkly/contracts";

export type SearchFixture = {
  id: string;
  locale: LocaleCode;
  query: string;
  note: string;
};

export const SEARCH_FIXTURES: readonly SearchFixture[] = [
  {
    id: "fixture-search-en",
    locale: "en",
    query: "family dinner near me",
    note: "Local fixture. No business is stored or invented.",
  },
  {
    id: "fixture-search-he",
    locale: "he",
    query: "ארוחת ערב משפחתית",
    note: "Local fixture. No business is stored or invented.",
  },
  {
    id: "fixture-search-ar",
    locale: "ar",
    query: "عشاء عائلي",
    note: "Local fixture. No business is stored or invented.",
  },
];
