"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { locales, Locale, localeNames } from "@/lib/i18n-config";
import styles from "@/styles/components/layout/navbar/LanguageSwitcher.module.css";

export default function LanguageSwitcher({ currentLocale }: { currentLocale: Locale }) {
  const router = useRouter();
  const [menuState, setMenuState] = useState<"closed" | "open" | "closing">("closed");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const closeMenu = () => {
    setMenuState("closing");
    setTimeout(() => setMenuState("closed"), 150);
  };

  const toggleMenu = () => {
    if (menuState === "open" || menuState === "closing") {
      closeMenu();
    } else {
      setMenuState("open");
    }
  };

  const switchLanguage = (newLocale: Locale) => {
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000`;
    closeMenu();
    router.refresh();
  };

  useEffect(() => {
    if (menuState !== "open") return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuState]);

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button
        className={styles.triggerButton}
        onClick={toggleMenu}
        title="Switch Language">
        {currentLocale.toUpperCase()}
      </button>

      {(menuState === "open"|| menuState === "closing") && (
        <div className={`${styles.dropdown} ${menuState === "closing" ? styles.slideOut : ""}`}>
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