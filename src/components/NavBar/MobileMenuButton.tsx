import React from "react";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoMdClose } from "react-icons/io";
import style from "../css/NavBar.module.css";

interface MobileMenuButtonProps {
  isMenuOpen: boolean;
  toggleMenu: () => void;
}

const MobileMenuButton: React.FC<MobileMenuButtonProps> = ({ isMenuOpen, toggleMenu }) => {
  return (
    <button
      className={style.menuToggle}
      onClick={toggleMenu}
      aria-label="Toggle menu"
    >
      {isMenuOpen ? <IoMdClose /> : <GiHamburgerMenu />}
    </button>
  );
};

export default MobileMenuButton;