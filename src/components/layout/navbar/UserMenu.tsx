import Image from "next/image";
import React, { useState, useRef, useEffect } from "react";
import { IconType } from "react-icons";
import { GoSignOut, GoPerson, GoOrganization } from "react-icons/go";
import { LuFileText, LuShoppingBag, LuPackage, LuVote } from "react-icons/lu";
import { UserMenuItem } from "@/components/layout/navbar/NavItem";
import styles from "@/styles/components/layout/navbar/UserMenu.module.css";
import { User } from "@/types/user";
import { Permission } from "@/types/permissions";
import { hasPermission } from "@/lib/security/permissions";
import { getFirstAndLastName } from "@/utils/userUtils";
import { Dictionary } from "@/i18n/dictionaries";

interface UserMenuProps {
  userData: User;
  logout: () => void;
  dict: Dictionary["navbar"]["menu"];
  basePath: string;
}

interface MenuPage {
  href: string;
  label: string;
  icon: IconType;
  permission?: Permission;
  check?: (_user: User) => boolean;
}

const UserMenu: React.FC<UserMenuProps> = ({ userData, logout, dict, basePath }) => {
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

  const menuPages: MenuPage[] = [
    {
      href: `${basePath}/profile`,
      label: dict.profile,
      icon: GoPerson,
    },
    {
      href: `${basePath}/my-orders`,
      label: dict.my_orders,
      icon: LuPackage,
    },
    {
      href: `${basePath}/orders`,
      label: dict.manage_orders,
      icon: LuFileText,
      permission: "orders:read",
    },
    {
      href: `${basePath}/management`,
      label: dict.management,
      icon: GoOrganization,
      check: (user) =>
        hasPermission(user, "memberships:read") ||
        hasPermission(user, "memberships:write_dept") ||
        hasPermission(user, "departments:read") ||
        hasPermission(user, "roles:read"),
    },
    {
      href: `${basePath}/shop/manage`,
      label: dict.manage_shop,
      icon: LuShoppingBag,
      permission: "shop:write",
    },
    {
      href: `${basePath}/voting/manage`,
      label: dict.manage_voting,
      icon: LuVote,
      permission: "voting:write",
    },
  ];

  const getAvailablePages = () => {
    return menuPages.filter((permission) => {
      if (permission.permission) return hasPermission(userData, permission.permission);
      if (permission.check) return permission.check(userData);
      return true;
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
          onClick={(event) => event.stopPropagation()}>
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
