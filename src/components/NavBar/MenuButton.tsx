import type React from "react"
import Link from "next/link"
import styles from "../css/NavBar.module.css"

interface MenuButtonProps {
  href: string
  label: string
  onClick?: () => void
  icon?: React.ReactNode
  condition?: boolean
}

export const MenuButton: React.FC<MenuButtonProps> = ({ href, label, onClick, icon, condition = true }) => {
  if (!condition) return null

  return (
    <Link href={href} className={styles.menuButton} onClick={onClick}>
      {label}
      {icon && <span className={styles.menuButtonIcon}>{icon}</span>}
    </Link>
  )
}
