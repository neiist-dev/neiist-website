import React from "react";
import { FaSignInAlt } from "react-icons/fa";
import styles from "@/styles/components/navbar/LoginButton.module.css";

interface LoginButtonProps {
  onClick?: () => void;
}

const LoginButton: React.FC<LoginButtonProps> = ({ onClick }) => {
  return (
    <button onClick={onClick} className={styles.loginButton}>
      <FaSignInAlt className={styles.loginIcon} />  Login
    </button>
  );
};

export default LoginButton;
