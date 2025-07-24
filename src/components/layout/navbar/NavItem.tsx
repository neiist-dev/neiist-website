import Link from "next/link";
import React from "react";
import { IconType } from "react-icons";
import styles from "@/styles/components/layout/navbar/NavItem.module.css";

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

interface UserMenuItemProps {
  href: string;
  label: React.ReactNode;
  icon?: IconType;
  onClick?: () => void;
  className?: string;
}

const UserMenuItem: React.FC<UserMenuItemProps> = ({
  href,
  label,
  icon: Icon,
  onClick,
  className,
}) => {
  return (
    <div>
      <Link href={href} className={`${styles.menuItem} ${className || ""}`} onClick={onClick}>
        {Icon && (
          <span className={styles.icon}>
            <Icon />
          </span>
        )}
        {label}
      </Link>
    </div>
  );
};

export { NavItem, UserMenuItem };
