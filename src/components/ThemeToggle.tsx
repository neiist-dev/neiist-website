"use client"
import React, { useContext } from "react";
import Image from "next/image";
import { ThemeContext } from "../provider/ThemeProvider";
import LightModeIcon from "@/assets/light-mode.svg";
import DarkModeIcon from "@/assets/dark-mode.svg";
import styles from "@/styles/components/ThemeToggle.module.css";

export default function ThemeToggle() {
  const themeContext = useContext(ThemeContext);

  if (!themeContext) {
    return null; // Ensure context is available
  }

  const { theme, toggleTheme } = themeContext;

  return (
    <button
      className={`${styles.themeToggle} ${theme === "dark" ? styles.dark : styles.light}`}
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      <span className={styles.iconContainer}>
        <Image src={LightModeIcon} className={styles.sunIcon} alt="Light mode icon" />
        <Image src={DarkModeIcon} className={styles.moonIcon} alt="Dark mode icon" />
      </span>
    </button>
  );
}
