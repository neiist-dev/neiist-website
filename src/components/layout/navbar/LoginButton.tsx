import React from "react";
import { LuLogIn } from "react-icons/lu";
import styles from "@/styles/components/layout/navbar/LoginButton.module.css";

interface LoginButtonProps {
  onClick?: () => void;
  dict: { 
    button: string;
  }; 
}

const LoginButton: React.FC<LoginButtonProps> = ({ onClick, dict }) => {
  return (
    <button onClick={onClick} className={styles.loginButton}>
      {dict.button} <LuLogIn className={styles.loginIcon} />
    </button>
  );
};

export default LoginButton;
