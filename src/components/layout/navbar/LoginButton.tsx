import React from "react";
import { LuLogIn } from "react-icons/lu";
import styles from "@/styles/components/layout/navbar/LoginButton.module.css";

interface LoginButtonProps {
  onClick?: () => void;
}

const LoginButton: React.FC<LoginButtonProps> = ({ onClick }) => {
  return (
    <button onClick={onClick} className={styles.loginButton}>
      Login <LuLogIn className={styles.loginIcon}/>
    </button>
  );
};

export default LoginButton;
