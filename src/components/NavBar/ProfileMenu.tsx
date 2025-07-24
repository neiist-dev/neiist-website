import Image from "next/image";
import React, { useState, useRef, useEffect } from "react";
import { GoSignOut, GoPeople, GoPerson } from "react-icons/go";
import { LuFileText } from "react-icons/lu";
import { TbGavel } from "react-icons/tb";
import { ProfileItem } from "@/components/navbar/NavItem";
import styles from "@/styles/components/navbar/ProfileMenu.module.css";
import { summarizeName, statusToString } from "@/utils/profileUtils";
import { UserData } from "@/types/user";

interface ProfileMenuProps {
  userData: UserData;
  logout: () => void;
}

const UserContainer: React.FC<{ isOpen: boolean; toggleMenu: () => void; userData: UserData }> = ({ isOpen, toggleMenu, userData }) => (
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
      <div className={`${styles.profileDropdown} ${isOpen ? styles.active : ""}`}>
        <div className={styles.divider}></div>
        <ProfileItem href="/profile" label="Profile" icon={GoPerson}/>
        {userData.isAdmin || userData.isActiveTecnicoStudent ||  userData.isCollab ? (
          <>
            <ProfileItem href="/thesismaster" label="Thesis Master" icon={LuFileText}/>
          </>
        ) : null}
        {userData.isAdmin || userData.isGacMember ? (
          <>
            <div className={styles.divider}></div>
            <ProfileItem href="/mag" label="MAG" icon={TbGavel}/>
          </>
        ) : null}
        {userData.isAdmin || userData.isCollab ? (
          <>
            <ProfileItem 
              href="/collaborators" 
              label={userData.isAdmin ? "Manage Users" : "Collaborators"} 
              icon={GoPeople}
            />
          </>
        ) : null}
        <div className={styles.divider} />
        <div className={styles.logoutButtom} onClick={() => { setIsOpen(false); logout(); }}>
          <GoSignOut/> Log out
        </div>
      </div>
    </div>
  );
};

export default ProfileMenu;
