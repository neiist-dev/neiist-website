import { NextRequest, NextResponse } from "next/server";
import { locales, defaultLocale } from "@/lib/i18n-config";

function detectBestLocale(acceptLanguage: string | null): string {
  if (!acceptLanguage) return defaultLocale;

  const parsedLocales = acceptLanguage
    .split(",")
    .map((l) => {
      const [locale, q] = l.split(";q=");
      return { locale: locale.trim().split("-")[0], q: q ? parseFloat(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  const match = parsedLocales.find((l) => (locales as readonly string[]).includes(l.locale));
  return match?.locale ?? defaultLocale;
}

export function ensureLocaleCookie(req: NextRequest, response: NextResponse): void {
  const cookieLocale = req.cookies.get("locale")?.value;

  if (cookieLocale && (locales as readonly string[]).includes(cookieLocale)) {
    return;
  }

  const bestLocale = detectBestLocale(req.headers.get("accept-language"));
  response.cookies.set("locale", bestLocale, { path: "/", maxAge: 31536000 });
}