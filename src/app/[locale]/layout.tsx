import { ReactNode, Suspense } from "react";
import NavBar, { AuthWidget } from "@/components/layout/navbar/NavBar";
import LoginButton from "@/components/layout/navbar/LoginButton";
import Footer from "@/components/layout/Footer";
import Cart from "@/components/shop/Cart";
import { UserProvider } from "@/context/UserContext";
import { ShopProvider } from "@/context/ShopContext";
import { getAuthenticatedUser } from "@/lib/auth";
import { getDictionary, type Dictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale, locales } from "@/i18n/i18n-config";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

async function ServerAuthWidget({
  basePath,
  dict,
}: {
  basePath: string;
  dict: Dictionary["navbar"]["menu"];
}) {
  const session = await getAuthenticatedUser();

  return <AuthWidget initialUser={session?.user ?? null} dict={dict} basePath={basePath} />;
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale);
  const basePath = `/${locale}`;

  return (
    <ShopProvider>
      <UserProvider initialUser={null}>
        <NavBar
          dict={dict.navbar}
          basePath={basePath}
          currentLocale={locale}
          authSlot={
            <Suspense fallback={<LoginButton />}>
              <ServerAuthWidget basePath={basePath} dict={dict.navbar.menu} />
            </Suspense>
          }
        />
        <Cart dict={dict.cart} basePath={basePath} />
        <main>{children}</main>
        <Footer dict={dict.footer} basePath={basePath} />
      </UserProvider>
    </ShopProvider>
  );
}
