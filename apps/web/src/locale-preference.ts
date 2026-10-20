import { resolveLocale, type LocaleCode } from "@perkly/contracts";

const STORAGE_KEY = "perkly.locale";

export function readInitialLocale(): LocaleCode {
  return resolveLocale(readStoredLocale(), browserLanguages());
}

export function storeLocale(locale: LocaleCode): void {
  localStorage.setItem(STORAGE_KEY, locale);
}

function readStoredLocale(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function browserLanguages(): readonly string[] {
  if (navigator.languages.length > 0) {
    return navigator.languages;
  }
  return [navigator.language];
}
