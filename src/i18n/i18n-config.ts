import { NextRequest, NextResponse } from "next/server";

export const locales = ["pt", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "pt";

export type LocaleParams = Promise<{ locale: string }>;

export const localeNames: Record<Locale, string> = {
  pt: "Português",
  en: "English",
};

export const localeShortNames: Record<Locale, string> = {
  pt: "PT",
  en: "EN",
};

export function isValidLocale(locale?: string | null): locale is Locale {
  return typeof locale === "string" && locales.includes(locale as Locale);
}

export interface LocaleRouteInfo {
  locale: Locale;
  routePath: string;
  redirectResponse?: NextResponse;
}

export function resolveLocaleRoute(req: NextRequest): LocaleRouteInfo {
  const path = req.nextUrl.pathname;
  const segments = path.split("/");
  const firstSegment = segments[1];

  if (!isValidLocale(firstSegment)) {
    const cookieLocale = req.cookies.get("locale")?.value;
    const locale: Locale = isValidLocale(cookieLocale) ? cookieLocale : defaultLocale;
    const redirectUrl = new URL(
      `/${locale}${path === "/" ? "" : path}${req.nextUrl.search}`,
      req.url
    );
    return {
      locale,
      routePath: path,
      redirectResponse: NextResponse.redirect(redirectUrl),
    };
  }

  return {
    locale: firstSegment,
    routePath: "/" + segments.slice(2).join("/"),
  };
}
