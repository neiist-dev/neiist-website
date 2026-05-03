"use client";
import { useState, useEffect, useRef } from "react";
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
import { Locale } from "@/lib/i18n-config";
import styles from "@/styles/components/layout/navbar/NavBar.module.css";

interface NavBarProps {
  dict: {
    about_us: string;
    activities: string;
    shop: string;
    layout_navbar: {
      button: string;
      theme_toggle_light: string;
      theme_toggle_dark: string;
    };
    menu: {
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
  };
  currentLocale: Locale;
}

export default function NavBar({ dict, currentLocale }: NavBarProps) {
  const router = useRouter();
  const { user, setUser } = useUser();
  const [isSticky, setIsSticky] = useState(false);
  const [menuState, setMenuState] = useState<"closed" | "open" | "closing">("closed");
  const menuRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { name: dict.about_us, href: "/about-us" },
    { name: dict.activities, href: "/activities" },
    { name: dict.shop, href: "/shop" },
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

  const handleLogout = async () => {
    await logout();
    setUser(null);
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
        <Link href="/" className={styles.logo}>
          <NeiistLogo />
        </Link>
        <div className={styles.navItems}>{renderNavItems()}</div>
      </nav>
      <div className={styles.actions}>
        <LanguageSwitcher currentLocale={currentLocale} />
        <ShoppingCart />
        {user ? (
          <UserMenu userData={user} logout={handleLogout} dict={dict.menu}/>
        ) : (
          <LoginButton onClick={login} dict={dict.layout_navbar} />
        )}
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
    </header>
  );
}