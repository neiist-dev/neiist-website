import type React from "react"
import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { GoSignOut } from "react-icons/go"
import { MenuButton } from "./MenuButton"
import styles from "../css/NavBar.module.css"
import { type UserData, login, summarizeName, statusToString } from "@/src/utils/userUtils"
import LoginButton from "./LoginButton"

interface ProfileMenuProps {
  userData: UserData | null
  logout: () => void
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({ userData, logout }) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Close on ESC key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscKey)
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey)
    }
  }, [isOpen])

  if (!userData) {
    return <LoginButton onClick={login} />
  }

  return (
    <div className={styles.profileContainer} ref={menuRef}>
      <div
        className={styles.userContainer}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            setIsOpen(!isOpen)
          }
        }}
      >
        <Image
          src={userData.photo || "/default-user.png"}
          alt="User Photo"
          width={32}
          height={32}
          className={styles.userPhoto}
        />
        <div className={styles.userDetails}>
          <span className={styles.userName}>{summarizeName(userData.displayName)}</span>
          <span className={styles.userStatus}>{statusToString(userData.status)}</span>
        </div>
      </div>
      {isOpen && (
        <div className={styles.profileDropdown}>
          <MenuButton href="/user" label="Perfil" condition={!!userData.isAdmin || !!userData.isActiveTecnicoStudent} />
          <MenuButton href="/collab" label="Colaborador(a)" condition={!!userData.isAdmin || !!userData.isCollab} />
          <MenuButton
            href="/thesismaster"
            label="Thesis Master"
            condition={!!userData.isAdmin || !!userData.isActiveLMeicStudent}
          />
          <MenuButton href="/admin" label="Admin" condition={!!userData.isAdmin} />
          <MenuButton href="/mag" label="MAG" condition={!!userData.isAdmin || !!userData.isGacMember} />
          <MenuButton
            href="#"
            label="Terminar Sessão"
            onClick={() => {
              setIsOpen(false)
              logout()
            }}
            icon={<GoSignOut />}
          />
        </div>
      )}
    </div>
  )
}
