export const LOCALE_CODES = ["en", "he", "ar"] as const;

export type LocaleCode = (typeof LOCALE_CODES)[number];

export type TextDirection = "ltr" | "rtl";

const LOCALE_SET: ReadonlySet<string> = new Set(LOCALE_CODES);

export function isLocaleCode(value: string): value is LocaleCode {
  return LOCALE_SET.has(value);
}

export function textDirection(locale: LocaleCode): TextDirection {
  if (locale === "he" || locale === "ar") {
    return "rtl";
  }
  return "ltr";
}

function primaryLanguage(tag: string): string {
  const base = tag.toLowerCase().split("-")[0] ?? "";
  if (base === "iw") {
    return "he";
  }
  return base;
}

export function resolveLocale(
  stored: string | null,
  browserLanguages: readonly string[],
): LocaleCode {
  if (stored !== null && isLocaleCode(stored)) {
    return stored;
  }
  for (const language of browserLanguages) {
    const primary = primaryLanguage(language);
    if (isLocaleCode(primary)) {
      return primary;
    }
  }
  return "en";
}

export const serviceDescriptor = {
  name: "perkly",
  apiVersion: "v1",
  database: "not_connected",
} as const;

export type ServiceDescriptor = typeof serviceDescriptor;
