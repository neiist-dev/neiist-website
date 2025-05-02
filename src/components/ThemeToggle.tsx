"use client"
import { FiSun, FiMoon } from "react-icons/fi";
import styles from "@/src/components/css/ThemeToggle.module.css";
import React, { useContext } from "react";
import { ThemeContext } from "../provider/ThemeProvider";

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
        <FiSun className={styles.sunIcon} />
        <FiMoon className={styles.moonIcon} />
      </span>
    </button>
  )
}