import { cookies } from "next/headers";

export const locales = ['en', 'pt'];
export type Locale = typeof locales[number];
export const defaultLocale = 'en';

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get('locale')?.value;
  if (value && (locales as readonly string[]).includes(value)) {
    return value as Locale;
  }
  return defaultLocale;
}

export async function getDictonary(locale: Locale) {
    const dictionary = await import(`@locales/${locale}.json`);
    return dictionary.default;
}

export function t(template: string, params?: Record<string, string>): string {
  if (!params) {
    return template;
  }
  return Object.entries(params).reduce(
    (str, [key, value]) => str.replace(`{${key}}`, value),
    template);
  }