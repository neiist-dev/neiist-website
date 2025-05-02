import React from "react";
import styles from "@/src/components/css/LoginButton.module.css";

interface LoginButtonProps {
  onClick?: () => void;
}

const LoginButton: React.FC<LoginButtonProps> = ({ onClick }) => {
  return (
    <button className={styles.loginButton} onClick={onClick}>
      <span>Login</span>
      <span className={styles.loginIcon}>&rarr;</span>
    </button>
  );
};

export default LoginButton;