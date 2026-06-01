import React from "react";
import { LuLogIn } from "react-icons/lu";
import styles from "@/styles/components/layout/navbar/LoginButton.module.css";
import type { LoginButtonDict } from "@/types/i18n";


interface LoginButtonProps {
  onClick?: () => void;
  dict: LoginButtonDict; 
}

const LoginButton: React.FC<LoginButtonProps> = ({ onClick, dict }) => {
  return (
    <button onClick={onClick} className={styles.loginButton}>
      {dict.button} <LuLogIn className={styles.loginIcon} />
    </button>
  );
};

export default LoginButton;
