import Image from "next/image";
import React, { useState, useRef, useEffect } from "react";
import { IconType } from "react-icons";
import { GoSignOut, GoPeople, GoPerson, GoOrganization } from "react-icons/go";
import { LuFileText, LuShoppingBag, LuPackage } from "react-icons/lu";
import { FiCamera } from "react-icons/fi";
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

  const isAdmin = userData.roles.includes(UserRole._ADMIN);
  const isCoordinator = userData.roles.includes(UserRole._COORDINATOR);
  const isMember = userData.roles.includes(UserRole._MEMBER);
  const isPhotoCoord =
      userData.roles.includes(UserRole._COORDINATOR) &&
      userData.teams?.some((team) => team.toLowerCase().includes("fotografia"));

  const menuPages: MenuPage[] = [
    {
      href: "/profile",
      label: "Profile",
      icon: GoPerson,
      roles: [UserRole._GUEST, UserRole._MEMBER, UserRole._COORDINATOR, UserRole._ADMIN],
    },
    {
      href: "/my-orders",
      label: "As Minhas Encomendas",
      icon: LuPackage,
      roles: [UserRole._GUEST, UserRole._MEMBER, UserRole._COORDINATOR, UserRole._ADMIN],
    },
    {
      href: "/placeholder",
      label: "Encomendas",
      icon: LuFileText,
      roles: [UserRole._MEMBER],
    }, //TODO Add the actual page url when existent
    {
      href: "/placeholder",
      label: "Gerir Encomendas",
      icon: LuFileText,
      roles: [],
      coordinatorOnly: true,
    }, //TODO Add the actual page url when existent
    {
      href: "/team-management",
      label: "Gerir Equipa",
      icon: GoPeople,
      roles: [UserRole._COORDINATOR],
      coordinatorOnly: true,
    },
    ...(isPhotoCoord
      ? [
          {
            href: "/photo-management",
            label: "Gerir Fotos Membros",
            icon: FiCamera,
            roles: [UserRole._COORDINATOR],
            coordinatorOnly: true,
          },
        ]
      : []),
    {
      href: "/placeholder",
      label: "Gerir Loja",
      icon: LuShoppingBag,
      roles: [],
      adminOnly: true,
    }, //TODO Add the actual page url when existent
    {
      href: "/users-management",
      label: "Gerir Membros e Utilizadores",
      icon: GoPeople,
      roles: [],
      adminOnly: true,
    },
    {
      href: "/departments-management",
      label: "Gerir Departamentos",
      icon: GoOrganization,
      roles: [],
      adminOnly: true,
    },
  ];

  const getAvailablePages = () => {
    if (isAdmin) return menuPages.filter((p) => p.roles.includes(UserRole._ADMIN) || p.adminOnly);
    if (isCoordinator)
      return menuPages.filter((p) => p.roles.includes(UserRole._COORDINATOR) || p.coordinatorOnly);
    if (isMember) return menuPages.filter((p) => p.roles.includes(UserRole._MEMBER));
    return menuPages.filter((p) => p.roles.includes(UserRole._GUEST));
  };

  const availablePages = getAvailablePages();
  const isMenuVisible = menuState === "open" || menuState === "closing";

  return (
    <div className={styles.userMenuContainer} ref={menuRef} onClick={toggleMenu}>
      <Image
        src={userData.photo}
        alt="User photo"
        width={40}
        height={40}
        className={styles.userPhoto}
      />
      <div className={styles.userDetails}>
        <span className={styles.userName}>{userData.name}</span>
        <span className={styles.userStatus}>{userData.roles.join(", ")}</span>
      </div>

      {isMenuVisible && (
        <div
          className={`${styles.profileDropdown} ${menuState === "closing" ? styles.slideOut : ""}`}
          onClick={(e) => e.stopPropagation()}>
          {availablePages.map((page) => (
            <UserMenuItem
              key={page.href + page.label}
              href={page.href}
              label={page.label}
              icon={page.icon}
              onClick={closeMenu}
            />
          ))}
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
