import { Locale } from "@/i18n/i18n-config";
import pt from "@/i18n/locales/pt.json";
import en from "@/i18n/locales/en.json";

export type Dictionary = typeof pt;

const dictionaries: Record<Locale, Dictionary> = {
  pt,
  en,
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.pt;
}

export type PathInto<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}` | `${K}.${PathInto<T[K]>}`
          : `${K}`
        : never;
    }[keyof T]
  : never;

export type PathValue<T, P extends string> = P extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? PathValue<T[Key], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;

export function getNestedValue<T extends object, P extends string>(
  obj: T,
  path: P
): PathValue<T, P> {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined as PathValue<T, P>;
    }
  }
  return current as PathValue<T, P>;
}
