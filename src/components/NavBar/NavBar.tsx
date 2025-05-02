"use client";

import React, { useContext, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import UserDataContext from "../../context/UserDataContext";
import LoggedIn from "./Loggedin";
import MobileMenuButton from "./MobileMenuButton";
import style from "../css/NavBar.module.css";

const NavBar: React.FC = () => {
  const { userData, login, logout } = useContext(UserDataContext) || {};
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsMenuOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className={style.navBarContainer}>
      <div className={style.navBar}>
        <div className={style.navBrand}>
          <Link href="/">
            <Image src="/neiist_logo.png" alt="NEIIST Logo" width={120} height={40} />
          </Link>
        </div>

        <MobileMenuButton isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />

        <div className={`${style.navMenu} ${isMenuOpen ? style.active : ""}`}>
          <div className={style.navItems}>
            <div className={style.navItem}>
              <Link href="/sobre_nos" className={style.navLink}>
                Sobre nós
              </Link>
            </div>
            <div className={style.navItem}>
              <Link href="/contactos" className={style.navLink}>
                Contactos
              </Link>
            </div>
            <div className={style.navItem}>
              <Link href="/estudantes" className={style.navLink}>
                Estudante
              </Link>
            </div>
          </div>

          <div className={style.navAuth}>
            {userData ? (
              <LoggedIn userData={userData} logout={logout} />
            ) : (
              <div className={style.navItem}>
                <button onClick={login} className={style.loginButton}>
                  Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={style.navSpace}></div>
    </div>
  );
};

export default NavBar;