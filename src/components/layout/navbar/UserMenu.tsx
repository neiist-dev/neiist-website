import Image from "next/image";
import React, { useState, useRef, useEffect } from "react";
import { GoSignOut, GoPeople, GoPerson } from "react-icons/go";
import { LuFileText } from "react-icons/lu";
import { TbGavel } from "react-icons/tb";
import { UserMenuItem } from "@/components/layout/navbar/NavItem";
import styles from "@/styles/components/layout/navbar/ProfileMenu.module.css";
import { User, UserRole } from "@/types/user";

interface UserMenuProps {
  userData: User;
  logout: () => void;
}

const UserContainer: React.FC<{ isOpen: boolean; toggleMenu: () => void; userData: User }> = ({ isOpen, toggleMenu, userData }) => (
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
      src={userData.photo}
      alt="User photo"
      width={40}
      height={40}
      className="rounded-full"
    />
    <div className={styles.userDetails}>
      <span className={styles.userName}>{userData.name}</span>
      <span className={styles.userStatus}>{userData.roles}</span>
    </div>
  </div>
);

const UserMenu: React.FC<UserMenuProps> = ({ userData, logout }) => {
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

  const isAdmin = userData.roles.includes(UserRole.ADMIN);
  const isCoordinator = userData.roles.includes(UserRole.COORDINATOR);
  const isMember = userData.roles.includes(UserRole.MEMBER);

  return (
    <div className={styles.profileContainer} ref={menuRef}>
      <UserContainer
        isOpen={isOpen}
        toggleMenu={() => setIsOpen(!isOpen)}
        userData={userData}
      />
      <div className={`${styles.profileDropdown} ${isOpen ? styles.active : ""}`}>
        <div className={styles.divider}></div>
        <UserMenuItem href="/profile" label="Profile" icon={GoPerson}/>
        {(isAdmin || isCoordinator || isMember) && (
          <>
            <UserMenuItem href="/thesismaster" label="Thesis Master" icon={LuFileText}/>
          </>
        )}
        {isAdmin && (
          <>
            <div className={styles.divider}></div>
            <UserMenuItem href="/mag" label="MAG" icon={TbGavel}/>
          </>
        )}
        {(isAdmin || isCoordinator) && (
          <>
            <UserMenuItem 
              href="/collaborators" 
              label={isAdmin ? "Manage Users" : "Collaborators"} 
              icon={GoPeople}
            />
          </>
        )}
        <div className={styles.divider} />
        <div className={styles.logoutButtom} onClick={() => { setIsOpen(false); logout(); }}>
          <GoSignOut/> Log out
        </div>
      </div>
    </div>
  );
};

export default UserMenu;
