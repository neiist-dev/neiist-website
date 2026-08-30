import { ReactNode, Suspense } from "react";
import NavBar, { AuthWidget } from "@/components/layout/navbar/NavBar";
import LoginButton from "@/components/layout/navbar/LoginButton";
import Footer from "@/components/layout/Footer";
import Cart from "@/components/shop/Cart";
import { UserProvider } from "@/context/UserContext";
import { ShopProvider } from "@/context/ShopContext";
import { getAuthenticatedUser } from "@/lib/auth";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale, Locale, locales } from "@/i18n/i18n-config";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

async function ServerAuthWidget({ locale }: { locale: Locale }) {
  const [session, dict] = await Promise.all([getAuthenticatedUser(), getDictionary(locale)]);

  return (
    <AuthWidget
      initialUser={session?.user ?? null}
      dict={dict.navbar.menu}
      basePath={`/${locale}`}
    />
  );
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = await params;
  const rawLocale = resolvedParams?.locale;
  const locale: Locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale);

  return (
    <ShopProvider>
      <UserProvider initialUser={null}>
        <NavBar
          dict={dict.navbar}
          basePath={`/${locale}`}
          currentLocale={locale}
          authSlot={
            <Suspense fallback={<LoginButton />}>
              <ServerAuthWidget locale={locale} />
            </Suspense>
          }
        />
        <Cart />
        <main>{children}</main>
        <Footer locale={locale} />
      </UserProvider>
    </ShopProvider>
  );
}
