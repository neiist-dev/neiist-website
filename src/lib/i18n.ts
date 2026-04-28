import { cookies } from "next/headers";
import { locales, Locale, defaultLocale } from "@/lib/i18n-config";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get("locale")?.value;
  if (value && (locales as readonly string[]).includes(value)) {
    return value as Locale;
  }
  return defaultLocale;
}

export async function getDictionary(locale: Locale) {
  const dictionary = await import(`../locales/${locale}.json`, { with: { type: "json" } });
  return dictionary.default;
}

export function t(template: string, params?: Record<string, string>): string {
  if (!params) {
    return template;
  }
  return Object.entries(params).reduce(
    (str, [key, value]) => str.replace(`{${key}}`, value),
    template
  );
}