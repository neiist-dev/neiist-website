"use client";

import { usePathname, useRouter } from "next/navigation";
import { Locale } from "@/i18n/i18n-config";
import styles from "@/styles/components/layout/navbar/LanguageSwitcher.module.css";

export default function LanguageSwitcher({ currentLocale }: { currentLocale: Locale }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === currentLocale) return;

    document.cookie = `locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    router.push(pathname.replace(`/${currentLocale}`, `/${newLocale}`));
  };

  return (
    <div className={styles.switcher}>
      <button
        type="button"
        className={`${styles.lang} ${currentLocale === "pt" ? styles.active : ""}`}
        onClick={() => handleLocaleChange("pt")}
        aria-label="Português">
        PT
      </button>
      <span className={styles.separator}>/</span>
      <button
        type="button"
        className={`${styles.lang} ${currentLocale === "en" ? styles.active : ""}`}
        onClick={() => handleLocaleChange("en")}
        aria-label="English">
        EN
      </button>
    </div>
  );
}
