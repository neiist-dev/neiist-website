import { FaLock } from "react-icons/fa";
import styles from "@/styles/pages/Unauthorized.module.css";
import Link from "next/link";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale, LocaleParams, locales } from "@/i18n/i18n-config";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function UnauthorizedPage({ params }: { params: LocaleParams }) {
  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale).unauthorized;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <FaLock className={styles.icon} />
        <h1 className={styles.title}>{dict.title}</h1>
        <p className={styles.message}>{dict.message}</p>
        <Link href={`/${locale}`} className={styles.button}>
          {dict.home_button}
        </Link>
        <p className={styles.helpText}>
          {dict.help_text}
          <br />
          <a href="mailto:neiist@tecnico.ulisboa.pt" className={styles.link}>
            neiist@tecnico.ulisboa.pt
          </a>
        </p>
      </div>
    </div>
  );
}
