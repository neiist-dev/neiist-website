"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { locales, Locale, localeNames } from "@/lib/i18n-config";
import styles from "@/styles/components/layout/navbar/LanguageSwitcher.module.css";

export default function LanguageSwitcher({ currentLocale }: { currentLocale: Locale }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const switchLanguage = (newLocale: Locale) => {
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000`;
    setIsOpen(false);
    router.refresh();
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button
        className={styles.triggerButton}
        onClick={() => setIsOpen(!isOpen)}
        title="Switch Language">
        {currentLocale.toUpperCase()}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {locales.map((locale) => (
            <button
              key={locale}
              className={styles.dropdownItem}
              onClick={() => switchLanguage(locale)}>
              {localeNames[locale]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}