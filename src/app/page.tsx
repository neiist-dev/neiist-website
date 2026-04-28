import Hero from "@/components/homepage/Hero";
import Activities from "@/components/homepage/Activities";
import Partnerships from "@/components/homepage/Partnerships";
import { getLocale, getDictionary } from "@/lib/i18n";

const HomePage = async () => {
  const locale = await getLocale();
  const dict = await getDictionary(locale);

  return (
    <>
      <Hero dict={dict.hero}/>
      <Activities dict={dict.activities} />
      <Partnerships dict={dict.partnerships} />
    </>
  );
};

export default HomePage;