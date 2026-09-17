import en from "./locales/en.json";
import ar from "./locales/ar.json";
import fr from "./locales/fr.json";

export const LOCALES = ["en", "ar", "fr"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

const dictionaries: Record<Locale, Record<string, string>> = { en, ar, fr };

export const DIR: Record<Locale, "ltr" | "rtl"> = {
  en: "ltr",
  ar: "rtl",
  fr: "ltr",
};

export const LOCALE_LABEL: Record<Locale, string> = {
  en: "EN",
  ar: "ع",
  fr: "FR",
};

/** Base path for a locale's routes: "" for the default (en) locale, "/ar" / "/fr" otherwise. */
export function localeBase(locale: Locale): string {
  return locale === DEFAULT_LOCALE ? "" : `/${locale}`;
}

/** Build a locale-prefixed path, e.g. path("/trails/", "ar") -> "/ar/trails/". */
export function path(route: string, locale: Locale): string {
  return `${localeBase(locale)}${route}`;
}

/**
 * Translate `key` for `locale`, falling back to English when the string hasn't been
 * translated yet (per brief/12_translation_pack.md: "missing/[REVIEW] -> fall back to
 * English, never ship broken AR/FR"). Falls back to the raw key as a last resort so
 * missing strings are obvious in development rather than silently blank.
 */
export function useTranslations(locale: Locale) {
  return function t(key: string): string {
    return dictionaries[locale][key] ?? dictionaries[DEFAULT_LOCALE][key] ?? key;
  };
}
