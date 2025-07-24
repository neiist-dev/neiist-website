"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { FaBars, FaTimes } from "react-icons/fa";
import { login, logout } from "@/utils/profileUtils";
import styles from "@/styles/components/navbar/NavBar.module.css";
// Update the import path to match the folder name casing if needed
import { NavItem } from "@/components/navbar/NavItem";
import ProfileMenu from "@/components/navbar/ProfileMenu";
import NeiistLogo from "@/components/navbar/NeiistLogo";
import ShoppingCart from "@/components/navbar/ShoppingCart";
import LoginButton from "@/components/navbar/LoginButton";
import { useUser } from '@/context/UserContext';

const navLinks = [
  { name: "Sobre Nós", href: "/sobre" },
  { name: "Estudante", href: "/estudante" },
  { name: "Loja", href: "/loja" },
  { name: "Blog", href: "/blog" },
];

const NavBar: React.FC = () => {
  const { user, loading, setUser } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  return (
    <header className={`${styles.header} ${isSticky ? styles.sticky : ""}`}>
      <div className={styles.navigation}>
        <Link href="/" className={styles.logo}>
          <NeiistLogo />
        </Link>
        <div className={styles.navLinks}>
          {navLinks.map((link) => (
            <NavItem key={link.name} href={link.href} label={link.name} />
          ))}
        </div>
      </div>
      <div className={styles.actions}>
        <ShoppingCart />
        {loading ? (
          <div>Loading...</div>
        ) : user ? (
          <ProfileMenu userData={user} logout={handleLogout} />
        ) : (
          <LoginButton onClick={login} />
        )}
        <button
          className={styles.mobileMenuButton}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
      {isMobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.menuOpen : ""}`}
        >
          <button
            className={styles.closeButton}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <FaTimes />
          </button>
          <Link href="/" className={styles.logo}>
            <NeiistLogo />
          </Link>
          {navLinks.map((link) => (
            <NavItem key={link.name} href={link.href} label={link.name} />
          ))}
        </div>
      )}
    </header>
  );
};

export default NavBar;