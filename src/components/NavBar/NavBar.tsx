"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import styles from "../css/NavBar.module.css";
import { UserData, fetchUserData, login, logout } from "../../utils/userUtils";
import { ProfileMenu } from "./ProfileMenu";
import ThemeToggle from "../ThemeToggle";
import NeiistLogo from "./NeiistLogo";
import LoginButton from "./LoginButton";
import { Divide as Hamburger } from 'hamburger-react'

const NavBar: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <Link href="/">
          <NeiistLogo />
        </Link>
      </div>
      <button className={styles["hamburger-menu"]} onClick={toggleMenu}>
        <Hamburger size={23} rounded toggled={isMenuOpen} />
      </button>
      <ul className={`${styles["nav-menu"]} ${isMenuOpen ? styles.active : ""}`}>
        <li className={styles["nav-item"]}>
          <Link href="/sobre_nos" className={styles["nav-link"]}>
            Sobre nós
          </Link>
        </li>
        <li className={styles["nav-item"]}>
          <Link href="/contactos" className={styles["nav-link"]}>
            Contactos
          </Link>
        </li>
        <li className={styles["nav-item"]}>
          <Link href="/estudantes" className={styles["nav-link"]}>
            Estudante
          </Link>
        </li>
      </ul>
      <div className={styles["nav-actions"]}>
        <ThemeToggle />
        {userData ? (
          <div
            className={styles.profileContainer}
            ref={profileRef}
          >
            <ProfileMenu userData={userData} logout={handleLogout} />
          </div>
        ) : (
          <LoginButton onClick={login} />
        )}
      </div>
    </nav>
  );
};

export default NavBar;