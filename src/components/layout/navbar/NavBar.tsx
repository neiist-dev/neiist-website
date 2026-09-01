"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { login, logout } from "@/utils/userUtils";
import { Squash } from "hamburger-react";
import { NavItem } from "@/components/layout/navbar/NavItem";
import NeiistLogo from "@/components/layout/navbar/NeiistLogo";
import ShoppingCart from "@/components/layout/navbar/ShoppingCart";
import LoginButton from "@/components/layout/navbar/LoginButton";
import UserMenu from "@/components/layout/navbar/UserMenu";
import LanguageSwitcher from "@/components/layout/navbar/LanguageSwitcher";
import styles from "@/styles/components/layout/navbar/NavBar.module.css";
import { User } from "@/types/user";
import { Dictionary } from "@/i18n/dictionaries";
import { Locale } from "@/i18n/i18n-config";

interface NavBarProps {
  dict: Dictionary["navbar"];
  basePath: string;
  currentLocale: Locale;
  authSlot?: React.ReactNode;
}

export function AuthWidget({
  initialUser,
  dict,
  basePath,
}: {
  initialUser?: User | null;
  dict: Dictionary["navbar"]["menu"];
  basePath: string;
}) {
  const { user, setUser } = useUser();

  useEffect(() => {
    if (initialUser && !user) setUser(initialUser);
  }, [initialUser, user, setUser]);

  const currentUser = user ?? initialUser;

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  if (currentUser) {
    return (
      <UserMenu userData={currentUser} logout={handleLogout} dict={dict} basePath={basePath} />
    );
  }

  return <LoginButton onClick={login} />;
}

export default function NavBar({ dict, basePath, currentLocale, authSlot }: NavBarProps) {
  const router = useRouter();
  const [isSticky, setIsSticky] = useState(false);
  const [menuState, setMenuState] = useState<"closed" | "open" | "closing">("closed");
  const menuRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { name: dict.about_us, href: `${basePath}/about-us` },
    { name: dict.activities, href: `${basePath}/activities` },
    /*{ name: "Blog", href: `${basePath}/blog` },*/
    { name: dict.shop, href: `${basePath}/shop` },
    /* { name: dict.dinner, href: `${basePath}/dinner` },*/
  ];

  useEffect(() => {
    const onScroll = () => setIsSticky(window.scrollY > 0);
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (menuState !== "open") return;
    const handleClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) closeMenu();
    };
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
    }, 100);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [menuState]);

  const toggleMenu = () => {
    if (menuState === "open" || menuState === "closing") {
      closeMenu();
    } else {
      setMenuState("open");
    }
  };

  const closeMenu = () => {
    setMenuState("closing");
    setTimeout(() => setMenuState("closed"), 300);
  };

  const handleMobileNavClick = (href: string) => {
    closeMenu();
    setTimeout(() => {
      router.push(href);
    }, 300);
  };

  const renderNavItems = (onClick?: (_href: string) => void) => {
    return navLinks.map((link) => (
      <NavItem
        key={link.name}
        href={link.href}
        label={link.name}
        onClick={onClick ? () => onClick(link.href) : undefined}
      />
    ));
  };

  return (
    <header className={`${styles.header} ${isSticky ? styles.sticky : ""}`}>
      <nav className={styles.navigation}>
        <Link href={basePath} className={styles.logo}>
          <NeiistLogo />
        </Link>
        <div className={styles.navItems}>{renderNavItems()}</div>
      </nav>
      <div className={styles.actions}>
        <LanguageSwitcher currentLocale={currentLocale} />
        <ShoppingCart />
        {authSlot ?? <AuthWidget dict={dict.menu} basePath={basePath} />}
        <div className={styles.menuButton}>
          <Squash
            toggled={menuState === "open"}
            toggle={toggleMenu}
            size={24}
            color="var(--foreground-colour)"
            rounded
          />
        </div>
      </div>
      {(menuState === "open" || menuState === "closing") && (
        <div
          ref={menuRef}
          className={`${styles.menu} ${menuState === "closing" ? styles.slideOut : ""}`}>
          <Link
            href={basePath}
            className={styles.logo}
            onClick={() => handleMobileNavClick(basePath)}>
            <NeiistLogo />
          </Link>
          <nav className={styles.navItems}>{renderNavItems(handleMobileNavClick)}</nav>
        </div>
      )}
    </header>
  );
}
