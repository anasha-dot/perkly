export { SEARCH_FIXTURES } from "./fixtures.ts";
export type { SearchFixture } from "./fixtures.ts";

export const searchAdapters = ["fixtures", "filters", "bedrock"] as const;

export type SearchAdapterName = (typeof searchAdapters)[number];
