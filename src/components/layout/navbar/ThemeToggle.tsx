"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { FiSun, FiMoon } from "react-icons/fi";
import styles from "@/styles/components/layout/navbar/ThemeToggle.module.css";

export function ThemeToggle({ dict }: {
  dict: {
    theme_toggle_light: string;
    theme_toggle_dark: string;
  }
}) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={styles.themeToggle}
      aria-label={isDark ? dict.theme_toggle_dark : dict.theme_toggle_light}>
      {isDark ? <FiMoon className={styles.icon} /> : <FiSun className={styles.icon} />}
    </button>
  );
}
