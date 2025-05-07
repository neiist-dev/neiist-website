"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { FaBars, FaTimes } from "react-icons/fa";
import { fetchUserData, login, logout } from "@/utils/userUtils";
import styles from "@/styles/components/navbar/NavBar.module.css"
import { NavItem } from "./NavItem";
import ProfileMenu from "./ProfileMenu";
import NeiistLogo from "./NeiistLogo";
import ThemeToggle from "../ThemeToggle";
import ShoppingCart from "./ShoppingCart";
import LoginButton from "./LoginButton";

const navLinks = [
  { name: "Sobre Nós", href: "/sobre" },
  { name: "Estudante", href: "/estudante" },
  { name: "Loja", href: "/loja" },
];

const NavBar: React.FC = () => {
  const [userData, setUserData] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchUserData();
        setUserData(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, []);

  const handleLogout = async () => {
    await logout();
    setUserData(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setIsClosing(true);
        setTimeout(() => {
          setIsMobileMenuOpen(false);
          setIsClosing(false);
        }, 300);
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
    <header className={styles.header}>
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
        <ThemeToggle />
        <ShoppingCart />
        {userData ? (
          <ProfileMenu userData={userData} logout={handleLogout} />
        ) : (
          <LoginButton onClick={login} />
        )}
        <button className={styles.mobileMenuButton} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} >
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
      {(isMobileMenuOpen || isClosing) && (
        <div ref={mobileMenuRef} className={`${styles.mobileMenu} ${isClosing ? styles.menuClosing : ""}`} >
          {navLinks.map((link) => (
            <NavItem key={link.name} href={link.href} label={link.name} />
          ))}
        </div>
      )}
    </header>
  );
};

export default NavBar;