import Link from "next/link";
import React from "react";
import styles from "@/styles/components/layout/navbar/NavItem.module.css";

interface NavItemProps {
  href: string;
  label: string;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ href, label, onClick }) => (
  <Link href={href} className={styles.navLink} onClick={onClick}>
    {label}
  </Link>
);

export { NavItem };
