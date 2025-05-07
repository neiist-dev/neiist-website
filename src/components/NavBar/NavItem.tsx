import React from "react";
import Link from "next/link";
import styles from "@/styles/components/navbar/NavItem.module.css";

interface NavItemProps {
  href: string;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ href, label }) => {
  return (
    <Link href={href} className={styles.navLink}>
      {label}
    </Link>
  );
};

interface ProfileItemProps {
  href: string;
  label: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const ProfileItem: React.FC<ProfileItemProps> = ({ href, label, onClick,className }) => {
  return (
  <div>
    <Link href={href} className={`${styles.menuItem} ${className || ""}`} onClick={onClick}>
    {label}
    </Link>
  </div>
  );
};

export { NavItem, ProfileItem };
  