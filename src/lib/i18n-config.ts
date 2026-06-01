export const locales = ["en", "pt"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale = "pt";

export const localeNames: Record<Locale, string> = {
  en: "English (EN)",
  pt: "Português (PT)",
};