"use client"
import React, { useContext } from "react";
import { ThemeContext } from "../provider/ThemeProvider";
import { FiSun, FiMoon } from 'react-icons/fi';
import styles from "@/styles/components/navbar/ThemeToggle.module.css";

export default function ThemeToggle() {
  const themeContext = useContext(ThemeContext);

  if (!themeContext) {
    return null; // Ensure context is available
  }

  const { theme, toggleTheme } = themeContext;

  return (
    <button
    className={`${styles.themeToggle} ${theme === "dark" ? styles.dark : ""}`}
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
    {theme === "dark" ? (
      <FiMoon className={`${styles.icon} ${styles.dark}`} />
    ) : (
      <FiSun className={styles.icon} />
    )}
    </button>
  );
}
