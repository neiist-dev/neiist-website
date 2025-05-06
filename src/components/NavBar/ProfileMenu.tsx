import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { GoSignOut } from "react-icons/go";
import { ProfileItem } from "./NavItem";
import styles from "@/styles/components/navbar/ProfileMenu.module.css";
import { UserData, summarizeName, statusToString } from "@/utils/userUtils";

interface ProfileMenuProps {
  userData: UserData;
  logout: () => void;
}

const UserContainer: React.FC<{ isOpen: boolean; toggleMenu: () => void; userData: UserData; }> =
({ isOpen, toggleMenu, userData }) => (
  <div
    className={styles.userContainer}
    onClick={toggleMenu}
    aria-expanded={isOpen}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        toggleMenu();
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
);

const ProfileMenu: React.FC<ProfileMenuProps> = ({ userData, logout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={styles.profileContainer} ref={menuRef}>
      <UserContainer
        isOpen={isOpen}
        toggleMenu={() => setIsOpen(!isOpen)}
        userData={userData}
      />
      <div
        className={`${styles.profileDropdown} ${isOpen ? styles.active : ""}`}
      >
        {userData.isAdmin || userData.isActiveTecnicoStudent ? (
          <ProfileItem href="/user" label="Profile" />
        ) : null}
        {userData.isAdmin || userData.isCollab ? (
          <ProfileItem href="/collab" label="Colaborador(a)" />
        ) : null}
        {userData.isAdmin || userData.isActiveLMeicStudent ? (
          <ProfileItem href="/thesismaster" label="Thesis Master" />
        ) : null}
        {userData.isAdmin ? (
          <ProfileItem href="/admin" label="Admin" />
        ) : null}
        {userData.isAdmin || userData.isGacMember ? (
          <ProfileItem href="/mag" label="MAG" />
        ) : null}
        <ProfileItem
          href="#"
          label={
            <>
              <GoSignOut /> Log out
            </>
          }
          onClick={() => {
            setIsOpen(false);
            logout();
          }}
          className={styles.logoutButtom}
        />
      </div>
    </div>
  );
};

export default ProfileMenu;