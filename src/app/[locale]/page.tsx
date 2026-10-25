import type { Metadata } from "next";
import Hero from "@/components/homepage/Hero";
import Activities from "@/components/homepage/Activities";
import Partnerships from "@/components/homepage/Partnerships";
//import SweatsContest from "@/components/homepage/SweatsContest";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale, locales, LocaleParams } from "@/i18n/i18n-config";
import CloudAnnouncement from "@/components/homepage/CloudAnnouncement";

export const instant = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale);

  const mainDesc =
    `${dict.hero.title_prefix} ${dict.hero.title_highlight} ${dict.hero.title_suffix}`.trim();
  const description = dict.hero.teaser_title ? `${mainDesc}. ${dict.hero.teaser_title}.` : mainDesc;

  return {
    description,
    openGraph: {
      description,
    },
    twitter: {
      description,
    },
  };
}

async function HomePage({ params }: { params: LocaleParams }) {
  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale);

  const announcement = (
    <CloudAnnouncement
      title={dict.hero.teaser_title}
      target="_blank"
      rel="noopener noreferrer"
      href={`/${locale}/voting`}
      pulse={true}
    />
  );

  return (
    <>
      <Hero
        dict={dict.hero}
        terminalDict={dict.terminal}
        gameDict={dict.game}
        locale={locale}
        announcement={announcement}
      />
      <Activities dict={dict.activities} />
      <Partnerships dict={dict.partnerships} />
    </>
  );
}

export default HomePage;
