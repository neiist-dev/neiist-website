import Hero from "@/components/homepage/Hero";
import Activities from "@/components/homepage/Activities";
import Partnerships from "@/components/homepage/Partnerships";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale, LocaleParams } from "@/i18n/i18n-config";

async function HomePage({ params }: { params: LocaleParams }) {
  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale);

  return (
    <>
      <Hero dict={dict.hero} />
      <Activities dict={dict.activities} />
      <Partnerships dict={dict.partnerships} />
    </>
  );
}

export default HomePage;
