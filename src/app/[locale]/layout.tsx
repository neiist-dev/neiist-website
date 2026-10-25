import { ReactNode, Suspense } from "react";
import type { Metadata } from "next";
import NavBar, { AuthWidget } from "@/components/layout/navbar/NavBar";
import LoginButton from "@/components/layout/navbar/LoginButton";
import Footer from "@/components/layout/Footer";
import Cart from "@/components/shop/Cart";
import { UserProvider } from "@/context/UserContext";
import { ShopProvider } from "@/context/ShopContext";
import { getAuthenticatedUser } from "@/lib/auth";
import { getDictionary, type Dictionary } from "@/i18n/dictionaries";
import {
  defaultLocale,
  isValidLocale,
  locales,
  type Locale,
  type LocaleParams,
} from "@/i18n/i18n-config";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const TITLE = "NEIIST - Núcleo Estudantil de Informática do IST";
const NAME = "NEIIST";

const METADATA: Record<Locale, { description: string; ogLocale: string }> = {
  pt: {
    description: "Núcleo Estudantil de Informática do Instituto Superior Técnico",
    ogLocale: "pt_PT",
  },
  en: {
    description: "Computer Science and Engineering Student Branch at Instituto Superior Técnico",
    ogLocale: "en_US",
  },
};

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const meta = METADATA[locale];

  return {
    metadataBase: new URL("https://neiist.tecnico.ulisboa.pt"),
    title: {
      default: TITLE,
      template: `%s | ${NAME}`,
    },
    description: meta.description,
    alternates: {
      canonical: `/${locale}`,
      languages: {
        pt: "/pt",
        en: "/en",
      },
    },
    openGraph: {
      title: TITLE,
      description: meta.description,
      siteName: NAME,
      locale: meta.ogLocale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: TITLE,
      description: meta.description,
    },
  };
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
  params: LocaleParams;
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
