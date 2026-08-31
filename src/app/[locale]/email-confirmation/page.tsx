import Link from "next/link";
import styles from "@/styles/pages/EmailConfirmation.module.css";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale, LocaleParams, locales } from "@/i18n/i18n-config";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function EmailConfirmationSuccess({ params }: { params: LocaleParams }) {
  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale).email_confirmation;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>{dict.title}</h2>
        <div className={styles.icon}>✔️</div>
        <p className={styles.text}>
          {dict.message_p1}
          <br />
          {dict.message_p2}{" "}
          <Link href={`/${locale}/profile`} className={styles.link}>
            {dict.profile_link}
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
