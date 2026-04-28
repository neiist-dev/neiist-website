import Image from "next/image";
import React, { useState, useRef, useEffect } from "react";
import { IconType } from "react-icons";
import { GoSignOut, GoPeople, GoPerson, GoOrganization } from "react-icons/go";
import { LuFileText, LuShoppingBag, LuPackage } from "react-icons/lu";
import { FiCamera } from "react-icons/fi";
import { UserMenuItem } from "@/components/layout/navbar/NavItem";
import styles from "@/styles/components/layout/navbar/UserMenu.module.css";
import { User, UserRole } from "@/types/user";
import { checkRoles } from "@/types/user";
import { getFirstAndLastName } from "@/utils/userUtils";

interface UserMenuProps {
  userData: User;
  logout: () => void;
  dict: {
    profile: string;
    my_orders: string;
    manage_orders: string;
    manage_team: string;
    manage_photos: string;
    manage_shop: string;
    manage_users: string;
    manage_departments: string;
    logout: string;
    user_photo_alt: string;
  };
}

interface MenuPage {
  href: string;
  label: string;
  icon: IconType;
  roles: UserRole[];
  adminOnly?: boolean;
  coordinatorOnly?: boolean;
}

const UserMenu: React.FC<UserMenuProps> = ({ userData, logout, dict }) => {
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

  const isPhotoCoord =
    checkRoles(userData, [UserRole._COORDINATOR]) &&
    userData.teams?.some((team) => team.toLowerCase().includes("fotografia"));

  const menuPages: MenuPage[] = [
    {
      href: "/profile",
      label: dict.profile,
      icon: GoPerson,
      roles: [
        UserRole._GUEST,
        UserRole._MEMBER,
        UserRole._SHOP_MANAGER,
        UserRole._COORDINATOR,
        UserRole._ADMIN,
      ],
    },
    {
      href: "/my-orders",
      label: dict.my_orders,
      icon: LuPackage,
      roles: [
        UserRole._GUEST,
        UserRole._MEMBER,
        UserRole._SHOP_MANAGER,
        UserRole._COORDINATOR,
        UserRole._ADMIN,
      ],
    },
    {
      href: "/orders",
      label: dict.manage_orders,
      icon: LuFileText,
      roles: [UserRole._SHOP_MANAGER, UserRole._COORDINATOR, UserRole._ADMIN],
    },
    {
      href: "/team-management",
      label: dict.manage_team,
      icon: GoPeople,
      roles: [UserRole._COORDINATOR],
      coordinatorOnly: true,
    },
    ...(isPhotoCoord
      ? [
          {
            href: "/photo-management",
            label: dict.manage_photos,
            icon: FiCamera,
            roles: [UserRole._COORDINATOR],
            coordinatorOnly: true,
          },
        ]
      : []),
    {
      href: "/shop/manage",
      label: dict.manage_shop,
      icon: LuShoppingBag,
      roles: [UserRole._ADMIN],
      adminOnly: true,
    },
    {
      href: "/users-management",
      label: dict.manage_users,
      icon: GoPeople,
      roles: [UserRole._ADMIN],
      adminOnly: true,
    },
    {
      href: "/departments-management",
      label: dict.manage_departments,
      icon: GoOrganization,
      roles: [UserRole._ADMIN],
      adminOnly: true,
    },
  ];

  const getAvailablePages = () => {
    return menuPages.filter((p) => {
      if (p.adminOnly) return checkRoles(userData, [UserRole._ADMIN]);
      if (p.coordinatorOnly) return checkRoles(userData, [UserRole._COORDINATOR]);
      if (!p.roles || p.roles.length === 0) return true;
      return checkRoles(userData, p.roles);
    });
  };

  const availablePages = getAvailablePages();
  const isMenuVisible = menuState === "open" || menuState === "closing";
  return (
    <div className={styles.userMenuContainer} ref={menuRef} onClick={toggleMenu}>
      <Image
        src={userData.photo}
        alt={dict.user_photo_alt}
        width={40}
        height={40}
        className={styles.userPhoto}
      />
      <div className={styles.userDetails}>
        <span className={styles.userName}>{getFirstAndLastName(userData.name)}</span>
        <span className={styles.userStatus}>{userData.positionName}</span>
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
            label={dict.logout}
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
