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

async function HomePage({ params }: { params: LocaleParams }) {
  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale);

  const announcement = (
    <CloudAnnouncement
      title={dict.hero.teaser_title}
      target="_blank"
      rel="noopener noreferrer"
      href="https://linktr.ee/neiist"
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
