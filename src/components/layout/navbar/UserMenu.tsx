import Image from "next/image";
import React, { useState, useRef, useEffect } from "react";
import { IconType } from "react-icons";
import { GoSignOut, GoPeople, GoPerson } from "react-icons/go";
import { LuFileText, LuShoppingBag, LuPackage } from "react-icons/lu";
import { TbGavel } from "react-icons/tb";
import { UserMenuItem } from "@/components/layout/navbar/NavItem";
import styles from "@/styles/components/layout/navbar/UserMenu.module.css";
import { User, UserRole } from "@/types/user";

interface UserMenuProps {
  userData: User;
  logout: () => void;
}

interface MenuPage {
  href: string;
  label: string;
  icon: IconType;
  roles: UserRole[];
  adminOnly?: boolean;
  coordinatorOnly?: boolean;
}

const UserMenu: React.FC<UserMenuProps> = ({ userData, logout }) => {
  const [menuState, setMenuState] = useState<"closed" | "open" | "closing">("closed");
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = React.useCallback(() => {
    if (menuState === "open") {
      setMenuState("closing");
      setTimeout(() => setMenuState("closed"), 150);
    }
  }, [menuState]);

  useEffect(() => {
    if (menuState !== "open") return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuState, closeMenu]);

  const toggleMenu = () => {
    if (menuState === "open") {
      closeMenu();
    } else if (menuState === "closed") {
      setMenuState("open");
    }
  };

  const handleLogout = () => {
    closeMenu();
    setTimeout(logout, 100);
  };

  const isAdmin = userData.roles.includes(UserRole.ADMIN);
  const isCoordinator = userData.roles.includes(UserRole.COORDINATOR);
  const isMember = userData.roles.includes(UserRole.MEMBER);

  const menuPages: MenuPage[] = [
    { href: "/profile", label: "Profile", icon: GoPerson, roles: [UserRole.GUEST, UserRole.MEMBER, UserRole.COORDINATOR, UserRole.ADMIN] },
    { href: "/my-orders", label: "As Minhas Encomendas", icon: LuPackage, roles: [UserRole.GUEST, UserRole.MEMBER, UserRole.COORDINATOR, UserRole.ADMIN] },
    { href: "/orders", label: "Encomendas", icon: LuFileText, roles: [UserRole.MEMBER] },
    { href: "/orders", label: "Gerir Encomendas", icon: LuFileText, roles: [], coordinatorOnly: true },
    { href: "/team", label: "Gerir Equipa", icon: GoPeople, roles: [], coordinatorOnly: true },
    { href: "/loja", label: "Gerir Loja", icon: LuShoppingBag, roles: [], adminOnly: true },
    { href: "/collaborators", label: "Gerir Equipas", icon: GoPeople, roles: [], adminOnly: true },
  ];

  const getAvailablePages = () => {
    if (isAdmin) return menuPages.filter(p => p.roles.includes(UserRole.ADMIN) || p.adminOnly);
    if (isCoordinator) return menuPages.filter(p => p.roles.includes(UserRole.COORDINATOR) || p.coordinatorOnly);
    if (isMember) return menuPages.filter(p => p.roles.includes(UserRole.MEMBER));
    return menuPages.filter(p => p.roles.includes(UserRole.GUEST));
  };

  const availablePages = getAvailablePages();
  const isMenuVisible = menuState === "open" || menuState === "closing";

return (
    <div className={styles.userMenuContainer} ref={menuRef} onClick={toggleMenu}>
      <Image
        src={userData.photo} alt="User photo" 
        width={40} height={40} className={styles.userPhoto}
      />
      <div className={styles.userDetails}>
        <span className={styles.userName}>{userData.name}</span>
        <span className={styles.userStatus}>{userData.roles.join(', ')}</span>
      </div>

      {isMenuVisible && (
        <div
          className={`${styles.profileDropdown} ${menuState === "closing" ? styles.slideOut : ''}`}
          onClick={(e) => e.stopPropagation()} // Prevent clicks inside dropdown from closing it
        >
          {availablePages.map((page) => (
            <UserMenuItem 
              key={page.href + page.label} href={page.href}
              label={page.label} icon={page.icon} onClick={closeMenu}
            />
          ))}
          {isAdmin && (
            <>
              <div className={styles.divider}></div>
              <UserMenuItem
                href="/mag" label="MAG" icon={TbGavel} onClick={closeMenu}
              />
            </>
          )}
          <div className={styles.divider} />
          <UserMenuItem
            href="#"
            label="Log out"
            icon={GoSignOut}
            onClick={handleLogout}
            className={styles.logoutButton}
          />
        </div>
      )}
    </div>
  );
};

export default UserMenu;