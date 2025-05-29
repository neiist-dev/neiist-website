"use client"

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';
import styles from "@/styles/components/navbar/ThemeToggle.module.css"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  if (!mounted) {
    return <button className={styles.themeToggle}></button>
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={`${styles.themeToggle} ${theme === "dark" ? styles.dark : ""}`}
      aria-label={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {theme === "dark" ? (
        <FiMoon className={`${styles.icon} ${styles.dark}`} />
      ) : (
        <FiSun className={styles.icon} />
      )}
    </button>
  )
}
